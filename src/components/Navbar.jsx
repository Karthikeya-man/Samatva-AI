import React, { useState, useEffect, useContext } from 'react';
import { Scale, Menu, X, ArrowUpRight } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, logout, setShowSignIn, setShowDocs } = useContext(AppContext);
    const navigate = useNavigate();

    const navLinks = ["Platform", "Solutions", "Compliance", "Pricing", "Docs"];
    const NAV_TARGETS = { Platform: "/dashboard", Solutions: "/", Compliance: "/dashboard", Pricing: "/pricing", Docs: null };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleNavClick = (link) => {
        if (NAV_TARGETS[link]) {
            navigate(NAV_TARGETS[link]);
        } else if (link === "Docs") {
            setShowDocs(true);
        }
        setMobileMenuOpen(false);
    };

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
            style={scrolled
                ? { background: "rgba(4,7,20,0.93)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }
                : { background: "transparent" }}
        >
            <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
                {/* Logo */}
                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
                    <div className="logo-glow w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                        <Scale size={16} className="text-white" />
                    </div>
                    <span className="text-white font-black text-lg tracking-tight">
                        Samatva<span className="text-indigo-400">AI</span>
                    </span>
                </div>

                {/* Centre live pill */}
                <div className="hidden md:flex items-center gap-2 rounded-full px-3 py-1.5 border border-emerald-500/25"
                    style={{ background: "rgba(16,185,129,0.08)" }}>
                    <span className="pulse-live w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">System Nominal · 14ms</span>
                </div>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-0.5">
                    {navLinks.map((link) => (
                        <button
                            key={link}
                            onClick={() => handleNavClick(link)}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all text-white/45 hover:text-white/80 hover:bg-white/5`}
                        >
                            {link}
                        </button>
                    ))}
                </div>

                {/* CTA / User Profile */}
                <div className="hidden md:flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-white/25 uppercase tracking-widest mb-0.5">Logged In As</p>
                                <p className="text-xs font-bold text-indigo-400">{user.name || user.email}</p>
                            </div>
                            <button onClick={logout} className="text-[10px] font-black text-white/30 hover:text-white/70 uppercase tracking-widest border border-white/10 px-3 py-1.5 rounded-lg transition-all hover:bg-white/5">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => setShowSignIn(true)} className="text-sm font-semibold text-white/45 hover:text-white/80 transition-colors px-3 py-2">
                                Sign In
                            </button>
                            <button onClick={() => setShowSignIn(true)} className="inline-flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2 rounded-xl shadow-lg transition-all active:scale-95"
                                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
                                Get Started <ArrowUpRight size={14} />
                            </button>
                        </>
                    )}
                </div>

                <button className="md:hidden text-white/60 hover:text-white p-2 transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden border-t border-white/[0.06] px-5 py-4 space-y-1"
                    style={{ background: "rgba(4,7,20,0.97)", backdropFilter: "blur(20px)" }}>
                    {navLinks.map((link) => (
                        <button key={link} onClick={() => handleNavClick(link)} className="block w-full text-left px-4 py-2.5 text-sm font-semibold text-white/55 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                            {link}
                        </button>
                    ))}
                    <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                        {user ? (
                            <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-sm font-semibold text-indigo-400 py-2 text-left px-4">Logout ({user.name || user.email})</button>
                        ) : (
                            <>
                                <button onClick={() => { setShowSignIn(true); setMobileMenuOpen(false); }} className="text-sm font-semibold text-white/55 py-2 text-left px-4">Sign In</button>
                                <button onClick={() => { setShowSignIn(true); setMobileMenuOpen(false); }} className="flex items-center justify-center gap-1.5 text-sm font-bold text-white px-4 py-2.5 rounded-xl"
                                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                                    Get Started <ArrowUpRight size={14} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

        </nav>
    );
}
