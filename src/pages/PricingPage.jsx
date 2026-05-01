import { useContext } from "react";
import { CheckCircle, Star } from "lucide-react";
import { AppContext } from "../context/AppContext";

export default function PricingPage() {
    const { setShowSignIn } = useContext(AppContext);

    const plans = [
        { 
            name: "Starter", 
            price: "$0", 
            period: "/mo", 
            desc: "For individual researchers & small teams", 
            features: ["3 model audits / month", "Basic bias detection", "CSV upload", "Community support"], 
            cta: "Get Started Free", 
            accent: "#818cf8", 
            highlight: false 
        },
        { 
            name: "Professional", 
            price: "$299", 
            period: "/mo", 
            desc: "For growing teams with compliance needs", 
            features: ["Unlimited audits", "LLM + RAG auditing", "EU AI Act compliance", "API access", "Priority support"], 
            cta: "Start Free Trial", 
            accent: "#6366f1", 
            highlight: true 
        },
        { 
            name: "Enterprise", 
            price: "Custom", 
            period: "", 
            desc: "For large-scale AI governance programs", 
            features: ["Multi-agent oversight", "Custom frameworks", "On-premise deployment", "SSO & RBAC", "Dedicated success manager"], 
            cta: "Contact Sales", 
            accent: "#c084fc", 
            highlight: false 
        },
    ];

    return (
        <div className="pt-32 pb-24 min-h-screen" style={{ background: "#040714" }}>
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
                <div className="text-center mb-16">
                    <span className="inline-flex items-center gap-2 bg-amber-500/[0.1] border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-5">
                        <Star size={11} /> Pricing Plans
                    </span>
                    <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
                        Transparent <span style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Pricing</span>
                    </h1>
                    <p className="text-white/40 text-lg mt-6 max-w-2xl mx-auto font-medium">
                        Start for free and scale as your AI governance and compliance needs grow. No hidden fees.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {plans.map((p, i) => (
                        <div key={i} 
                            className={`relative rounded-3xl p-8 border flex flex-col transition-all hover:translate-y-[-4px] ${p.highlight ? "border-indigo-500/40 bg-indigo-500/[0.04]" : "border-white/[0.07] bg-white/[0.02]"}`}>
                            
                            {p.highlight && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest bg-indigo-500 text-white px-4 py-1.5 rounded-full shadow-lg">
                                    Most Popular
                                </span>
                            )}
                            
                            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: p.accent }}>{p.name}</p>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-5xl font-black text-white">{p.price}</span>
                                <span className="text-sm font-bold text-white/20 uppercase tracking-widest">{p.period}</span>
                            </div>
                            <p className="text-sm text-white/40 mb-8 font-medium leading-relaxed">{p.desc}</p>
                            
                            <ul className="space-y-4 flex-1 mb-10">
                                {p.features.map((f, fi) => (
                                    <li key={fi} className="flex items-center gap-3 text-xs text-white/60 font-semibold">
                                        <CheckCircle size={16} style={{ color: p.accent }} />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            
                            <button onClick={() => setShowSignIn(true)}
                                className={`w-full py-4 rounded-2xl text-sm font-black transition-all active:scale-95 ${p.highlight ? "text-white shadow-xl" : "text-white/70 border border-white/10 hover:bg-white/5"}`}
                                style={p.highlight ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 10px 30px rgba(99,102,241,0.3)" } : {}}>
                                {p.cta}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-24 p-12 rounded-3xl border border-white/[0.05] bg-white/[0.01] text-center">
                    <h3 className="text-2xl font-black text-white mb-4">Need a custom plan?</h3>
                    <p className="text-white/40 mb-8 max-w-xl mx-auto text-sm font-medium">For high-volume auditing, custom regulatory frameworks, or on-premise deployments, contact our sales team.</p>
                    <button className="px-8 py-3 rounded-xl border border-white/10 text-white font-bold text-xs hover:bg-white/5 transition-all">Talk to an Ethicist</button>
                </div>
            </div>
        </div>
    );
}