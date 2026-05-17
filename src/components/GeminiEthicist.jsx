import React, { useState, useEffect, useContext } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function GeminiEthicist({ isAuditRunning }) {
    const { user, attribute, outcome, computedResult, addToast, setAiReport, setIsReportLoading } = useContext(AppContext);
    const [analysisText, setAnalysisText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [typedText, setTypedText] = useState("");
    const [typingKey, setTypingKey] = useState(0);

    const auditKey = `${attribute}|${outcome}`;

    const getFallbackText = () => {
        if (computedResult) {
            const high = computedResult.g[0];
            const low = computedResult.g[computedResult.g.length - 1];
            return `Analysis of ${computedResult.totalRows.toLocaleString()} records: The ${attribute} attribute shows a disparate impact score of ${computedResult.score.toFixed(2)} for ${outcome}. The ${high.group} group has a ${high.rate}% positive rate vs ${low.rate}% for ${low.group} — a ${computedResult.gap} gap. ${computedResult.sev === 'Critical' || computedResult.sev === 'High' ? 'This constitutes a significant fairness violation under the 4/5ths rule and likely violates EU AI Act Article 10.' : 'While the gap exists, it falls within borderline compliance. Continuous monitoring is recommended.'}`;
        }
        return "Applicant #402, despite identical financial records, was denied solely based on gender. This is the systematic digitisation of historical prejudice, perpetuating intergenerational wealth gaps. The model has learned to use gender as a proxy for creditworthiness, a pattern that directly violates EEOC and EU AI Act Article 10 requirements.";
    };

    // Try direct Gemini call from browser (works on Vercel with no backend)
    const callGeminiFrontend = async () => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("No API key");

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

        const score = computedResult?.score || 0.74;
        const lowGroup = computedResult?.g[computedResult.g.length - 1]?.group || "Underrepresented";
        const lowRate = computedResult?.g[computedResult.g.length - 1]?.rate || 0;
        const highGroup = computedResult?.g[0]?.group || "Majority";
        const highRate = computedResult?.g[0]?.rate || 0;

        const allGroups = computedResult?.g?.map(g => `${g.group}: ${g.rate}%`).join(', ') || `${highGroup}: ${highRate}%, ${lowGroup}: ${lowRate}%`;
        const severity = computedResult?.sev || (score < 0.6 ? 'Critical' : score < 0.8 ? 'High' : 'Low');
        const gap = computedResult?.gap || `–${highRate - lowRate}pp`;
        const totalRows = computedResult?.totalRows || 'N/A';

        const ethicistPrompt = `You are a senior AI Ethicist and Compliance Officer issuing a formal finding.
Audit: Protected Attribute="${attribute}", Decision Outcome="${outcome}".
Dataset: ${totalRows} records analyzed. Disparate Impact Score=${score} (threshold: 0.80). Severity=${severity}.
Group breakdown: ${allGroups}. Approval gap=${gap}.
Write a precise, authoritative 2-3 sentence ethical assessment of the bias found. No bullet points. No formatting. Plain sentences only.`;

        const reportPrompt = `You are a senior AI Compliance Officer. Write a comprehensive, formal AI Bias Audit Report. Do not use markdown. Use ALL CAPS for every section title. Write in full paragraphs, not bullet points.

AUDIT METADATA
Protected Attribute audited: ${attribute}. Decision outcome audited: ${outcome}. Total records analyzed: ${totalRows}. Disparate Impact Score: ${score} (regulatory threshold is 0.80 — scores below this indicate illegal bias). Risk severity classification: ${severity}. Group approval rates: ${allGroups}. Approval rate gap: ${gap}.

EXECUTIVE SUMMARY
Write 3-4 sentences summarizing what bias was found, which group is disadvantaged (${lowGroup} at ${lowRate}% vs ${highGroup} at ${highRate}%), the magnitude of harm, and the urgency of remediation.

DETAILED FINDINGS
Write 3-4 sentences explaining the statistical findings in depth. Describe what the ${score} Disparate Impact Score means in plain terms, how the ${gap} gap manifests in real decisions (e.g., loan denials, hiring rejections), and how many people are likely affected across ${totalRows} records.

REGULATORY ALIGNMENT
Analyze compliance against three frameworks:
1. EU AI Act 2024 — state whether this system qualifies as high-risk under Annex III and which specific articles (Article 10, 13, 14) are violated.
2. US EEOC 4/5ths Rule — state whether the ${score} score constitutes disparate impact under Title VII and the legal exposure.
3. India Digital Personal Data Protection Act / India AI Governance Framework — state the obligations around fairness and explainability.

RECOMMENDED MITIGATIONS — PHASE 1: DATA
Provide 3 concrete data-level remediation steps specific to fixing bias in ${attribute} for ${outcome} predictions. Write each as an actionable instruction, not a suggestion.

RECOMMENDED MITIGATIONS — PHASE 2: MODEL
Provide 3 concrete model-level steps: applying fairness constraints or adversarial debiasing during retraining, setting a minimum Disparate Impact Score of 0.80 as a deployment gate, and validating on a held-out fairness benchmark before any production release.

RECOMMENDED MITIGATIONS — PHASE 3: GOVERNANCE
Provide 3 governance steps: appointing a Fairness Officer, documenting all mitigation steps for regulatory audit trails (EU AI Act Article 13), and implementing continuous automated monitoring with alerts when the live ${attribute} → ${outcome} score drops below 0.80.

DEBIASING ACTION PLAN SUMMARY
Write a clear, numbered 9-step action plan summarizing all remediation steps across data, model, and governance phases. Each step should be one sentence and directly actionable. Number them 1 through 9.

RE-AUDIT RECOMMENDATION
Write 2-3 sentences explaining that after applying the above debiasing steps, the organization must upload their corrected dataset and re-run this audit using the Re-Audit After Fix feature to validate the improvement. State that a score of 0.80 or above is required for regulatory compliance, and that the before-and-after score comparison will be automatically generated to document the remediation for auditors.

CONCLUSION
Write 2-3 closing sentences on why eliminating this bias is both a legal obligation and a strategic imperative — covering legal risk reduction, ethical responsibility, and the business benefit of serving all demographic groups equitably.`;

        let lastError = null;
        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const [ethicistResult, reportResult] = await Promise.all([
                    model.generateContent(ethicistPrompt),
                    model.generateContent(reportPrompt),
                ]);
                return {
                    analysis: ethicistResult.response.text(),
                    report: reportResult.response.text(),
                    model: modelName,
                };
            } catch (err) {
                lastError = err;
            }
        }
        throw lastError || new Error("All Gemini models failed");
    };

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (isAuditRunning) return;

            setIsLoading(true);
            setAnalysisText("");

            try {
                // 1️⃣ Try direct Gemini call first (works on Vercel, no backend needed)
                const data = await callGeminiFrontend();
                setAnalysisText(data.analysis);
                setAiReport(data.report);
                console.log(`[Frontend] Direct Gemini call success (${data.model})`);
            } catch (frontendErr) {
                console.warn("[Frontend] Direct Gemini call failed, trying backend...", frontendErr.message);
                try {
                    // 2️⃣ Fall back to backend if available
                    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const response = await fetch(`${API_BASE_URL}/api/audit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            attribute,
                            outcome,
                            score: computedResult?.score || 0.74,
                            lowGroup: computedResult?.g[computedResult.g.length - 1]?.group || "Underrepresented",
                            lowRate: computedResult?.g[computedResult.g.length - 1]?.rate || 0,
                            highGroup: computedResult?.g[0]?.group || "Majority",
                            highRate: computedResult?.g[0]?.rate || 0,
                            userId: user?.id
                        })
                    });
                    if (!response.ok) throw new Error("Backend API failure");
                    const data = await response.json();
                    setAnalysisText(data.analysis);
                    setAiReport(data.report);
                    console.log(`[Frontend] Backend call success (${data.model})`);
                } catch (backendErr) {
                    // 3️⃣ Final fallback: use computed data to generate local analysis
                    console.warn("[Frontend] Backend also failed, using local fallback.");
                    setAnalysisText(getFallbackText());
                }
            } finally {
                setIsLoading(false);
                setIsReportLoading(false);
            }
        };

        fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attribute, outcome, computedResult, isAuditRunning]);

    // Typing effect
    useEffect(() => {
        if (isLoading || !analysisText) return;
        let i = 0;
        setTypedText("");
        setTypingKey(prev => prev + 1);
        const interval = setInterval(() => {
            if (i < analysisText.length) {
                setTypedText(analysisText.substring(0, i + 1));
                i++;
            } else {
                clearInterval(interval);
            }
        }, 15);
        return () => clearInterval(interval);
    }, [analysisText, isLoading]);

    return (
        <div className="relative rounded-2xl p-6 overflow-hidden border border-indigo-500/15"
            style={{ background: "rgba(99,102,241,0.04)", boxShadow: "0 0 80px rgba(99,102,241,0.08)" }}>
            <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: "radial-gradient(ellipse at 80% 50%, rgba(99,102,241,0.1) 0%, transparent 60%)" }} />
            <div className="relative flex items-start sm:items-center justify-between gap-4 mb-6 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-indigo-400/30"
                        style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))" }}>
                        <Sparkles size={18} className="text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-base flex items-center gap-2">
                            Gemini AI Ethicist
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Live Analysis
                            </span>
                        </h2>
                        <p className="text-xs text-indigo-300/60 mt-0.5">Automated compliance reasoning</p>
                    </div>
                </div>
            </div>

            <div className="min-h-[80px]">
                {isLoading ? (
                    <div className="flex items-center gap-3 text-indigo-400/70 text-sm">
                        <Loader2 size={16} className="animate-spin" />
                        Analyzing algorithmic fairness and generating ethical guidance...
                    </div>
                ) : (
                    <p className="text-white/80 text-sm leading-relaxed" key={typingKey}>
                        {typedText}
                        {typedText.length < analysisText.length && (
                            <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-indigo-400 animate-pulse align-middle" />
                        )}
                    </p>
                )}
            </div>
        </div>
    );
}
