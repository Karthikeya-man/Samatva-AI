import React, { createContext, useState, useEffect, useRef } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // Auth State
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('samatva_user')) || null);
    const [token, setToken] = useState(localStorage.getItem('samatva_token') || null);
    const [auditHistory, setAuditHistory] = useState([]);
    const [backendAvailable, setBackendAvailable] = useState(false);

    // Data & Audit State
    const [attribute, setAttribute] = useState("Gender");
    const [outcome, setOutcome] = useState("Loan Approval");
    const [parsedData, setParsedData] = useState(null);
    const [detectedCols, setDetectedCols] = useState({ attrs: ["Race", "Gender", "Age"], outs: ["Loan Approval", "Hiring Decision"] });
    const [computedResult, setComputedResult] = useState(null);
    const [selectedModel, setSelectedModel] = useState("GPT-4o (Starter Tier)");
    const [aiReport, setAiReport] = useState(null);
    const [isReportLoading, setIsReportLoading] = useState(false);

    // UI State for Modals
    const [showSignIn, setShowSignIn] = useState(false);
    const [showDemo, setShowDemo] = useState(false);
    const [showDocs, setShowDocs] = useState(false);
    const [showReport, setShowReport] = useState(false);

    // Toast System
    const [toasts, setToasts] = useState([]);
    const addToast = (msg, type = "info") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3500);
    };

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // ── Backend Health Check ──
    const checkBackendHealth = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
            if (response.ok) {
                setBackendAvailable(true);
                console.log("[App] Backend is available");
                return true;
            }
        } catch (e) {
            console.warn("[App] Backend unavailable:", e.message);
        }
        setBackendAvailable(false);
        return false;
    };

    // ── Auth Actions ──
    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                setToken(data.token);
                localStorage.setItem('samatva_user', JSON.stringify(data.user));
                localStorage.setItem('samatva_token', data.token);
                addToast(`Welcome back, ${data.user.name || data.user.email}!`, "success");
                setShowSignIn(false);
                fetchHistory(data.user.id, data.token);
                return { success: true };
            } else {
                addToast(data.error || data.detail || "Login failed", "warning");
                return { success: false, error: data.error || data.detail };
            }
        } catch (e) {
            addToast("Backend server unavailable", "warning");
            return { success: false, error: "Backend server unavailable" };
        }
    };

    const register = async (email, password, name) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                setToken(data.token);
                localStorage.setItem('samatva_user', JSON.stringify(data.user));
                localStorage.setItem('samatva_token', data.token);
                addToast(`Welcome, ${data.user.name || data.user.email}! Account created.`, "success");
                setShowSignIn(false);
                return { success: true };
            } else {
                addToast(data.error || data.detail || "Registration failed", "warning");
                return { success: false, error: data.error || data.detail };
            }
        } catch (e) {
            addToast("Backend server unavailable", "warning");
            return { success: false, error: "Backend server unavailable" };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setAuditHistory([]);
        localStorage.removeItem('samatva_user');
        localStorage.removeItem('samatva_token');
        addToast("Signed out successfully", "info");
    };

    const fetchHistory = async (userId, userToken) => {
        const id = userId || user?.id;
        const t = userToken || token;
        if (!id || !t) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/audits/${id}`, {
                headers: { 'Authorization': `Bearer ${t}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAuditHistory(data);
            }
        } catch (e) {
            console.error("Failed to fetch history", e);
        }
    };

    const deleteAudit = async (auditId) => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/audits/${auditId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setAuditHistory(prev => prev.filter(a => a.id !== auditId));
                addToast("Audit deleted", "info");
            }
        } catch (e) {
            console.error("Failed to delete audit", e);
        }
    };

    // ── On mount: check backend health & load history ──
    useEffect(() => {
        checkBackendHealth();
        if (user && token) {
            fetchHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AppContext.Provider value={{
            user, setUser,
            token, setToken,
            auditHistory, setAuditHistory,
            backendAvailable, API_BASE_URL,
            login, register, logout, fetchHistory, deleteAudit,
            attribute, setAttribute,
            outcome, setOutcome,
            parsedData, setParsedData,
            detectedCols, setDetectedCols,
            computedResult, setComputedResult,
            selectedModel, setSelectedModel,
            aiReport, setAiReport,
            isReportLoading, setIsReportLoading,
            showSignIn, setShowSignIn,
            showDemo, setShowDemo,
            showDocs, setShowDocs,
            showReport, setShowReport,
            toasts, addToast
        }}>
            {children}
        </AppContext.Provider>
    );
};
