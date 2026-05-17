import React, { useContext, useRef, useState } from 'react';
import { X, Scale, Play, FileText, ShieldCheck, AlertTriangle, CheckCircle, Info, Download } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function Modals() {
    const {
        showSignIn, setShowSignIn,
        showDemo, setShowDemo,
        showDocs, setShowDocs,
        showReport, setShowReport,
        toasts, addToast,
        attribute, outcome, computedResult, aiReport, isReportLoading,
        login,
        user
    } = useContext(AppContext);

    const reportRef = useRef(null);
    const headerRef = useRef(null);
    const contentRef = useRef(null);
    const footerRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleAuth = async (e) => {
        e.preventDefault();
        if (isRegister) {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, name })
                });
                const data = await response.json();
                if (response.ok) {
                    login(email, password);
                } else {
                    addToast(data.error || "Registration failed", "warning");
                }
            } catch (e) {
                addToast("Backend server unavailable", "warning");
            }
        } else {
            await login(email, password);
        }
    };

    const handleDownloadPDF = async () => {
        if (!headerRef.current || !contentRef.current || !footerRef.current) return;
        setIsDownloading(true);
        try {
            addToast("Generating PDF report...", "info");
            
            const headerCanvas = await html2canvas(headerRef.current, { backgroundColor: '#ffffff', scale: 2 });
            const contentCanvas = await html2canvas(contentRef.current, { backgroundColor: '#ffffff', scale: 2 });
            const footerCanvas = await html2canvas(footerRef.current, { backgroundColor: '#ffffff', scale: 2 });

            const headerImg = headerCanvas.toDataURL('image/png');
            const contentImg = contentCanvas.toDataURL('image/png');
            const footerImg = footerCanvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            const headerHeight = (headerCanvas.height * pdfWidth) / headerCanvas.width;
            const footerHeight = (footerCanvas.height * pdfWidth) / footerCanvas.width;
            const contentHeight = (contentCanvas.height * pdfWidth) / contentCanvas.width;
            
            const contentAreaHeight = pageHeight - headerHeight - footerHeight;

            let heightLeft = contentHeight;
            let yOffset = 0;
            let isFirstPage = true;

            while (heightLeft > 0) {
                if (!isFirstPage) {
                    pdf.addPage();
                }

                const contentY = headerHeight - yOffset;
                pdf.addImage(contentImg, 'PNG', 0, contentY, pdfWidth, contentHeight);

                pdf.setFillColor(255, 255, 255);
                pdf.rect(0, 0, pdfWidth, headerHeight, 'F');
                pdf.rect(0, pageHeight - footerHeight, pdfWidth, footerHeight, 'F');

                pdf.addImage(headerImg, 'PNG', 0, 0, pdfWidth, headerHeight);
                pdf.addImage(footerImg, 'PNG', 0, pageHeight - footerHeight, pdfWidth, footerHeight);

                heightLeft -= contentAreaHeight;
                yOffset += contentAreaHeight;
                isFirstPage = false;
            }

            pdf.save(`samatva_ai_audit_report_${new Date().getTime()}.pdf`);
            addToast("PDF generated successfully!", "success");
        } catch (error) {
            console.error("Failed to generate PDF", error);
            addToast("Failed to generate PDF", "error");
        }
        setIsDownloading(false);
    };

    return (
        <>
            {/* SIGN IN / REGISTER MODAL */}
            {showSignIn && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowSignIn(false)}>
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                    <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/[0.1] p-8" style={{ background: "rgba(8,15,34,0.97)", backdropFilter: "blur(30px)" }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowSignIn(false)} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"><X size={18} /></button>
                        <div className="flex items-center gap-2.5 mb-6">
                            <img src="/logo.png" alt="Samatva AI Logo" className="h-8 w-auto" />
                            <span className="text-white font-black text-lg">Samatva<span className="text-indigo-400">AI</span></span>
                        </div>
                        <h3 className="text-xl font-black text-white mb-1">{isRegister ? "Create Account" : "Welcome back"}</h3>
                        <p className="text-sm text-white/38 mb-6">{isRegister ? "Join the governance revolution" : "Sign in to your governance dashboard"}</p>
                        <form onSubmit={handleAuth} className="space-y-4">
                            {isRegister && (
                                <div>
                                    <label className="text-xs font-semibold text-white/45 uppercase tracking-wider block mb-1.5">Full Name</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full text-sm text-white bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-white/20" required />
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-semibold text-white/45 uppercase tracking-wider block mb-1.5">Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full text-sm text-white bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-white/20" required />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-white/45 uppercase tracking-wider block mb-1.5">Password</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full text-sm text-white bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none transition-colors placeholder:text-white/20" required />
                            </div>
                            <button type="submit" className="w-full text-sm font-bold text-white py-2.5 rounded-xl active:scale-95 transition-all" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
                                {isRegister ? "Sign Up" : "Sign In"}
                            </button>
                            <p className="text-center text-xs text-white/30 mt-4">
                                {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                                <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-indigo-400 font-bold hover:underline">
                                    {isRegister ? "Sign In" : "Sign Up"}
                                </button>
                            </p>
                        </form>
                    </div>
                </div>
            )}


            {/* DEMO MODAL */}
            {showDemo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowDemo(false)}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <div className="relative w-full max-w-3xl mx-4 rounded-2xl border border-white/[0.1] overflow-hidden" style={{ background: "rgba(8,15,34,0.97)" }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowDemo(false)} className="absolute top-4 right-4 z-10 text-white/50 hover:text-white transition-colors bg-black/50 rounded-full p-1.5"><X size={18} /></button>
                        <div className="aspect-video bg-black/50 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 0 60px rgba(99,102,241,0.4)" }}>
                                    <Play size={32} className="text-white fill-white ml-1" />
                                </div>
                                <p className="text-white/50 text-sm font-semibold">Samatva AI Platform Demo</p>
                                <p className="text-white/25 text-xs mt-1">2 min · Product walkthrough</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DOCS MODAL */}
            {showDocs && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowDocs(false)}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <div className="relative w-full max-w-4xl mx-4 rounded-2xl border border-white/[0.1] overflow-hidden flex flex-col h-[80vh]" style={{ background: "rgba(8,15,34,0.97)" }} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                            <div className="flex items-center gap-2.5">
                                <FileText size={18} className="text-indigo-400" />
                                <span className="text-white font-bold text-lg">Documentation Portal</span>
                            </div>
                            <button onClick={() => setShowDocs(false)} className="text-white/50 hover:text-white transition-colors"><X size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 text-white/70 space-y-6">
                            <section>
                                <h3 className="text-xl font-bold text-white mb-2">What is the Documentation Portal?</h3>
                                <p className="text-sm leading-relaxed mb-4">The Samatva AI Documentation Portal provides comprehensive guides and references for developers, compliance officers, and AI ethicists to integrate and understand our fairness auditing engine.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                                        <h4 className="font-bold text-white mb-1">API Reference</h4>
                                        <p className="text-xs">Detailed endpoints for submitting model predictions and receiving bias scores programmatically.</p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                                        <h4 className="font-bold text-white mb-1">Compliance Mappings</h4>
                                        <p className="text-xs">How our metrics map to specific clauses in the EU AI Act 2026, EEOC 4/5ths Rule, and India AI Act.</p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                                        <h4 className="font-bold text-white mb-1">Integration Guides</h4>
                                        <p className="text-xs">Step-by-step tutorials for adding Samatva AI to CI/CD pipelines and LLM orchestration frameworks.</p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                                        <h4 className="font-bold text-white mb-1">Fairness Metrics Glossary</h4>
                                        <p className="text-xs">Mathematical definitions for Disparate Impact, Demographic Parity, and Equalized Odds.</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {/* FULL REPORT MODAL */}
            {showReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowReport(false)}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <div className="relative w-full max-w-3xl mx-4 rounded-2xl border border-white/[0.1] overflow-hidden flex flex-col max-h-[85vh]" style={{ background: "rgba(8,15,34,0.97)" }} onClick={e => e.stopPropagation()}>
                        
                        {/* Modal toolbar */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-black/20 flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <ShieldCheck size={18} className="text-emerald-400" />
                                <span className="text-white font-bold text-lg">AI Bias Audit — Official Compliance Report</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-md disabled:opacity-50">
                                    <Download size={14} /> {isDownloading ? "Generating..." : "Download PDF"}
                                </button>
                                <button onClick={() => setShowReport(false)} className="text-white/50 hover:text-white transition-colors"><X size={18} /></button>
                            </div>
                        </div>

                        {/* Report body */}
                        <div className="flex-1 overflow-y-auto" ref={reportRef} style={{ background: "#080f22" }}>
                            {isReportLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-indigo-400 gap-4">
                                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                    <p className="text-sm font-bold animate-pulse">Gemini is drafting your compliance report...</p>
                                </div>
                            ) : aiReport ? (() => {
                                // ── Parse sections from Gemini output ──────────────────
                                const HEADER_RE = /^(AUDIT METADATA|EXECUTIVE SUMMARY|DETAILED FINDINGS|REGULATORY ALIGNMENT|RECOMMENDED MITIGATIONS|DEBIASING ACTION PLAN|RE-AUDIT RECOMMENDATION|CONCLUSION)/i;
                                const rawLines = aiReport.split('\n');
                                const sections = [];
                                let cur = null;
                                for (const line of rawLines) {
                                    const t = line.trim();
                                    if (!t) continue;
                                    if (HEADER_RE.test(t)) {
                                        if (cur) sections.push(cur);
                                        cur = { title: t, lines: [] };
                                    } else if (cur) {
                                        cur.lines.push(t);
                                    }
                                }
                                if (cur) sections.push(cur);

                                const reportId = `SAM-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
                                const reportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

                                return (
                                    <div className="p-8 space-y-0 animate-fade-up">

                                        {/* ── Document header ── */}
                                        <div className="mb-8">
                                            <div className="flex items-start justify-between mb-6">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-2">Samatva AI · Automated Governance Platform</p>
                                                    <h1 className="text-2xl font-black text-white leading-tight">AI Bias Audit<br/><span className="text-indigo-400">Compliance Report</span></h1>
                                                    <p className="text-sm text-white/40 mt-2 font-medium">{outcome} &nbsp;·&nbsp; Protected Attribute: {attribute}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-6">
                                                    <div className="inline-block border border-white/[0.08] rounded-xl px-4 py-3 bg-white/[0.02]">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1">Report Reference</p>
                                                        <p className="text-sm font-mono font-bold text-indigo-300">{reportId}</p>
                                                        <p className="text-[10px] text-white/30 mt-1.5">{reportDate}</p>
                                                        <p className="text-[9px] text-white/20 mt-1">Issued by: {user?.name || user?.email || 'Guest Auditor'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* KPI summary row */}
                                            {computedResult && (
                                                <div className="grid grid-cols-4 gap-3 mb-6">
                                                    {[
                                                        { label: "Fairness Score", value: `${(computedResult.score * 100).toFixed(1)}%`, color: computedResult.score < 0.8 ? "#f43f5e" : "#10b981", bg: computedResult.score < 0.8 ? "rgba(244,63,94,0.08)" : "rgba(16,185,129,0.08)" },
                                                        { label: "Risk Severity", value: computedResult.sev, color: computedResult.sev === 'Critical' ? "#f43f5e" : computedResult.sev === 'High' ? "#f97316" : "#f59e0b", bg: "rgba(255,255,255,0.02)" },
                                                        { label: "Records Analyzed", value: computedResult.totalRows?.toLocaleString() || 'N/A', color: "#c7d2fe", bg: "rgba(255,255,255,0.02)" },
                                                        { label: "Approval Gap", value: computedResult.gap, color: "#f43f5e", bg: "rgba(244,63,94,0.06)" },
                                                    ].map((k, i) => (
                                                        <div key={i} className="rounded-xl p-3 border border-white/[0.06]" style={{ background: k.bg }}>
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1.5">{k.label}</p>
                                                            <p className="text-base font-black" style={{ color: k.color }}>{k.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Compliance status banner */}
                                            {computedResult && (
                                                <div className={`flex items-center gap-3 p-4 rounded-xl border ${computedResult.score < 0.8 ? 'border-rose-500/25 bg-rose-500/5' : 'border-emerald-500/25 bg-emerald-500/5'}`}>
                                                    {computedResult.score < 0.8
                                                        ? <AlertTriangle size={18} className="text-rose-400 flex-shrink-0" />
                                                        : <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />}
                                                    <div>
                                                        <p className={`text-xs font-black uppercase tracking-widest ${computedResult.score < 0.8 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                            {computedResult.score < 0.8 ? '⚠ Non-Compliant — Immediate Remediation Required' : '✓ Compliant — Within Regulatory Threshold'}
                                                        </p>
                                                        <p className="text-[11px] text-white/40 mt-0.5">
                                                            Regulatory minimum Disparate Impact Score: 0.80 &nbsp;·&nbsp; Audited score: {computedResult.score.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* ── Sections ── */}
                                        {sections.map((sec, si) => (
                                            <div key={si} className="mb-8">
                                                {/* Section divider + title */}
                                                <div className="flex items-center gap-4 mb-5">
                                                    <div className="h-px flex-1" style={{ background: "rgba(99,102,241,0.2)" }} />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400 whitespace-nowrap flex-shrink-0">{sec.title}</p>
                                                    <div className="h-px flex-1" style={{ background: "rgba(99,102,241,0.2)" }} />
                                                </div>

                                                {/* Section content */}
                                                <div className="space-y-3 pl-1">
                                                    {sec.lines.map((para, pi) => {
                                                        // Numbered step: "1. Do this thing"
                                                        const numMatch = para.match(/^(\d+)\.\s+(.+)/);
                                                        if (numMatch) {
                                                            return (
                                                                <div key={pi} className="flex items-start gap-3">
                                                                    <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5" style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>{numMatch[1]}</span>
                                                                    <p className="text-white/70 text-sm leading-relaxed pt-0.5">{numMatch[2]}</p>
                                                                </div>
                                                            );
                                                        }
                                                        // Framework sub-item: "EU AI Act —" or "1. EU AI Act"
                                                        if (/^(EU AI Act|US EEOC|India|EEOC)/i.test(para.replace(/^\d+\.\s*/, ''))) {
                                                            return (
                                                                <div key={pi} className="flex items-start gap-3 pl-2">
                                                                    <span className="text-indigo-400 font-black text-xs flex-shrink-0 mt-0.5">▸</span>
                                                                    <p className="text-white/65 text-sm leading-relaxed">{para.replace(/^\d+\.\s*/, '')}</p>
                                                                </div>
                                                            );
                                                        }
                                                        // Regular paragraph
                                                        return (
                                                            <p key={pi} className="text-white/65 text-sm leading-[1.8]">{para}</p>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {/* ── Document footer ── */}
                                        <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between">
                                            <p className="text-[9px] text-white/20 uppercase tracking-widest">Samatva AI · Automated Compliance Report · {reportId}</p>
                                            <p className="text-[9px] text-white/20 uppercase tracking-widest">Confidential · For Internal Use Only</p>
                                        </div>
                                    </div>
                                );
                            })() : computedResult ? (
                                <div className="p-8">
                                    <div className={`border rounded-xl p-4 flex items-start gap-3 ${computedResult.score < 0.8 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                        {computedResult.score < 0.8 ? <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" /> : <CheckCircle size={20} className="text-emerald-400 shrink-0 mt-0.5" />}
                                        <div>
                                            <h4 className={`text-sm font-bold mb-1 ${computedResult.score < 0.8 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {computedResult.score < 0.8 ? `Critical Bias Detected: ${attribute}` : `Compliance Pass: ${attribute}`}
                                            </h4>
                                            <p className={`text-xs leading-relaxed ${computedResult.score < 0.8 ? 'text-rose-400/80' : 'text-emerald-400/80'}`}>
                                                {computedResult.score < 0.8
                                                    ? `The audited model shows significant disparity in ${outcome} based on ${attribute} (Score: ${computedResult.score.toFixed(2)}).`
                                                    : `The audited model meets fairness standards for ${outcome} across ${attribute} groups (Score: ${computedResult.score.toFixed(2)}).`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-white/30">
                                    <Info size={40} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-sm">Run an audit first to generate the compliance report.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATIONS */}
            <div className="fixed bottom-6 right-6 z-[110] space-y-2" style={{ fontFamily: "'Inter',sans-serif" }}>
                {toasts.map(t => (
                    <div key={t.id} className="flex items-center gap-3 rounded-xl px-4 py-3 border shadow-2xl fade-up min-w-[280px]"
                        style={{
                            background: "rgba(8,15,34,0.95)", backdropFilter: "blur(20px)",
                            borderColor: t.type === "success" ? "rgba(16,185,129,0.3)" : t.type === "warning" ? "rgba(245,158,11,0.3)" : "rgba(99,102,241,0.3)",
                        }}>
                        {t.type === "success" ? <CheckCircle size={15} className="text-emerald-400 shrink-0" /> : t.type === "warning" ? <AlertTriangle size={15} className="text-amber-400 shrink-0" /> : <Info size={15} className="text-indigo-400 shrink-0" />}
                        <p className="text-xs font-semibold text-white/70">{t.msg}</p>
                    </div>
                ))}
            </div>

            {/* HIDDEN BRANDED PDF TEMPLATE (LIGHT THEME) */}
            <div className="fixed left-[-9999px] top-[-9999px] z-[-1] overflow-hidden bg-white">
                {/* Header Template */}
                <div ref={headerRef} className="w-[800px] bg-white text-slate-900 px-12 pt-12 pb-4" style={{ fontFamily: "Arial, sans-serif" }}>
                    <div className="flex items-center justify-between border-b-2 border-slate-200 pb-6">
                        <div className="flex items-center gap-3">
                            {!logoError ? (
                                <img src="/logo.png" alt="Samatva AI Logo" className="h-10 w-auto" onError={() => setLogoError(true)} />
                            ) : (
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-600">
                                    <Scale size={20} className="text-white" />
                                </div>
                            )}
                            <span className="font-black text-2xl text-slate-900 tracking-tight">Samatva<span className="text-indigo-600">AI</span></span>
                        </div>
                        <div className="text-right">
                            <h1 className="text-xl font-black text-slate-800 uppercase tracking-widest">Compliance Report</h1>
                            <p className="text-sm font-semibold text-slate-500 mt-1">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Content Template (Metadata + Text) */}
                <div ref={contentRef} className="w-[800px] bg-white text-slate-900 px-12 py-4" style={{ fontFamily: "Arial, sans-serif" }}>
                    {/* Metadata */}
                    <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-200 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Generated By</p>
                            <p className="text-sm font-semibold text-slate-800">{user?.name || user?.email || "Guest Auditor"}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Audit Target</p>
                            <p className="text-sm font-semibold text-slate-800">{outcome} / {attribute}</p>
                        </div>
                        {computedResult && (
                            <>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fairness Score</p>
                                    <p className={`text-sm font-black ${computedResult.score < 0.8 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {(computedResult.score * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                    <p className={`text-sm font-black ${computedResult.score < 0.8 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {computedResult.score < 0.8 ? "High Risk" : "Compliant"}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Report Content */}
                    <div className="space-y-4 min-h-[400px]">
                        {aiReport ? (
                            aiReport.split('\n').map((line, i) => {
                                const isHeader = /^(AUDIT METADATA|EXECUTIVE SUMMARY|DETAILED FINDINGS|REGULATORY ALIGNMENT|RECOMMENDED MITIGATIONS|DEBIASING ACTION PLAN|RE-AUDIT RECOMMENDATION|CONCLUSION)/i.test(line.trim());
                                return (
                                    <p key={i} className={`${isHeader ? 'text-indigo-700 font-black text-sm tracking-widest mt-8 border-b border-slate-200 pb-2 mb-4' : 'text-slate-700 text-sm leading-relaxed'} whitespace-pre-wrap`}>
                                        {line}
                                    </p>
                                );
                            })
                        ) : computedResult ? (
                            <div className="text-slate-700 text-sm leading-relaxed">
                                {computedResult.score < 0.8 
                                    ? `The audited model shows significant disparity in ${outcome} based on ${attribute} (Score: ${computedResult.score.toFixed(2)}).` 
                                    : `The audited model meets fairness standards for ${outcome} across ${attribute} groups (Score: ${computedResult.score.toFixed(2)}).`}
                            </div>
                        ) : (
                            <p className="text-slate-500 italic">No detailed AI report generated for this audit.</p>
                        )}
                    </div>
                </div>

                {/* Footer Template */}
                <div ref={footerRef} className="w-[800px] bg-white text-slate-900 px-12 pt-4 pb-12" style={{ fontFamily: "Arial, sans-serif" }}>
                    <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
                        <p className="font-semibold">This official report is automatically generated by Samatva AI Platform.</p>
                        <p className="font-bold text-indigo-600">Samatva AI</p>
                    </div>
                </div>
            </div>
        </>
    );
}
