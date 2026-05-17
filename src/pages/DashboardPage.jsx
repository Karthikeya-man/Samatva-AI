import { useState, useEffect, useContext, useRef, useMemo } from "react";
import Papa from "papaparse";
import {
    Scale, UploadCloud, AlertTriangle, CheckCircle, XCircle,
    ChevronDown, Sparkles, ShieldCheck, Globe, TrendingDown,
    FileText, CircleDot, ArrowRight, Info, BarChart3, Layers,
    Menu, X, Play, ArrowUpRight, Zap, Eye, Lock, ChevronRight,
    Star, Users, Activity, Shield, Bot, Brain,
    TrendingUp, RefreshCw, AlertCircle, Award, Gauge, Cpu, Network, Clock
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, LabelList, AreaChart, Area, Legend
} from "recharts";
import { AppContext } from "../context/AppContext";
import GeminiEthicist from "../components/GeminiEthicist";

// ── Static data constants ───────────────────────────────────────
const GEMINI_TEXT = "Applicant #402, despite identical financial records — credit score 742, income $68,400 — was denied solely based on gender. This is the systematic digitisation of historical prejudice, perpetuating intergenerational wealth gaps across 2,341 similar cases detected in this dataset. The model has learned to use gender as a proxy for creditworthiness, a pattern that directly violates EEOC and EU AI Act Article 10 requirements.";

const leaderboard = [
    { rank: 1, model: "GPT-4o", provider: "OpenAI", fairness: 91, compliance: "PASS", trend: "+2.1%", up: true },
    { rank: 2, model: "Gemini 1.5 Pro", provider: "Google DeepMind", fairness: 88, compliance: "PASS", trend: "+1.4%", up: true },
    { rank: 3, model: "Claude 3.7 Sonnet", provider: "Anthropic", fairness: 83, compliance: "WARN", trend: "-0.8%", up: false },
    { rank: 4, model: "Llama 3.3 70B", provider: "Meta AI", fairness: 72, compliance: "FAIL", trend: "-3.2%", up: false },
    { rank: 5, model: "Mistral Large 2", provider: "Mistral AI", fairness: 67, compliance: "FAIL", trend: "+0.5%", up: true },
];

// ethicistMap removed as it's handled by GeminiEthicist component

const kpiCards = [
    { label: "Models Under Audit", value: "12", sub: "3 critical alerts", Icon: Brain, accent: "#818cf8" },
    { label: "Bias Incidents Today", value: "3", sub: "↑ 2 from yesterday", Icon: AlertCircle, accent: "#f43f5e" },
    { label: "Avg Fairness Score", value: "74.2%", sub: "↓ 1.3% this week", Icon: Gauge, accent: "#f59e0b" },
    { label: "Compliance Coverage", value: "4/6", sub: "2 frameworks failing", Icon: ShieldCheck, accent: "#14b8a6" },
];

const aiTrendData = [
    { year: "'20", models: 12, incidents: 8, regulations: 2 },
    { year: "'21", models: 31, incidents: 19, regulations: 5 },
    { year: "'22", models: 87, incidents: 43, regulations: 11 },
    { year: "'23", models: 245, incidents: 127, regulations: 29 },
    { year: "'24", models: 580, incidents: 312, regulations: 72 },
    { year: "'25", models: 1340, incidents: 698, regulations: 156 },
    { year: "'26", models: 2180, incidents: 1140, regulations: 211 },
];

const GROUP_COLORS = ["#818cf8", "#fb7185", "#fbbf24", "#34d399", "#c084fc", "#f97316", "#22d3ee", "#e879f9"];
const POSITIVE_VALUES = new Set(["1", "yes", "true", "approved", "hired", "accepted", "pass", "granted", "positive", "y"]);

// ── Utility functions ───────────────────────────────────────────
function detectColumns(rows) {
    if (!rows?.length) return { attrs: [], outs: [] };
    const cols = Object.keys(rows[0]);
    const attrs = [], outs = [];
    for (const col of cols) {
        const vals = new Set();
        for (const r of rows) { const v = String(r[col] ?? "").trim(); if (v) vals.add(v); }
        if (vals.size >= 2 && vals.size <= 20) attrs.push(col);
        if (vals.size === 2) outs.push(col);
    }
    return { attrs, outs };
}

