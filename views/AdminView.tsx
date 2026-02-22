import React, { useState, useEffect } from 'react';
import AdminDashboard from './admin/AdminDashboard';
import { MenuItem, Category, Feedback, SalesRecord } from '../types';
import * as MenuService from '../services/menuService';
import { LandingOverlay } from '../landing-page/LandingOverlay';
import { TermsSection } from '../landing-page/TermsSection';

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
  onThemeUpdate: (theme: any) => void;
  appTheme: any; 
  onOpenFAQ?: () => void;
  onBackToMenu?: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  menuItems, setMenuItems, categories, setCategories, feedbacks, setFeedbacks, salesHistory, setSalesHistory, adminCreds, setAdminCreds, onExit, onLogoUpdate, onThemeUpdate, appTheme, onOpenFAQ, onBackToMenu 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('demo1@mymenu');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isTermsOverlayOpen, setIsTermsOverlayOpen] = useState(false);
  const [clientIp, setClientIp] = useState('0.0.0.0');
  const [isBlocked, setIsBlocked] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    const savedSession = localStorage.getItem('foodie_supabase_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session.user && session.restaurant) {
          setIsAuthenticated(true);
        }
      } catch (e) {
        localStorage.removeItem('foodie_supabase_session');
      }
    }
    MenuService.getClientIp().then(setClientIp);
  }, []);

  useEffect(() => {
    if (clientIp !== '0.0.0.0' && email) {
      const syncSecurityStatus = async () => {
        try {
            const status = await MenuService.getLoginStatus(email, clientIp);
            if (status.locked_until) {
                const diff = Math.ceil((new Date(status.locked_until).getTime() - Date.now()) / 1000);
                if (diff > 0) { setIsBlocked(true); setCountdown(diff); }
                else { setIsBlocked(false); }
            }
        } catch (e) {}
      };
      syncSecurityStatus();
    }
  }, [email, clientIp]);

  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown(prev => prev <= 1 ? 0 : prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) { setError("Please agree to the terms to continue."); return; }
    if (isBlocked || loading) return;
    
    setLoading(true); 
    setError('');
    
    try {
      const dbResponse = await MenuService.authSignIn(email.trim(), password);
      await MenuService.clearLoginAttempts(email, clientIp);
      localStorage.setItem('foodie_supabase_session', JSON.stringify(dbResponse));
      setIsAuthenticated(true);
    } catch (dbErr: any) {
      await MenuService.recordLoginFailure(email, clientIp);
      setError(dbErr.message || "Login failed. Check your email and password.");
    } finally { 
      setLoading(false); 
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('foodie_supabase_session');
    setIsAuthenticated(false);
    setError('');
  };

  if (isAuthenticated) {
    return (
      <AdminDashboard 
        onLogout={handleLogout} 
        menuItems={menuItems} setMenuItems={setMenuItems} 
        categories={categories} setCategories={setCategories}
        feedbacks={feedbacks} setFeedbacks={setFeedbacks}
        salesHistory={salesHistory} setSalesHistory={setSalesHistory}
        adminCreds={adminCreds} setAdminCreds={setAdminCreds}
        onLogoUpdate={onLogoUpdate}
        onThemeUpdate={onThemeUpdate}
        appTheme={appTheme} 
        onOpenFAQ={onOpenFAQ}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-jakarta selection:bg-orange-100 relative">
      {onBackToMenu && (
        <button 
          onClick={onBackToMenu}
          className="absolute top-8 left-8 w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-95"
        >
          <i className="fa-solid fa-long-arrow-alt-left"></i>
        </button>
      )}
      <div className="w-full max-w-[400px] flex flex-col">
        
        <header className="mb-14 text-center">
          <h1 className="text-[32px] font-black text-slate-900 tracking-tight leading-none mb-4 uppercase">
            Merchant Login
          </h1>
          <p className="text-slate-400 text-[15px] font-medium leading-relaxed px-4">
            Enter your email and password to access your restaurant dashboard.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                required 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 ring-slate-900/5 focus:border-slate-300 transition-all shadow-inner" 
                placeholder="name@business.com" 
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Password</label>
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-wider">Forgot?</button>
              </div>
              <div className="relative">
                <input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 ring-slate-900/5 focus:border-slate-300 transition-all shadow-inner" 
                  placeholder="Enter your password" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 px-1 pt-2">
            <div 
              onClick={() => setAgreedToTerms(!agreedToTerms)}
              className={`mt-0.5 w-6 h-6 rounded-lg border-2 shrink-0 transition-all flex items-center justify-center cursor-pointer ${agreedToTerms ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-100 hover:border-slate-300'}`}
            >
              {agreedToTerms && <i className="fa-solid fa-check text-white text-[10px]"></i>}
            </div>
            <p className="text-[14px] font-medium text-slate-400 leading-tight">
              I agree to the <button type="button" onClick={() => setIsTermsOverlayOpen(true)} className="text-slate-900 font-bold hover:underline">Terms of Service</button>
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl animate-fade-in">
              <p className="text-rose-600 text-[12px] font-black text-center uppercase tracking-tight">{error}</p>
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading || isBlocked || !agreedToTerms} 
            className="w-full h-[64px] bg-slate-900 text-white rounded-2xl font-black text-[15px] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-[0.2em]"
          >
            {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : (isBlocked ? `Wait ${countdown}s` : 'Sign In')}
          </button>
        </form>

        <div className="mt-16 text-center">
          <button onClick={onExit} className="text-slate-300 text-[10px] font-black hover:text-slate-900 transition-colors uppercase tracking-[0.4em]">
            Exit to Landing Page
          </button>
        </div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-[5000] flex items-end justify-center animate-fade-in" onClick={() => setShowForgotModal(false)}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <div className="relative bg-white w-full max-w-lg rounded-t-2xl shadow-2xl p-6 pb-10 animate-slide-up flex flex-col gap-6" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto shrink-0" />
                <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Reset Password</h3>
                    <button onClick={() => setShowForgotModal(false)} className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500 font-medium">Enter your email address to receive a password reset link.</p>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input 
                            type="email" 
                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold text-sm text-slate-900 outline-none focus:bg-white transition-all shadow-inner"
                            placeholder="name@business.com"
                        />
                    </div>
                    <button 
                        onClick={() => { alert("Reset link sent!"); setShowForgotModal(false); }}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
                    >
                        Send Reset Link
                    </button>
                </div>
            </div>
        </div>
      )}

      <LandingOverlay 
        isOpen={isTermsOverlayOpen} 
        onClose={() => setIsTermsOverlayOpen(false)} 
      >
        <TermsSection />
      </LandingOverlay>
    </div>
  );
};

export { AdminView as default };