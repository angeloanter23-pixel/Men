import React, { useState, useEffect } from 'react';
import AdminDashboard from './admin/AdminDashboard';
import { MenuItem, Category, Feedback, SalesRecord } from '../types';
import * as MenuService from '../services/menuService';
import { LandingOverlay } from '../landing-page/LandingOverlay';
import { TermsSection } from '../landing-page/TermsSection';
import { PrivacySection } from '../landing-page/PrivacySection';

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
  const [isPrivacyOverlayOpen, setIsPrivacyOverlayOpen] = useState(false);
  const [clientIp, setClientIp] = useState('0.0.0.0');
  const [isBlocked, setIsBlocked] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

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

  const handleForgotPassword = () => {
    const targetEmail = forgotEmail || email;
    if (!targetEmail) {
        alert("Please enter your email address.");
        return;
    }
    
    const subject = encodeURIComponent("Password Reset Request");
    const body = encodeURIComponent(`Hello Support,\n\nI would like to request a password reset for my account associated with email: ${targetEmail}.\n\nThank you.`);
    window.location.href = `mailto:support@mymenu.asia?subject=${subject}&body=${body}`;
    setShowForgotModal(false);
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-jakarta selection:bg-orange-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-orange-200/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-2xl"></div>
      </div>

      {onBackToMenu && (
        <button 
          onClick={onBackToMenu}
          className="absolute top-8 left-8 flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors group z-20"
        >
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-arrow-left text-sm"></i>
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">Back to Menu</span>
        </button>
      )}

      <div className="w-full max-w-[420px] relative z-10 mt-[-40px] md:mt-0">
        <div className="p-4">
            <header className="mb-8 md:mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-2 md:mb-3">
                Welcome Back
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed">
                Enter your credentials to access the console.
            </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            <div className="space-y-4 md:space-y-5">
                <div className="space-y-2">
                <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <i className="fa-solid fa-envelope text-slate-400 group-focus-within:text-slate-900 transition-colors text-lg"></i>
                    </div>
                    <input 
                        required 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="w-full pl-14 pr-6 py-4 md:py-5 bg-white border-2 border-slate-100 rounded-3xl text-[14px] md:text-[15px] font-bold text-slate-900 outline-none focus:border-slate-900 transition-all shadow-sm placeholder:text-slate-300" 
                        placeholder="name@business.com" 
                    />
                </div>
                </div>
                
                <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                    <button 
                        type="button" 
                        onClick={() => { setForgotEmail(email); setShowForgotModal(true); }} 
                        className="text-[10px] md:text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline uppercase tracking-wider"
                    >
                        Forgot Password?
                    </button>
                </div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <i className="fa-solid fa-lock text-slate-400 group-focus-within:text-slate-900 transition-colors text-lg"></i>
                    </div>
                    <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full pl-14 pr-14 py-4 md:py-5 bg-white border-2 border-slate-100 rounded-3xl text-[14px] md:text-[15px] font-bold text-slate-900 outline-none focus:border-slate-900 transition-all shadow-sm placeholder:text-slate-300" 
                    placeholder="Enter your password" 
                    />
                    <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors p-2"
                    >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                    </button>
                </div>
                </div>
            </div>

            <div className="flex items-start gap-3 px-2 pt-1 md:pt-2">
                <div 
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`mt-0.5 w-6 h-6 rounded-xl border-2 shrink-0 transition-all flex items-center justify-center cursor-pointer ${agreedToTerms ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                >
                {agreedToTerms && <i className="fa-solid fa-check text-white text-[10px]"></i>}
                </div>
                <p className="text-[12px] md:text-[13px] font-medium text-slate-500 leading-snug">
                I agree to the <button type="button" onClick={() => setIsTermsOverlayOpen(true)} className="text-slate-900 font-bold hover:underline">Terms</button> and <button type="button" onClick={() => setIsPrivacyOverlayOpen(true)} className="text-slate-900 font-bold hover:underline">Privacy Policy</button>
                </p>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 md:p-5 rounded-3xl animate-fade-in flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center shrink-0 text-rose-500">
                    <i className="fa-solid fa-circle-exclamation"></i>
                </div>
                <p className="text-rose-600 text-[12px] md:text-[13px] font-bold leading-tight">{error}</p>
                </div>
            )}
            
            <button 
                type="submit" 
                disabled={loading || isBlocked || !agreedToTerms} 
                className="w-full h-[64px] md:h-[72px] bg-slate-900 text-white rounded-3xl font-black text-[14px] md:text-[15px] shadow-xl shadow-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em] hover:bg-black hover:shadow-2xl mt-4"
            >
                {loading ? <i className="fa-solid fa-spinner animate-spin text-xl"></i> : (isBlocked ? `Wait ${countdown}s` : 'Sign In')}
            </button>
            </form>
        </div>
      </div>

      {showForgotModal && (
        <>
            <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowForgotModal(false)} />
            <div className="fixed inset-x-0 bottom-0 z-[5001] bg-white rounded-t-[2.5rem] p-8 md:p-12 shadow-[0_-20px_40px_rgba(0,0,0,0.2)] animate-slide-up font-jakarta">
                <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>
                <div className="max-w-md mx-auto space-y-8">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl mx-auto mb-4">
                            <i className="fa-solid fa-key"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">Enter your email address to generate a pre-filled support request.</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <input 
                                type="email" 
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all"
                                placeholder="name@business.com"
                            />
                        </div>
                        <button 
                            onClick={handleForgotPassword}
                            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-200 active:scale-95 transition-all hover:bg-indigo-700 uppercase tracking-widest"
                        >
                            Draft Reset Email
                        </button>
                        <button 
                            onClick={() => setShowForgotModal(false)}
                            className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-wider hover:text-slate-900 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
      )}

      <LandingOverlay 
        isOpen={isTermsOverlayOpen} 
        onClose={() => setIsTermsOverlayOpen(false)} 
      >
        <TermsSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={isPrivacyOverlayOpen} 
        onClose={() => setIsPrivacyOverlayOpen(false)} 
      >
        <PrivacySection />
      </LandingOverlay>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};

export { AdminView as default };