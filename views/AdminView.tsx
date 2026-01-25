
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
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientIp, setClientIp] = useState('0.0.0.0');
  
  // Security States
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockType, setBlockType] = useState<'account' | 'device'>('account');
  const [countdown, setCountdown] = useState<number>(0);
  const [remainingTries, setRemainingTries] = useState<number>(5);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Initial IP Fetch
  useEffect(() => {
    MenuService.getClientIp().then(setClientIp);
  }, []);

  useEffect(() => {
    if (clientIp !== '0.0.0.0') {
      const syncSecurityStatus = async () => {
        const status = await MenuService.getLoginStatus(email, clientIp);
        const threshold = status.type === 'device' ? 10 : 5;
        const tries = Math.max(0, threshold - status.attempts);
        setRemainingTries(tries);
        
        if (status.locked_until) {
            const blockEnd = new Date(status.locked_until).getTime();
            const now = Date.now();
            const diff = Math.ceil((blockEnd - now) / 1000);
            
            if (diff > 0) {
                setIsBlocked(true);
                setBlockType(status.type || 'account');
                setCountdown(diff);
            } else {
                setIsBlocked(false);
                setCountdown(0);
            }
        } else {
          setIsBlocked(false);
          setCountdown(0);
        }
      };

      const timer = setTimeout(syncSecurityStatus, 500);
      return () => clearTimeout(timer);
    }
  }, [email, clientIp]);

  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    let timer: number;
    if (isCoolingDown && cooldownSeconds > 0) {
      timer = window.setInterval(() => {
        setCooldownSeconds(prev => {
          if (prev <= 1) {
            setIsCoolingDown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCoolingDown, cooldownSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked || isCoolingDown || !email || !password) return;

    setLoading(true);
    setError('');

    const status = await MenuService.getLoginStatus(email, clientIp);
    if (status.locked_until && new Date(status.locked_until) > new Date()) {
      const diff = Math.ceil((new Date(status.locked_until).getTime() - Date.now()) / 1000);
      setIsBlocked(true);
      setBlockType(status.type || 'account');
      setCountdown(diff);
      setLoading(false);
      setError(`${status.type === 'device' ? 'Device' : 'Account'} locked.`);
      return;
    }

    try {
      const dbResponse = await MenuService.authSignIn(email, password);
      await MenuService.clearLoginAttempts(email, clientIp);
      localStorage.setItem('foodie_supabase_session', JSON.stringify(dbResponse));
      setIsAuthenticated(true);
    } catch (dbErr: any) {
      const failData = await MenuService.recordLoginFailure(email, clientIp);
      const threshold = failData?.type === 'device' ? 10 : 5;
      const triesLeft = Math.max(0, threshold - (failData?.attempts || 1));
      setRemainingTries(triesLeft);

      if (failData?.locked_until) {
        const diff = Math.ceil((new Date(failData.locked_until).getTime() - Date.now()) / 1000);
        setIsBlocked(true);
        setBlockType(failData.type || 'account');
        setCountdown(diff);
        setError(`${failData.type === 'device' ? 'Device' : 'Account'} locked.`);
      } else {
        setIsCoolingDown(true);
        setCooldownSeconds(3);
        setError(`Incorrect credentials. ${triesLeft} tries left.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = () => {
    if (!forgotEmail.includes('@')) {
      alert("Invalid email.");
      return;
    }
    const to = "geloelolo@gmail.com";
    const subject = "Merchant Recovery Request";
    const body = `Hello Support Team,\n\nI am requesting recovery for: ${forgotEmail}`;
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    setView('login');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  if (isAuthenticated) {
    return (
      <AdminDashboard 
        onLogout={() => { setIsAuthenticated(false); onExit(); }} 
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 md:p-12 animate-fade-in font-jakarta relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] opacity-40"></div>
      <div className="absolute -bottom-40 -left-40 w-64 h-64 bg-orange-50 rounded-full blur-[100px] opacity-40"></div>

      <div className="absolute top-6 left-6 md:top-10 md:left-10 z-[100]">
        <button 
          onClick={onExit}
          className="flex items-center gap-3 px-6 py-3.5 bg-white border border-slate-100 rounded-2xl shadow-xl hover:bg-slate-50 transition-all active:scale-95 group"
        >
          <i className="fa-solid fa-arrow-left text-slate-400 group-hover:text-indigo-600 transition-colors"></i>
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Back to Site</span>
        </button>
      </div>

      <div className="w-full max-w-sm md:max-w-md relative z-10 space-y-12">
        {view === 'login' ? (
          <div className="space-y-10">
            <header className="space-y-6 text-center">
              <div className={`inline-flex w-20 h-20 rounded-[2.5rem] items-center justify-center text-white shadow-2xl transition-all duration-700 ${isBlocked ? 'bg-rose-500 scale-110' : isCoolingDown ? 'bg-amber-500' : 'bg-slate-900'}`}>
                <i className={`fa-solid ${isBlocked ? 'fa-lock' : isCoolingDown ? 'fa-hourglass-half' : 'fa-fingerprint'} text-3xl`}></i>
              </div>
              <div className="space-y-3">
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                  {isBlocked ? 'Locked' : isCoolingDown ? 'Wait' : 'Sign In'}
                </h2>
                <p className="text-slate-400 text-sm font-medium">
                  {isBlocked ? `Wait ${formatTime(countdown)} for security.` : isCoolingDown ? `System cooling down: ${cooldownSeconds}s` : 'Access Merchant Terminal'}
                </p>
              </div>
            </header>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className={`space-y-6 transition-all duration-700 ${(isBlocked || isCoolingDown) ? 'opacity-30 blur-[2px] pointer-events-none' : 'opacity-100'}`}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Master Email</label>
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner italic" 
                    placeholder="admin@foodie.com" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Security Key</label>
                  <div className="relative group">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full bg-slate-50 border-none rounded-3xl p-6 pr-14 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" 
                      placeholder="••••••••" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                    </button>
                  </div>
                </div>
              </div>

              {error && <p className={`text-[10px] font-black text-center uppercase tracking-widest py-4 rounded-2xl border ${isBlocked ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>{error}</p>}

              <div className="pt-4 space-y-4">
                <button 
                  type="submit" 
                  disabled={loading || isBlocked || isCoolingDown} 
                  className={`w-full py-7 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 ${isBlocked ? 'bg-slate-100 text-slate-300' : isCoolingDown ? 'bg-amber-100 text-amber-600' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                >
                  {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : isBlocked ? `Locked • ${formatTime(countdown)}` : 'Authenticate Node'}
                </button>
                <button type="button" onClick={() => setView('forgot')} className="w-full text-[10px] font-black uppercase text-slate-300 hover:text-slate-900 tracking-widest transition-colors italic">Lost access credentials?</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-10 animate-fade-in">
             <header className="space-y-5 text-center">
              <div className="inline-flex w-20 h-20 bg-slate-900 rounded-[2.5rem] items-center justify-center text-white shadow-xl">
                <i className="fa-solid fa-envelope-open text-3xl"></i>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase leading-none">Identity<br/><span className="text-indigo-600">Recovery</span></h2>
              <p className="text-slate-400 text-sm font-medium px-4">Generate an encrypted recovery request.</p>
            </header>
            <div className="space-y-6">
              <input 
                type="email" 
                value={forgotEmail} 
                onChange={e => setForgotEmail(e.target.value)} 
                className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-bold outline-none shadow-inner" 
                placeholder="Recovery Email..." 
              />
              <button 
                onClick={handleRecovery} 
                className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-xl hover:bg-indigo-600 transition-all"
              >
                Send Request
              </button>
              <button onClick={() => setView('login')} className="w-full text-[10px] font-black uppercase text-slate-300 hover:text-slate-900 tracking-widest transition-colors italic">Back to Login</button>
            </div>
          </div>
        )}

        <footer className="text-center pt-10 border-t border-slate-50">
          <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.5em] italic">Platinum Terminal Engine 4.0</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminView;