function computeFairness(rows, attrCol, outCol) {
    const groups = {};
    let totalPositive = 0;
    for (const row of rows) {
        const g = String(row[attrCol] ?? "Unknown").trim();
        if (!g) continue;
        if (!groups[g]) groups[g] = { total: 0, positive: 0 };
        groups[g].total++;
        if (POSITIVE_VALUES.has(String(row[outCol] ?? "").trim().toLowerCase())) {
            groups[g].positive++;
            totalPositive++;
        }
    }
    const results = Object.entries(groups)
        .filter(([, v]) => v.total >= 3)
        .map(([name, v], i) => ({
            group: name,
            rate: Math.round((v.positive / v.total) * 100),
            count: v.total,
            color: GROUP_COLORS[i % GROUP_COLORS.length],
        }))
        .sort((a, b) => b.rate - a.rate);
    if (results.length < 2) return null;
    const maxR = results[0].rate, minR = results[results.length - 1].rate;
    const score = maxR > 0 ? +(minR / maxR).toFixed(2) : 0;
    const gap = maxR - minR;
    const sev = score < 0.6 ? "Critical" : score < 0.7 ? "High" : score < 0.8 ? "Medium" : "Low";
    return { score, gap: `\u2013${gap}pp`, sev, g: results, totalRows: rows.length, totalPositive };
}

const DarkBarTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
        return (
            <div style={{ fontFamily: "'Inter',sans-serif", background: "#0d1631", border: "1px solid rgba(99,102,241,0.3)" }} className="rounded-xl shadow-2xl px-4 py-2.5 text-sm">
                <p className="font-semibold text-white">{payload[0].payload.group}</p>
                <p className="text-white/40">Rate: <span className="font-bold text-indigo-300">{payload[0].value}%</span></p>
            </div>
        );
    }
    return null;
};

const DarkAreaTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{ fontFamily: "'Inter',sans-serif", background: "#0d1631", border: "1px solid rgba(255,255,255,0.08)" }} className="rounded-xl shadow-2xl px-4 py-3 text-xs">
                <p className="font-bold text-white/50 mb-2">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: <span className="font-black">{p.value}</span></p>
                ))}
            </div>
        );
    }
    return null;
};

