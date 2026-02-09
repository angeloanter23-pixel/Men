
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
  onThemeUpdate: (theme: any) => void;
  appTheme: any; 
  onOpenFAQ?: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  menuItems, setMenuItems, categories, setCategories, feedbacks, setFeedbacks, salesHistory, setSalesHistory, adminCreds, setAdminCreds, onExit, onLogoUpdate, onThemeUpdate, appTheme, onOpenFAQ 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<'login' | 'signup'>('login');
  
  const [email, setEmail] = useState('jes@jes');
  const [password, setPassword] = useState('loy010402');
  
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
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
    if (!agreedToTerms) { setError("Agreement required to proceed."); return; }
    if (isBlocked || loading) return;
    setLoading(true); setError('');
    try {
      const dbResponse = await MenuService.authSignIn(email, password);
      await MenuService.clearLoginAttempts(email, clientIp);
      localStorage.setItem('foodie_supabase_session', JSON.stringify(dbResponse));
      setIsAuthenticated(true);
    } catch (dbErr: any) {
      await MenuService.recordLoginFailure(email, clientIp);
      setError("Incorrect Merchant ID or password.");
    } finally { setLoading(false); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) { setError("Agreement required to proceed."); return; }
    if (!email || !password || !businessName) return;
    setLoading(true); setError('');
    try {
      const res = await MenuService.authSignUp(email, password, businessName);
      localStorage.setItem('foodie_supabase_session', JSON.stringify(res));
      setIsAuthenticated(true);
    } catch (err: any) { setError(err.message || "Enrollment failed."); } 
    finally { setLoading(false); }
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
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-6 font-jakarta">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-24 h-24 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl mb-8">
            <i className="fa-solid fa-shield-halved text-4xl"></i>
          </div>
          <h1 className="text-[36px] font-black text-slate-900 tracking-tighter leading-none mb-3 uppercase">Merchant Hub</h1>
          <p className="text-slate-500 text-[15px] font-medium leading-snug">Secure access to your restaurant node.</p>
        </div>

        <div className="w-full bg-white rounded-[2.5rem] border border-slate-200/60 p-10 shadow-xl">
          <form onSubmit={view === 'signup' ? handleSignUp : handleLogin} className="space-y-6">
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
              {view === 'signup' && (
                <input required type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full px-5 py-4 text-sm font-bold bg-slate-50 outline-none border-b border-slate-100" placeholder="Restaurant Name" />
              )}
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-4 text-sm font-bold bg-slate-50 outline-none border-b border-slate-100" placeholder="Merchant Email" />
              <div className="relative">
                <input required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-4 text-sm font-bold bg-slate-50 outline-none" placeholder="Password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"><i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
              </div>
            </div>

            {error && <p className="text-rose-500 text-[10px] font-black text-center uppercase tracking-widest">{error}</p>}
            
            <button type="submit" disabled={loading || isBlocked} className="w-full h-14 bg-slate-900 text-white rounded-full font-black uppercase text-[12px] tracking-[0.2em] shadow-xl active:scale-95 disabled:opacity-30">
              {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : (view === 'signup' ? 'Enroll Node' : 'Initialize Session')}
            </button>

            <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="w-full text-indigo-600 text-[11px] font-black uppercase tracking-widest">
              {view === 'login' ? "Create New Node" : "Back to Sign In"}
            </button>
          </form>
        </div>

        <button onClick={onExit} className="mt-12 text-slate-400 text-[11px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors">Return to Site</button>
      </div>
    </div>
  );
};

export default AdminView;
