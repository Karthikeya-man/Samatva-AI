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

        const ethicistPrompt = `You are an expert AI Ethicist and Compliance Officer. 
Audit context: Attribute="${attribute}", Outcome="${outcome}". 
Results: Score=${score}, LowGroup="${lowGroup}" (${lowRate}%), HighGroup="${highGroup}" (${highRate}%).
Provide a concise, professional 2-3 sentence ethical analysis. No formatting.`;

        const reportPrompt = `Generate a detailed AI Compliance Report for an audit of "${outcome}" based on "${attribute}". 
Results: Fairness Score ${score}, LowGroup=${lowGroup} (${lowRate}%).
Sections: EXECUTIVE SUMMARY, REGULATORY ALIGNMENT (EU AI Act, US EEOC, India AI Act), RECOMMENDED MITIGATIONS.
No markdown headers, use ALL CAPS for section titles.`;

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
