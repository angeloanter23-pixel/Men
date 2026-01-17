import React, { useState, useEffect } from 'react';
import AdminDashboard from './admin/AdminDashboard';
import { MenuItem, Category, Feedback, SalesRecord } from '../types';
import * as MenuService from '../services/menuService';

interface AdminViewProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  feedbacks: Feedback[];
  setFeedbacks: React.Dispatch<React.SetStateAction<Feedback[]>>;
  salesHistory: SalesRecord[];
  setSalesHistory: React.Dispatch<React.SetStateAction<SalesRecord[]>>;
  adminCreds: any;
  setAdminCreds: React.Dispatch<React.SetStateAction<any>>;
  onExit: () => void;
  onLogoUpdate: (logo: string | null) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  menuItems, setMenuItems, categories, setCategories, feedbacks, setFeedbacks, salesHistory, setSalesHistory, adminCreds, setAdminCreds, onExit, onLogoUpdate 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Attempt Database Login first
      const dbResponse = await MenuService.authSignIn(email, password);
      
      // If successful, save session to local storage for use in dashboard
      localStorage.setItem('foodie_supabase_session', JSON.stringify(dbResponse));
      setIsAuthenticated(true);
      setError('');
    } catch (dbErr: any) {
      console.warn("Database login failed, checking local config fallback...");
      
      // 2. Fallback to local admin.json config if DB fails
      if (email === adminCreds.email && password === adminCreds.password) {
        setIsAuthenticated(true);
        setError('');
      } else {
        setError(dbErr.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = () => {
    const isEnrolled = localStorage.getItem('foodie_biometric_enrolled') === 'true';
    
    if (!isEnrolled) {
      setError('Biometrics not enrolled. Please login with password first.');
      return;
    }

    setIsScanning(true);
    // Simulate biometric hardware delay
    setTimeout(() => {
      setIsScanning(false);
      setIsAuthenticated(true);
      setError('');
    }, 2000);
  };

  if (isAuthenticated) {
    return (
      <AdminDashboard 
        onLogout={() => {
          setIsAuthenticated(false);
          onExit();
        }} 
        menuItems={menuItems} 
        setMenuItems={setMenuItems} 
        categories={categories} 
        setCategories={setCategories}
        feedbacks={feedbacks}
        setFeedbacks={setFeedbacks}
        salesHistory={salesHistory}
        setSalesHistory={setSalesHistory}
        adminCreds={adminCreds}
        setAdminCreds={setAdminCreds}
        onLogoUpdate={onLogoUpdate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 relative z-10">
        <div className="text-center">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">SHARP<span className="text-indigo-600">ADMIN</span></h2>
          <p className="mt-2 text-slate-400 text-xs font-bold uppercase tracking-widest">Management Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-sm outline-none focus:ring-4 ring-indigo-500/5 transition-all border border-transparent focus:border-indigo-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-sm outline-none focus:ring-4 ring-indigo-500/5 transition-all border border-transparent focus:border-indigo-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-rose-500 text-[10px] font-black text-center uppercase tracking-widest bg-rose-50 py-2 rounded-lg border border-rose-100">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center"
          >
            {loading ? <i className="fa-solid fa-spinner animate-spin text-lg"></i> : 'Sign In'}
          </button>

          <div className="relative py-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <span className="relative px-4 bg-white text-[9px] font-black text-slate-300 uppercase tracking-widest">or use biometric</span>
          </div>

          <div className="flex flex-col items-center">
            <button 
              type="button"
              onClick={handleBiometricLogin}
              className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center transition-all hover:bg-indigo-600 hover:text-white shadow-lg active:scale-90 relative group"
            >
              <i className="fa-solid fa-fingerprint text-3xl"></i>
              <div className="absolute inset-0 bg-indigo-400 rounded-[2rem] animate-ping opacity-0 group-hover:opacity-20"></div>
            </button>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-4">Fingerprint ID</span>
          </div>
          
          <button 
            type="button"
            onClick={onExit}
            className="w-full text-slate-400 py-2 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            Back to Customer View
          </button>
        </form>
      </div>

      {/* Biometric Scanning Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          <div className="relative w-40 h-40 bg-white/5 rounded-3rem border border-white/10 flex items-center justify-center mb-10 overflow-hidden">
             <i className="fa-solid fa-fingerprint text-7xl text-indigo-400"></i>
             <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_#6366f1] animate-scan-slow"></div>
          </div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Verifying Identity</h2>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Scanning Biometric Data...</p>
        </div>
      )}

      <style>{`
        @keyframes scan-slow {
          0% { top: 10%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-scan-slow {
          position: absolute;
          animation: scan-slow 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminView;