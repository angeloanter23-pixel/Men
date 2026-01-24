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
  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientIp, setClientIp] = useState('0.0.0.0');
  
  // Security States
  const [isBlocked, setIsBlocked] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [remainingTries, setRemainingTries] = useState<number>(5);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Initial IP Fetch
  useEffect(() => {
    MenuService.getClientIp().then(setClientIp);
  }, []);

  // Sync security status when email or IP changes
  useEffect(() => {
    if (email && clientIp !== '0.0.0.0') {
      MenuService.getLoginStatus(email, clientIp).then(status => {
        const tries = Math.max(0, 5 - status.attempts);
        setRemainingTries(tries);
        
        if (status.blocked_until) {
            const blockEnd = new Date(status.blocked_until).getTime();
            const now = Date.now();
            const diff = Math.ceil((blockEnd - now) / 1000);
            
            if (diff > 0) {
                setIsBlocked(true);
                setCountdown(diff);
            } else {
                setIsBlocked(false);
                setCountdown(0);
            }
        } else {
          setIsBlocked(false);
          setCountdown(0);
        }
      });
    }
  }, [email, clientIp]);

  // Block Timer effect
  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            setRemainingTries(5);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Per-attempt minor cooldown timer
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

    // Pre-check block status before attempting auth
    const status = await MenuService.getLoginStatus(email, clientIp);
    if (status.blocked_until) {
      const diff = Math.ceil((new Date(status.blocked_until).getTime() - Date.now()) / 1000);
      if (diff > 0) {
        setIsBlocked(true);
        setCountdown(diff);
        setLoading(false);
        setError("Security lock active.");
        return;
      }
    }

    try {
      // Primary Auth Call
      const dbResponse = await MenuService.authSignIn(email, password);
      
      // Success: Clear security record
      await MenuService.clearLoginAttempts(email, clientIp);
      localStorage.setItem('foodie_supabase_session', JSON.stringify(dbResponse));
      setIsAuthenticated(true);
    } catch (dbErr: any) {
      // Record failure and get updated security data
      const failData = await MenuService.recordLoginFailure(email, clientIp);
      const attemptsDone = failData?.attempts || (5 - (remainingTries - 1));
      const triesLeft = Math.max(0, 5 - attemptsDone);
      
      setRemainingTries(triesLeft);

      if (failData?.blocked_until) {
        const diff = Math.ceil((new Date(failData.blocked_until).getTime() - Date.now()) / 1000);
        setIsBlocked(true);
        setCountdown(diff);
        setError("Account locked due to multiple failed attempts.");
      } else {
        setIsCoolingDown(true);
        setCooldownSeconds(3); // Enforce small wait between tries
        setError(`Incorrect password. ${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} remaining.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = () => {
    if (!forgotEmail.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }
    const to = "geloelolo@gmail.com";
    const subject = "Merchant Account Recovery Request";
    const body = `Hello Support Team,\n\nI am requesting recovery for my Foodie Premium merchant account.\n\nAccount Email: ${forgotEmail}\n\nPlease send me a password reset link or updated credentials.\n\nThank you.`;
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    
    alert('A recovery request email has been generated in Gmail. Please send it to proceed.');
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 md:p-12 lg:p-20 animate-fade-in font-jakarta relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 w-64 h-64 md:w-96 md:h-96 bg-indigo-50 rounded-full blur-[80px] md:blur-[100px] opacity-40"></div>
      <div className="absolute -bottom-40 -left-40 w-64 h-64 md:w-96 md:h-96 bg-orange-50 rounded-full blur-[80px] md:blur-[100px] opacity-40"></div>

      <div className="absolute top-6 left-6 md:top-10 md:left-10 z-[100]">
        <button 
          onClick={onExit}
          className="flex items-center gap-3 px-5 py-3 md:px-6 md:py-3.5 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-100 hover:shadow-2xl hover:bg-slate-50 transition-all group active:scale-95"
        >
          <i className="fa-solid fa-arrow-left text-slate-400 group-hover:text-indigo-600 transition-colors"></i>
          <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Back to Site</span>
        </button>
      </div>

      <div className="w-full max-w-sm md:max-w-md relative z-10 space-y-12">
        {view === 'login' ? (
          <div className="space-y-10">
            <header className="space-y-6 text-center">
              <div className={`inline-flex w-16 h-16 md:w-20 md:h-20 rounded-[2rem] md:rounded-[2.5rem] items-center justify-center text-white shadow-2xl transition-all duration-700 ${isBlocked ? 'bg-rose-500 scale-110 shadow-rose-100 rotate-12' : isCoolingDown ? 'bg-amber-500 rotate-0' : 'bg-slate-900 shadow-slate-100'}`}>
                <i className={`fa-solid ${isBlocked ? 'fa-lock' : isCoolingDown ? 'fa-hourglass-half' : 'fa-fingerprint'} text-2xl md:text-3xl`}></i>
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                  {isBlocked ? 'Locked' : isCoolingDown ? 'Wait' : 'Sign In'}
                </h2>
                <p className="text-slate-400 text-xs md:text-sm font-medium">
                  {isBlocked ? `System locked for security. Try again in ${formatTime(countdown)}` : isCoolingDown ? `System cooling down: ${cooldownSeconds}s` : 'Enter your merchant details below'}
                </p>
              </div>
            </header>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className={`space-y-6 transition-all duration-700 ${(isBlocked || isCoolingDown) ? 'opacity-30 blur-[2px] pointer-events-none' : 'opacity-100'}`}>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address</label>
                    {remainingTries < 5 && !isBlocked && (
                      <span className={`text-[9px] font-black uppercase tracking-widest animate-pulse ${remainingTries <= 1 ? 'text-rose-600' : 'text-amber-500'}`}>
                        {remainingTries} {remainingTries === 1 ? 'Attempt' : 'Attempts'} Left
                      </span>
                    )}
                  </div>
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-slate-50 border-none rounded-2xl md:rounded-3xl p-6 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" 
                    placeholder="admin@foodie.com" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</label>
                  <input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-slate-50 border-none rounded-2xl md:rounded-3xl p-6 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              {error && <p className={`text-[10px] font-black text-center uppercase tracking-widest animate-fade-in-up py-4 rounded-2xl border ${isBlocked ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>{error}</p>}

              <div className="pt-4 space-y-4">
                <button 
                  type="submit" 
                  disabled={loading || isBlocked || isCoolingDown} 
                  className={`w-full py-6 md:py-7 rounded-3xl md:rounded-[2.5rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 ${isBlocked ? 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed' : isCoolingDown ? 'bg-amber-100 text-amber-600 cursor-wait' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                >
                  {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : isBlocked ? `Locked • ${formatTime(countdown)}` : 'Authenticate'}
                </button>
                <button type="button" onClick={() => setView('forgot')} className="w-full text-[10px] font-black uppercase text-slate-300 hover:text-slate-900 tracking-widest transition-colors">Forgot Credentials?</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-10 animate-fade-in">
             <header className="space-y-5 text-center">
              <div className="inline-flex w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] items-center justify-center text-white shadow-xl">
                <i className="fa-solid fa-envelope-open text-2xl md:text-3xl"></i>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase leading-none">Security<br/><span className="text-indigo-600">Recovery</span></h2>
              <p className="text-slate-400 text-xs md:text-sm font-medium px-4">Enter your recovery email and we'll generate a support ticket.</p>
            </header>
            <div className="space-y-6">
              <input 
                type="email" 
                value={forgotEmail} 
                onChange={e => setForgotEmail(e.target.value)} 
                className="w-full bg-slate-50 border-none rounded-2xl md:rounded-3xl p-6 text-sm font-bold outline-none shadow-inner" 
                placeholder="Recovery Email..." 
              />
              <button 
                onClick={handleRecovery} 
                className="w-full bg-slate-900 text-white py-6 md:py-7 rounded-3xl md:rounded-[2.5rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.4em] shadow-xl hover:bg-indigo-600 transition-all"
              >
                Send Reset link
              </button>
              <button onClick={() => setView('login')} className="w-full text-[10px] font-black uppercase text-slate-300 hover:text-slate-900 tracking-widest transition-colors">Back to Login</button>
            </div>
          </div>
        )}

        <footer className="text-center pt-10 border-t border-slate-50">
          <p className="text-[9px] md:text-[10px] font-black text-slate-200 uppercase tracking-[0.5em] italic">Platinum Zen Terminal 2.0</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminView;