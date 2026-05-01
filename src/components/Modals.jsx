import React, { useContext, useRef, useState } from 'react';
import { X, Scale, Globe, Play, FileText, ShieldCheck, AlertTriangle, CheckCircle, Info, Download } from 'lucide-react';
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
        login
    } = useContext(AppContext);

    const reportRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleAuth = async (e) => {
        e.preventDefault();
        if (isRegister) {
            try {
                const response = await fetch('http://localhost:5000/api/auth/register', {
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
        if (!reportRef.current) return;
        setIsDownloading(true);
        try {
            addToast("Generating PDF report...", "info");
            const canvas = await html2canvas(reportRef.current, { backgroundColor: '#080f22' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
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
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}><Scale size={16} className="text-white" /></div>
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
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-black/20">
                            <div className="flex items-center gap-2.5">
                                <ShieldCheck size={18} className="text-emerald-400" />
                                <span className="text-white font-bold text-lg">Detailed Compliance Report</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-md disabled:opacity-50">
                                    <Download size={14} /> {isDownloading ? "Generating..." : "Download PDF"}
                                </button>
                                <button onClick={() => setShowReport(false)} className="text-white/50 hover:text-white transition-colors"><X size={18} /></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={reportRef} style={{ background: "#080f22" }}>
                            {isReportLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-indigo-400 gap-4">
                                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                    <p className="text-sm font-bold animate-pulse">Gemini is drafting your compliance report...</p>
                                </div>
                            ) : aiReport ? (
                                <div className="space-y-8 animate-fade-up">
                                    {aiReport.split('\n').map((line, i) => {
                                        const isHeader = line.includes('SUMMARY') || line.includes('ALIGNMENT') || line.includes('MITIGATIONS');
                                        return (
                                            <p key={i} className={`${isHeader ? 'text-indigo-400 font-black text-xs tracking-widest mt-6' : 'text-white/70 text-sm leading-relaxed'} whitespace-pre-wrap`}>
                                                {line}
                                            </p>
                                        );
                                    })}
                                </div>
                            ) : computedResult ? (
                                <>
                                    {/* Fallback to dynamic template if AI report is missing */}
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
                                    {/* ... other template content if needed ... */}
                                </>
                            ) : (
                                <div className="text-center py-20 text-white/30">
                                    <Info size={40} className="mx-auto mb-4 opacity-20" />
                                    <p>Please run an audit to generate a compliance report.</p>
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
        </>
    );
}
