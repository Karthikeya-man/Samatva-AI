import React from 'react';
import { Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer style={{ background: "#020510", borderTop: "1px solid rgba(255,255,255,0.05)" }} className="py-16">
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                                <Scale size={16} className="text-white" />
                            </div>
                            <span className="text-white font-black text-lg tracking-tight">
                                Samatva<span className="text-indigo-400">AI</span>
                            </span>
                        </div>
                        <p className="text-white/28 text-sm leading-relaxed mb-5">
                            The enterprise standard for AI fairness auditing and bias detection. Built for the AI-governed world.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {["SOC 2", "GDPR", "ISO 42001", "EEOC"].map((b) => (
                                <span key={b}
                                    className="text-[10px] font-black text-white/28 border border-white/[0.08] px-2.5 py-1 rounded-md"
                                    style={{ background: "rgba(255,255,255,0.025)" }}>{b}</span>
                            ))}
                        </div>
                    </div>
                    {/* Link columns */}
                    {[
                        { title: "Platform", links: ["LLM Bias Detection", "RAG Auditing", "Agentic AI Oversight", "Model Monitoring", "API Access"] },
                        { title: "Compliance", links: ["EU AI Act 2026", "EEOC 4/5ths Rule", "ISO 42001:2023", "India AI Act", "NIST AI RMF"] },
                        { title: "Company", links: ["About", "Blog", "Careers", "Press Kit", "Contact"] },
                    ].map((col) => (
                        <div key={col.title}>
                            <p className="text-white font-bold text-sm mb-4">{col.title}</p>
                            <ul className="space-y-2.5">
                                {col.links.map((l) => (
                                    <li key={l}>
                                        <a href="#" className="text-white/30 hover:text-white/65 text-sm transition-colors">{l}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-white/20 text-xs">© 2026 Samatva AI, Inc. All rights reserved.</p>
                    <p className="text-white/20 text-xs">Built for the AI-Governed World.</p>
                </div>
            </div>
        </footer>
    );
}
