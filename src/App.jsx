import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Modals from './components/Modals';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';

export default function App() {
    return (
        <AppProvider>
            <BrowserRouter>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#040714" }} className="min-h-screen">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/pricing" element={<PricingPage />} />
                    </Routes>
                    <Footer />
                    <Modals />
                </div>
            </BrowserRouter>
        </AppProvider>
    );
}
