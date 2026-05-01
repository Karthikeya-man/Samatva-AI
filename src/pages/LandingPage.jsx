import { useState, useEffect, useContext } from "react";
import {
    Scale, UploadCloud, AlertTriangle, CheckCircle, XCircle,
    ChevronDown, Sparkles, ShieldCheck, Globe, TrendingDown,
    FileText, CircleDot, ArrowRight, Info, BarChart3, Layers,
    Menu, X, Play, ArrowUpRight, Zap, Eye, Lock, ChevronRight,
    Star, Users, Activity, Shield, Bot, Brain,
    TrendingUp, RefreshCw, AlertCircle, Award, Gauge, Cpu, Network, Clock
} from "lucide-react";
import { AppContext } from "../context/AppContext";

// ── Static data ─────────────────────────────────────────────────
const heroStats = [
    { value: "14M+", label: "Decisions Audited" },
    { value: "99.2%", label: "Detection Accuracy" },
    { value: "2,100+", label: "LLMs Monitored" },
    { value: "ISO 42001", label: "Certified" },
];

const trustBadges = [
    { icon: <Shield size={12} />, text: "SOC 2 Type II" },
    { icon: <Lock size={12} />, text: "GDPR Compliant" },
    { icon: <Star size={12} />, text: "4.9 / 5 on G2" },
    { icon: <Users size={12} />, text: "500+ Enterprises" },
];

const tickerModels = [
    "GPT-4o", "Gemini 1.5 Pro", "Claude 3.7 Sonnet", "Llama 3.3 70B",
    "Mistral Large 2", "Grok-2", "Gemma 3", "Phi-4", "Command R+", "DeepSeek-V3",
    "GPT-4o", "Gemini 1.5 Pro", "Claude 3.7 Sonnet", "Llama 3.3 70B",
    "Mistral Large 2", "Grok-2", "Gemma 3", "Phi-4", "Command R+", "DeepSeek-V3",
];

const whyNowStats = [
    { value: "76%", label: "of AI models contain demographic bias", icon: <AlertTriangle size={22} />, val: "text-rose-400" },
    { value: "\u20ac35M", label: "max fine under EU AI Act 2026", icon: <Globe size={22} />, val: "text-amber-400" },
    { value: "12%", label: "of companies audit their AI models today", icon: <Shield size={22} />, val: "text-indigo-400" },
];

const timeline = [
    { year: "2021", event: "EU AI Act Proposed", desc: "First comprehensive AI regulation framework introduced by the European Commission." },
    { year: "2023", event: "Generative AI Explosion", desc: "ChatGPT, Gemini & Claude trigger global concern over unaudited AI deployment." },
    { year: "2024", event: "EU AI Act Enforced", desc: "High-risk AI systems face mandatory bias audits and conformity assessments." },
    { year: "2024", event: "India AI Act Framework", desc: "India establishes its AI governance roadmap focusing on digital safety and ethical innovation." },
    { year: "2025", event: "US AI Executive Order", desc: "Federal agencies required to audit all AI procurement for fairness violations." },
    { year: "2026", event: "Global Compliance Race", desc: "40+ countries enact AI governance laws. Audit platforms become mandatory." },
];

const featurePillars = [
    { icon: <Brain size={22} />, accent: "#818cf8", tag: "LLM Governance", title: "LLM Bias Detection", desc: "Audit large language models for demographic bias, toxicity, and stereotyping across 40+ protected categories in real-time." },
    { icon: <Eye size={22} />, accent: "#22d3ee", tag: "RAG Safety", title: "Hallucination Auditing", desc: "Detect factual drift and hallucination patterns in RAG pipelines before they reach production users." },
    { icon: <Network size={22} />, accent: "#c084fc", tag: "Agentic AI", title: "Multi-Agent Oversight", desc: "Monitor autonomous AI agents for goal misalignment, scope creep, and emergent bias in multi-step reasoning chains." },
    { icon: <Globe size={22} />, accent: "#2dd4bf", tag: "Regulatory", title: "Global Compliance", desc: "Automated compliance checks against EU AI Act 2026, US AI EO, India AI Act, and ISO 42001:2023." },
    { icon: <Activity size={22} />, accent: "#fbbf24", tag: "Monitoring", title: "Model Drift Detection", desc: "Continuously track post-deployment model behavior. Catch fairness regression before it becomes a legal liability." },
];