// ── DashboardPage Component ─────────────────────────────────────
export default function DashboardPage() {
    const { 
        user, auditHistory, setAiReport,
        attribute, setAttribute, outcome, setOutcome, parsedData, setParsedData, 
        detectedCols, setDetectedCols, computedResult, setComputedResult, 
        selectedModel, setSelectedModel, toasts, addToast, setShowReport, setShowSignIn
    } = useContext(AppContext);

    const [isAuditRunning, setIsAuditRunning] = useState(false);
    const [auditComplete, setAuditComplete] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [displayScore, setDisplayScore] = useState(0.74);
    const [processingCount, setProcessingCount] = useState(0);
    const [previousScore, setPreviousScore] = useState(null);
    const reAuditInputRef = useRef(null);

    const loadHistoryAudit = (audit) => {
        setAttribute(audit.attribute);
        setOutcome(audit.outcome);
        setComputedResult({
            score: audit.score,
            sev: audit.score < 0.6 ? "Critical" : audit.score < 0.7 ? "High" : audit.score < 0.8 ? "Medium" : "Low",
            g: [] // We don't store groups yet in DB, but we could
        });
        setDisplayScore(audit.score);
        setAiReport(audit.report);
        addToast(`Restored audit for ${audit.attribute} from ${new Date(audit.created_at).toLocaleDateString()}`, "info");
    };

    const dynamicKpiCards = [
        { label: "Models Under Audit", value: "12", sub: "3 critical alerts", Icon: Brain, accent: "#818cf8" },
        { label: "Bias Incidents Today", value: "3", sub: "↑ 2 from yesterday", Icon: AlertCircle, accent: "#f43f5e" },
        { label: "Avg Fairness Score", value: computedResult ? `${(computedResult.score * 100).toFixed(1)}%` : "74.2%", sub: computedResult ? "Latest Audit" : "↓ 1.3% this week", Icon: Gauge, accent: "#f59e0b" },
        { label: "Compliance Coverage", value: "4/6", sub: "2 frameworks failing", Icon: ShieldCheck, accent: "#14b8a6" },
    ];


    const handleFileDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
        if (!file) return;
        setUploadedFile(file);
        setComputedResult(null);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data;
                setParsedData(rows);
                const cols = detectColumns(rows);
                setDetectedCols(cols);
                if (cols.attrs.length) setAttribute(cols.attrs[0]);
                if (cols.outs.length) setOutcome(cols.outs[0]);
                addToast(`Parsed ${rows.length.toLocaleString()} rows \u00b7 ${cols.attrs.length} attributes \u00b7 ${cols.outs.length} outcomes detected`, "success");
            },
            error: () => addToast("Failed to parse file", "warning"),
        });
    };

    const handleAudit = () => {
        if (computedResult) setPreviousScore(computedResult.score);
        setIsAuditRunning(true);
        setAuditComplete(false);
        setProcessingCount(0);
        
        // Real-time counter effect
        const interval = setInterval(() => {
            setDisplayScore(+(Math.random() * 0.5 + 0.3).toFixed(2));
            if (parsedData) {
                setProcessingCount(prev => Math.min(prev + Math.floor(parsedData.length / 10), parsedData.length));
            }
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            if (parsedData) {
                const result = computeFairness(parsedData, attribute, outcome);
                if (result) {
                    setComputedResult(result);
                    setDisplayScore(result.score);
                    setProcessingCount(parsedData.length);
                    addToast(`Real audit complete \u2014 ${result.totalRows.toLocaleString()} rows analyzed for ${attribute} \u00d7 ${outcome}`, result.sev === "Critical" || result.sev === "High" ? "warning" : "success");
                } else {
                    addToast(`Could not compute \u2014 ensure "${attribute}" and "${outcome}" columns have valid data`, "warning");
                }
            } else {
                setDisplayScore(0.74);
                addToast(`Demo audit complete \u2014 upload a CSV for real-time analysis`, "info");
            }
            setIsAuditRunning(false);
            setAuditComplete(true);
        }, 1500);
    };

    // Derived: What-If scenario from uploaded data
    const scenario = useMemo(() => {
        if (!parsedData || !computedResult || computedResult.g.length < 2) return null;
        const cols = Object.keys(parsedData[0] || {});
        let numericCol = null;
        let avgValue = null;
        for (const col of cols) {
            if (col === attribute || col === outcome) continue;
            const vals = parsedData.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
            if (vals.length > parsedData.length * 0.4) {
                numericCol = col;
                avgValue = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
                break;
            }
        }
        return {
            numericCol,
            avgValue,
            highGroup: computedResult.g[0],
            lowGroup: computedResult.g[computedResult.g.length - 1],
        };
    }, [parsedData, computedResult, attribute, outcome]);

    const handleReAudit = (e) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        if (computedResult) setPreviousScore(computedResult.score);
        setUploadedFile(file);
        setIsAuditRunning(true);
        setAuditComplete(false);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data;
                setParsedData(rows);
                const cols = detectColumns(rows);
                setDetectedCols(cols);
                const newAttr = cols.attrs.includes(attribute) ? attribute : (cols.attrs[0] || attribute);
                const newOut = cols.outs.includes(outcome) ? outcome : (cols.outs[0] || outcome);
                if (newAttr) setAttribute(newAttr);
                if (newOut) setOutcome(newOut);
                const result = computeFairness(rows, newAttr, newOut);
                if (result) {
                    setComputedResult(result);
                    setDisplayScore(result.score);
                    setProcessingCount(rows.length);
                    addToast(`Re-audit complete — ${rows.length.toLocaleString()} rows analyzed`, result.sev === 'Critical' || result.sev === 'High' ? 'warning' : 'success');
                } else {
                    addToast('Could not compute — check column names match', 'warning');
                }
                setIsAuditRunning(false);
                setAuditComplete(true);
            },
            error: () => { addToast('Failed to parse file', 'warning'); setIsAuditRunning(false); }
        });
    };

    return (
        <div className="pt-20 min-h-screen" style={{ background: "#040714" }}>
            <section id="dashboard-section" className="py-12 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
                                    <Activity size={20} className="text-indigo-400" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Audit Command Center</h1>
                            </div>
                            <p className="text-white/38 text-sm max-w-lg font-medium leading-relaxed">
                                Real-time algorithmic bias monitoring, regulatory compliance auditing, and multi-agent governance dashboard.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right mr-2">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-0.5">Global Status</p>
                                <p className="text-xs font-bold text-emerald-400">System Nominal \u00b7 14ms</p>
                            </div>
                        </div>
                    </div>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {dynamicKpiCards.map((k, i) => (
                            <div key={i} className="rounded-2xl p-5 border border-white/[0.07] group hover:border-white/[0.12] transition-all"
                                style={{ background: "rgba(255,255,255,0.02)" }}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                                        style={{ background: `${k.accent}15`, color: k.accent }}>
                                        <k.Icon size={18} />
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/[0.04] text-white/30 border border-white/[0.05]">Live</span>
                                </div>
                                <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-1">{k.label}</p>
                                <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{k.value}</h3>
                                <p className="text-[10px] font-semibold text-white/25 flex items-center gap-1.5">
                                    {k.sub.includes("\u2191") ? <TrendingUp size={10} className="text-emerald-400" /> : <TrendingDown size={10} className="text-rose-400" />}
                                    {k.sub}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LEFT COLUMN: Input & Chart */}
                        <div className="lg:col-span-8 space-y-6">
                            
                            {/* AI Trend Chart */}
                            <div className="rounded-2xl p-6 border border-white/[0.07]"
                                style={{ background: "rgba(255,255,255,0.02)" }}>
                                <div className="flex items-start justify-between mb-1 flex-wrap gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp size={15} className="text-indigo-400" />
                                            <h2 className="text-sm font-bold text-white">Global AI Deployment \u00b7 Bias Incidents</h2>
                                        </div>
                                        <p className="text-xs text-white/30">2020 \u2013 2026 \u00b7 Why Samatva AI exists</p>
                                    </div>
                                </div>
                                <div style={{ height: 250 }} className="mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={aiTrendData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gModels" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="gIncidents" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.28} />
                                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                            <XAxis dataKey="year"
                                                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.32)", fontFamily: "Inter,sans-serif" }}
                                                axisLine={false} tickLine={false} />
                                            <YAxis
                                                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.22)", fontFamily: "Inter,sans-serif" }}
                                                axisLine={false} tickLine={false} />
                                            <Tooltip content={<DarkAreaTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.38)", paddingTop: "10px" }} />
                                            <Area type="monotone" dataKey="models" name="AI Models" stroke="#6366f1" strokeWidth={2} fill="url(#gModels)" dot={false} />
                                            <Area type="monotone" dataKey="incidents" name="Bias Incidents" stroke="#f43f5e" strokeWidth={2} fill="url(#gIncidents)" dot={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* NEW AUDIT FLOW */}
                            <div className="space-y-6">
                                
                                {/* Step 1: Data Ingestion */}
                                <div className="rounded-2xl p-6 border border-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-xs border border-indigo-500/30">1</div>
                                        <div>
                                            <h2 className="text-sm font-bold text-white">Upload Dataset</h2>
                                            <p className="text-[10px] text-white/40 mt-0.5">Provide a CSV containing the AI predictions to be audited.</p>
                                        </div>
                                    </div>
                                    <div className="border-2 border-dashed rounded-xl hover:border-indigo-500/45 transition-all cursor-pointer group"
                                        style={{ borderColor: "rgba(99,102,241,0.22)", background: "rgba(99,102,241,0.03)" }}
                                        onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop}
                                        onClick={() => document.getElementById("fileInput").click()}>
                                        <input id="fileInput" type="file" className="hidden" accept=".csv,.json,.parquet" onChange={handleFileDrop} />
                                        <div className="flex flex-col items-center justify-center py-9 px-4 text-center">
                                            <UploadCloud size={26} className="text-indigo-400 mb-2" />
                                            <p className="text-sm font-bold text-white/65">{uploadedFile ? uploadedFile.name : "Drop CSV predictions"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2: Configuration & Execution */}
                                <div className={`rounded-2xl p-6 border transition-all duration-300 ${uploadedFile ? 'border-white/[0.07] bg-white/[0.02]' : 'border-white/[0.02] bg-white/[0.01] opacity-50 pointer-events-none'}`}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-xs border border-indigo-500/30">2</div>
                                        <div>
                                            <h2 className="text-sm font-bold text-white">Configure & Run Audit</h2>
                                            <p className="text-[10px] text-white/40 mt-0.5">Select variables to detect bias and initiate the analysis.</p>
                                        </div>
                                    </div>
                                    
                                    {detectedCols.attrs.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                                            <div className="md:col-span-4">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Protected Attribute</label>
                                                <select 
                                                    value={attribute} 
                                                    onChange={(e) => setAttribute(e.target.value)}
                                                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
                                                >
                                                    {detectedCols.attrs.map(c => <option key={c} value={c} className="bg-[#0d1631]">{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="md:col-span-4">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Model Outcome</label>
                                                <select 
                                                    value={outcome} 
                                                    onChange={(e) => setOutcome(e.target.value)}
                                                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
                                                >
                                                    {detectedCols.outs.map(c => <option key={c} value={c} className="bg-[#0d1631]">{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="md:col-span-4">
                                                <button onClick={handleAudit} disabled={isAuditRunning}
                                                    className="w-full group relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl overflow-hidden transition-all active:scale-95 disabled:opacity-50"
                                                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 15px rgba(99,102,241,0.25)" }}>
                                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                                                    {isAuditRunning ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} className="fill-white" />}
                                                    <span className="relative text-sm font-bold text-white">{isAuditRunning ? "Analyzing..." : "Run Audit"}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                                            <p className="text-xs text-white/30 italic">Awaiting dataset upload to configure attributes...</p>
                                        </div>
                                    )}
                                </div>

                                {/* Step 3: Analysis Results */}
                                <div className={`rounded-2xl p-6 border transition-all duration-500 ${auditComplete || isAuditRunning || computedResult ? 'border-white/[0.07] bg-white/[0.02]' : 'hidden'}`}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs border border-emerald-500/30">3</div>
                                        <div>
                                            <h2 className="text-sm font-bold text-white">Review Results</h2>
                                            <p className="text-[10px] text-white/40 mt-0.5">Real-time fairness score and detected biases.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center justify-center py-6 bg-white/[0.01] rounded-xl border border-white/[0.03]">
                                        <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                                            <svg className="w-full h-full -rotate-90">
                                                <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                                                <circle cx="64" cy="64" r="58" fill="none" stroke={isAuditRunning ? "#6366f1" : (displayScore >= 0.8 ? "#10b981" : "#f43f5e")} strokeWidth="10" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - displayScore)} strokeLinecap="round" className="transition-all duration-100" />
                                            </svg>
                                            <span className="absolute text-3xl font-black text-white">{displayScore.toFixed(2)}</span>
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-xs font-black uppercase tracking-widest ${isAuditRunning ? "text-indigo-400 animate-pulse" : (computedResult?.sev === "Critical" ? "text-rose-400" : "text-emerald-400")}`}>
                                                {isAuditRunning ? "Processing..." : (computedResult?.sev || "Baseline Audit")}
                                            </p>
                                            {isAuditRunning && parsedData && (
                                                <p className="text-[9px] text-white/30 font-bold mt-1 uppercase tracking-tighter">
                                                    Recs: {processingCount.toLocaleString()} / {parsedData.length.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Before vs After comparison banner */}
                                    {previousScore !== null && !isAuditRunning && (
                                        <div className="mt-5 p-4 rounded-xl border border-indigo-500/25 animate-fade-up" style={{ background: "rgba(99,102,241,0.07)" }}>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-1.5"><Sparkles size={11} /> Before vs After Comparison</p>
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div className="text-center p-3 rounded-lg border" style={{ background: "rgba(244,63,94,0.1)", borderColor: "rgba(244,63,94,0.25)" }}>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Before Fix</p>
                                                    <p className="text-2xl font-black text-rose-400">{previousScore.toFixed(2)}</p>
                                                    <p className="text-[10px] text-white/25">Original Dataset</p>
                                                </div>
                                                <div className="text-center p-3 rounded-lg border" style={{ background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.25)" }}>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">After Fix</p>
                                                    <p className="text-2xl font-black text-emerald-400">{displayScore.toFixed(2)}</p>
                                                    <p className="text-[10px] text-white/25">Updated Dataset</p>
                                                </div>
                                            </div>
                                            <div className="text-center py-2 rounded-lg" style={{ background: displayScore > previousScore ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)" }}>
                                                {displayScore > previousScore
                                                    ? <p className="text-emerald-400 text-xs font-black">🎉 Fairness improved by +{((displayScore - previousScore) * 100).toFixed(1)}pp — great work!</p>
                                                    : displayScore < previousScore
                                                    ? <p className="text-rose-400 text-xs font-black">⚠️ Score dropped by {((previousScore - displayScore) * 100).toFixed(1)}pp — review your debiasing steps.</p>
                                                    : <p className="text-amber-400 text-xs font-black">No change detected — try further debiasing steps.</p>
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Step 4: What-If Scenario Simulator */}
                                {computedResult && scenario && (
                                    <div className="rounded-2xl p-6 border animate-fade-up" style={{ background: "rgba(109,40,217,0.05)", borderColor: "rgba(139,92,246,0.2)" }}>
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="flex items-center justify-center w-7 h-7 rounded-full font-black text-xs border" style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa", borderColor: "rgba(139,92,246,0.3)" }}>4</div>
                                            <div>
                                                <h2 className="text-sm font-bold text-white">What-If Scenario Simulator</h2>
                                                <p className="text-[10px] text-white/40 mt-0.5">How the old model treats two identical applicants differently based on <span className="text-violet-400 font-semibold">{attribute}</span>.</p>
                                            </div>
                                        </div>

                                        <p className="text-center text-[11px] text-white/40 mb-5">
                                            Hypothetical applicant{scenario.numericCol ? ` · ${scenario.numericCol}: ${scenario.avgValue}` : ''} · Applying for: <span className="text-white font-bold">{outcome}</span>
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 mb-5">
                                            {[scenario.highGroup, scenario.lowGroup].map((grp, i) => (
                                                <div key={i} className="rounded-xl p-4 border text-center" style={{
                                                    background: grp.rate >= 50 ? "rgba(16,185,129,0.07)" : "rgba(244,63,94,0.07)",
                                                    borderColor: grp.rate >= 50 ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)"
                                                }}>
                                                    <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-2xl mb-2" style={{ background: "rgba(255,255,255,0.05)" }}>👤</div>
                                                    <p className="text-white font-black text-sm mb-0.5">{grp.group}</p>
                                                    {scenario.numericCol && <p className="text-white/35 text-[10px] mb-0.5">{scenario.numericCol}: {scenario.avgValue}</p>}
                                                    <p className="text-white/30 text-[10px] mb-3">Historical approval rate: {grp.rate}%</p>
                                                    <div className="py-2 rounded-lg font-black text-sm" style={{
                                                        background: grp.rate >= 50 ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)",
                                                        color: grp.rate >= 50 ? "#34d399" : "#fb7185"
                                                    }}>
                                                        {grp.rate >= 50 ? '✅ APPROVED' : '❌ DENIED'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="rounded-xl p-4 border text-center" style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.2)" }}>
                                            <p className="text-amber-400 font-black text-sm">⚠️ Same {scenario.numericCol || 'qualifications'}. Different outcome. That's bias.</p>
                                            <p className="text-white/45 text-xs mt-1.5 leading-relaxed">
                                                The model gave <span className="text-white font-bold">{scenario.highGroup.group}</span> a {scenario.highGroup.rate}% approval rate vs only {scenario.lowGroup.rate}% for <span className="text-white font-bold">{scenario.lowGroup.group}</span> — a <span className="text-amber-400 font-bold">{scenario.highGroup.rate - scenario.lowGroup.rate}pp gap</span> driven purely by <span className="text-white font-bold">{attribute}</span>.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Step 5: Debiasing Action Plan */}
                                {computedResult && (
                                    <div className="rounded-2xl p-6 border animate-fade-up" style={{ background: "rgba(20,184,166,0.04)", borderColor: "rgba(20,184,166,0.18)" }}>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="flex items-center justify-center w-7 h-7 rounded-full font-black text-xs border" style={{ background: "rgba(20,184,166,0.2)", color: "#2dd4bf", borderColor: "rgba(20,184,166,0.3)" }}>5</div>
                                            <div>
                                                <h2 className="text-sm font-bold text-white">Debiasing Action Plan</h2>
                                                <p className="text-[10px] text-white/40 mt-0.5">Concrete steps to make your <span className="text-teal-400 font-semibold">{attribute} → {outcome}</span> model fair and compliant.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-5">
                                            {/* Phase 1 */}
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-1.5"><BarChart3 size={11} /> Phase 1 — Data</p>
                                                <div className="space-y-2">
                                                    {[
                                                        { n: 1, title: `Audit your data collection process`, desc: `Identify where ${attribute} sampling or labeling gaps are introduced in your pipeline.` },
                                                        { n: 2, title: `Rebalance training dataset`, desc: `Ensure equal ${attribute} group representation through oversampling, undersampling, or synthetic data.` },
                                                        { n: 3, title: `Remove proxy features`, desc: `Drop ${attribute} and correlated features (zip code, name, etc.) that act as indirect proxies.` },
                                                    ].map(s => (
                                                        <div key={s.n} className="flex gap-3 p-3 rounded-xl border" style={{ background: "rgba(99,102,241,0.05)", borderColor: "rgba(99,102,241,0.12)" }}>
                                                            <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5" style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>{s.n}</span>
                                                            <div><p className="text-xs font-bold text-white">{s.title}</p><p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{s.desc}</p></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Phase 2 */}
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-3 flex items-center gap-1.5"><Cpu size={11} /> Phase 2 — Model</p>
                                                <div className="space-y-2">
                                                    {[
                                                        { n: 4, title: `Apply algorithmic debiasing`, desc: `Use re-weighting, adversarial debiasing, or fairness constraints during model re-training.` },
                                                        { n: 5, title: `Set a fairness deployment gate`, desc: `Block deployment if the Disparate Impact Score for ${attribute} drops below 0.80.` },
                                                        { n: 6, title: `Validate on a fairness benchmark`, desc: `Test re-trained model on a held-out balanced test set before pushing to production.` },
                                                    ].map(s => (
                                                        <div key={s.n} className="flex gap-3 p-3 rounded-xl border" style={{ background: "rgba(139,92,246,0.05)", borderColor: "rgba(139,92,246,0.12)" }}>
                                                            <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5" style={{ background: "rgba(139,92,246,0.2)", color: "#c084fc" }}>{s.n}</span>
                                                            <div><p className="text-xs font-bold text-white">{s.title}</p><p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{s.desc}</p></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Phase 3 */}
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-3 flex items-center gap-1.5"><Shield size={11} /> Phase 3 — Governance</p>
                                                <div className="space-y-2">
                                                    {[
                                                        { n: 7, title: `Assign a Fairness Officer`, desc: `Designate a person responsible for quarterly ${attribute} bias reviews and audit sign-offs.` },
                                                        { n: 8, title: `Document all mitigation steps`, desc: `Required for EU AI Act Article 13, EEOC compliance, and India AI Act transparency obligations.` },
                                                        { n: 9, title: `Implement continuous monitoring`, desc: `Set automated alerts when the live ${attribute} → ${outcome} fairness score drops below your threshold.` },
                                                    ].map(s => (
                                                        <div key={s.n} className="flex gap-3 p-3 rounded-xl border" style={{ background: "rgba(20,184,166,0.05)", borderColor: "rgba(20,184,166,0.12)" }}>
                                                            <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5" style={{ background: "rgba(20,184,166,0.2)", color: "#2dd4bf" }}>{s.n}</span>
                                                            <div><p className="text-xs font-bold text-white">{s.title}</p><p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{s.desc}</p></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Why this is a good thing */}
                                        <div className="mt-6 p-4 rounded-xl border" style={{ background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.18)" }}>
                                            <p className="text-emerald-400 font-black text-xs mb-2 flex items-center gap-1.5"><CheckCircle size={12} /> Is addressing bias a good thing? Absolutely.</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { icon: "⚖️", label: "Legal", desc: "Avoid EU AI Act & EEOC penalties" },
                                                    { icon: "🤝", label: "Ethical", desc: "Serve all populations equitably" },
                                                    { icon: "📈", label: "Business", desc: "Expand your addressable market" },
                                                ].map((b, i) => (
                                                    <div key={i} className="text-center p-2 rounded-lg" style={{ background: "rgba(16,185,129,0.08)" }}>
                                                        <p className="text-base mb-1">{b.icon}</p>
                                                        <p className="text-[10px] font-black text-emerald-400">{b.label}</p>
                                                        <p className="text-[9px] text-white/35 leading-snug">{b.desc}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Re-Audit CTA */}
                                        <div className="mt-5 pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                                            <p className="text-[10px] text-white/30 text-center mb-3">Applied the debiasing steps? Validate your improvement:</p>
                                            <input ref={reAuditInputRef} type="file" accept=".csv" className="hidden" onChange={handleReAudit} />
                                            <button
                                                onClick={() => reAuditInputRef.current?.click()}
                                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 hover:opacity-90"
                                                style={{ background: "linear-gradient(135deg,#14b8a6,#6366f1)", boxShadow: "0 4px 20px rgba(20,184,166,0.25)" }}
                                            >
                                                <RefreshCw size={15} /> Re-Audit After Fix — Upload New CSV
                                            </button>
                                            <p className="text-[9px] text-white/20 text-center mt-2">Your old score is saved. Upload the debiased dataset to see the improvement.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* RIGHT COLUMN: Leaderboard & Ethics */}
                        <div className="lg:col-span-4 space-y-6">
                            
                            {/* Leaderboard */}
                            <div className="rounded-2xl p-6 border border-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
                                <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                                    <Award size={15} className="text-amber-400" /> Model Leaderboard
                                </h2>
                                <div className="space-y-2">
                                    {leaderboard.map((m, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.05] bg-white/[0.01]">
                                            <span className="text-xs font-black text-white/20 w-4">#{i+1}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{m.model}</p>
                                                <p className="text-[10px] text-white/30">{m.provider}</p>
                                            </div>
                                            <span className="text-xs font-black text-indigo-400">{m.fairness}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Gemini Ethicist Component */}
                            <GeminiEthicist isAuditRunning={isAuditRunning} />
                            
                            {/* Recent Audits History */}
                            <div className="rounded-2xl p-6 border border-white/[0.07]" style={{ background: "rgba(255,255,255,0.02)" }}>
                                <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                                    <Clock size={15} className="text-indigo-400" /> Recent Governance Audits
                                </h2>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {auditHistory.length > 0 ? (
                                        auditHistory.map((a, i) => (
                                            <div key={i} onClick={() => loadHistoryAudit(a)} className="group cursor-pointer p-3 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.04] transition-all">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">{a.attribute} Audit</p>
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${a.score < 0.7 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                        {a.score.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] text-white/30">{new Date(a.created_at).toLocaleDateString()}</p>
                                                    <ArrowUpRight size={10} className="text-white/10 group-hover:text-indigo-400 transition-colors" />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center">
                                            <p className="text-xs text-white/20 italic">No historical audits found.</p>
                                            {!user && <p className="text-[10px] text-indigo-400/50 mt-2 cursor-pointer hover:underline" onClick={() => setShowSignIn(true)}>Sign in to save your history</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <button onClick={() => setShowReport(true)} className="w-full mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors py-2.5 rounded-lg border border-white/[0.06] hover:bg-white/[0.03]">
                                View Compliance Report <ArrowRight size={12} />
                            </button>

                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}