
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
}

const AdminView: React.FC<AdminViewProps> = ({ 
  menuItems, setMenuItems, categories, setCategories, feedbacks, setFeedbacks, salesHistory, setSalesHistory, adminCreds, setAdminCreds, onExit, onLogoUpdate, onThemeUpdate, appTheme, onOpenFAQ 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('Jes@jes2');
  const [password, setPassword] = useState('Loy010402');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isTermsOverlayOpen, setIsTermsOverlayOpen] = useState(false);
  const [clientIp, setClientIp] = useState('0.0.0.0');
  const [isBlocked, setIsBlocked] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => { MenuService.getClientIp().then(setClientIp); }, []);

  useEffect(() => {
    if (clientIp !== '0.0.0.0' && email) {
      const syncSecurityStatus = async () => {
        const status = await MenuService.getLoginStatus(email, clientIp);
        if (status.locked_until) {
            const diff = Math.ceil((new Date(status.locked_until).getTime() - Date.now()) / 1000);
            if (diff > 0) { setIsBlocked(true); setCountdown(diff); }
            else { setIsBlocked(false); }
        }
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) { setError("Please agree to the terms to continue."); return; }
    if (isBlocked || loading) return;
    setLoading(true); setError('');
    try {
      const dbResponse = await MenuService.authSignIn(email, password);
      await MenuService.clearLoginAttempts(email, clientIp);
      localStorage.setItem('foodie_supabase_session', JSON.stringify(dbResponse));
      setIsAuthenticated(true);
    } catch (dbErr: any) {
      await MenuService.recordLoginFailure(email, clientIp);
      setError("We couldn't find a matching account with those details.");
    } finally { setLoading(false); }
  };

  if (isAuthenticated) {
    return (
      <AdminDashboard 
        onLogout={() => { setIsAuthenticated(false); onExit(); }} 
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
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center p-6 font-jakarta">
      <div className="w-full max-w-[400px] flex flex-col">
        
        <header className="mb-12 text-center">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <span className="text-xl font-bold">M</span>
            </div>
          </div>
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight leading-none mb-4">Owner Login</h1>
          <p className="text-slate-500 text-[16px] font-medium leading-snug">Access your restaurant dashboard.</p>
        </header>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                required 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[15px] font-medium outline-none focus:ring-4 ring-slate-900/5 focus:border-slate-400 transition-all" 
                placeholder="name@business.com" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[15px] font-medium outline-none focus:ring-4 ring-slate-900/5 focus:border-slate-400 transition-all" 
                  placeholder="Enter password" 
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

          <div className="flex items-start gap-3 px-1">
            <div 
              onClick={() => setAgreedToTerms(!agreedToTerms)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 transition-all flex items-center justify-center cursor-pointer ${agreedToTerms ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200 hover:border-slate-400'}`}
            >
              {agreedToTerms && <i className="fa-solid fa-check text-white text-[10px]"></i>}
            </div>
            <p className="text-[13px] font-medium text-slate-500 leading-tight">
              I agree to the <button type="button" onClick={() => setIsTermsOverlayOpen(true)} className="text-slate-900 font-bold hover:underline">Terms and Conditions</button>
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
              <p className="text-rose-600 text-[12px] font-bold text-center leading-relaxed">{error}</p>
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading || isBlocked || !agreedToTerms} 
            className="w-full h-[60px] bg-slate-900 text-white rounded-full font-bold text-[15px] shadow-xl hover:bg-black active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : (isBlocked ? `Wait ${countdown}s` : 'Log In')}
          </button>
        </form>

        <div className="mt-12 text-center">
          <button onClick={onExit} className="text-slate-400 text-[13px] font-bold hover:text-slate-900 transition-colors uppercase tracking-widest">
            Back to Home
          </button>
        </div>
      </div>

      {/* Reusable Terms Overlay from Landing Page */}
      <LandingOverlay 
        isOpen={isTermsOverlayOpen} 
        onClose={() => setIsTermsOverlayOpen(null as any)} 
      >
        <TermsSection />
      </LandingOverlay>
    </div>
  );
};

export default AdminView;