export default function LandingPage() {
    const { setShowSignIn, setShowDemo } = useContext(AppContext);
    
    return (
        <div style={{ background: "#040714" }} className="min-h-screen">
            
            {/* HERO */}
            <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
                {/* Background Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
                
                <div className="max-w-7xl mx-auto px-5 sm:px-8 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 mb-8 animate-fade-up">
                        <Sparkles size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">The Future of AI Governance</span>
                    </div>
                    
                    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[0.9] mb-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
                        Audit your AI.<br />
                        <span style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Eliminate Bias.</span>
                    </h1>
                    
                    <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/40 font-medium leading-relaxed mb-10 animate-fade-up" style={{ animationDelay: "200ms" }}>
                        The enterprise-grade platform for LLM fairness auditing, regulatory compliance monitoring, and autonomous agent oversight.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up" style={{ animationDelay: "300ms" }}>
                        <button onClick={() => window.location.href='/dashboard'} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-black font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl">
                            Launch Live Audit
                        </button>
                        <button onClick={() => setShowDemo(true)} className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 text-white font-black text-sm hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-2">
                            <Play size={16} className="fill-white" /> Watch Demo
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-white/5 pt-12 animate-fade-up" style={{ animationDelay: "400ms" }}>
                        {heroStats.map((s, i) => (
                            <div key={i}>
                                <p className="text-2xl font-black text-white mb-1">{s.value}</p>
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TICKER */}
            <div className="py-12 border-y border-white/[0.04] bg-white/[0.01] overflow-hidden whitespace-nowrap no-scrollbar">
                <div className="flex items-center gap-12 ticker-track">
                    {tickerModels.map((m, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                            <span className="text-xs font-black text-white/20 uppercase tracking-widest">{m} Audited</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* WHY NOW */}
            <section className="py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6">AI Governance is no longer optional.</h2>
                        <p className="text-white/40 text-lg max-w-2xl mx-auto">Demographic bias in LLMs and RAG pipelines is creating massive legal and societal liabilities.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {whyNowStats.map((s, i) => (
                            <div key={i} className="p-8 rounded-3xl border border-white/[0.06] bg-white/[0.02] flex flex-col items-center text-center">
                                <div className={`mb-6 ${s.val}`}>{s.icon}</div>
                                <h3 className={`text-4xl font-black mb-2 ${s.val}`}>{s.value}</h3>
                                <p className="text-white/40 font-bold text-sm leading-relaxed">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TIMELINE */}
            <section className="py-24 bg-white/[0.01] border-y border-white/[0.04]">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-12 text-center">The Compliance Roadmap</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        {timeline.map((t, i) => (
                            <div key={i} className="relative pt-8 text-center border-t border-white/5">
                                <p className="text-indigo-400 font-black text-sm mb-2">{t.year}</p>
                                <p className="text-white font-bold text-xs mb-3">{t.event}</p>
                                <p className="text-white/28 text-[10px] leading-relaxed">{t.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="text-center mb-16">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-400/10 px-4 py-2 rounded-full border border-indigo-400/20">Platform Pillars</span>
                        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mt-6">Everything you need for AI trust.</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {featurePillars.map((f, i) => (
                            <div key={i} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] group hover:border-indigo-500/30 transition-all cursor-pointer">
                                <div className="mb-6" style={{ color: f.accent }}>{f.icon}</div>
                                <span className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: f.accent }}>{f.tag}</span>
                                <h3 className="text-white font-bold text-sm mb-3 leading-tight">{f.title}</h3>
                                <p className="text-white/30 text-xs leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}