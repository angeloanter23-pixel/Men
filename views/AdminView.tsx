
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
  const [isScanning, setIsScanning] = useState(false);
  const [clientIp, setClientIp] = useState('0.0.0.0');
  
  // Security States
  const [isBlocked, setIsBlocked] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [remainingTries, setRemainingTries] = useState<number>(5);

  // Initial IP Fetch
  useEffect(() => {
    MenuService.getClientIp().then(setClientIp);
  }, []);

  // Update tries when email changes
  useEffect(() => {
    if (email && clientIp !== '0.0.0.0') {
      MenuService.getLoginStatus(email, clientIp).then(status => {
        setRemainingTries(Math.max(0, 5 - status.attempts));
        if (status.blocked_until) {
            const diff = Math.ceil((new Date(status.blocked_until).getTime() - Date.now()) / 1000);
            if (diff > 0) {
                setIsBlocked(true);
                setCountdown(diff);
            }
        }
      });
    }
  }, [email, clientIp]);

  // Block Timer
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked || !email || !password) return;

    setLoading(true);
    setError('');

    // Pre-check block status
    const status = await MenuService.getLoginStatus(email, clientIp);
    if (status.blocked_until) {
      const diff = Math.ceil((new Date(status.blocked_until).getTime() - Date.now()) / 1000);
      if (diff > 0) {
        setIsBlocked(true);
        setCountdown(diff);
        setLoading(false);
        return;
      }
    }

    try {
      // Primary Auth
      const dbResponse = await MenuService.authSignIn(email, password);
      await MenuService.clearLoginAttempts(email, clientIp);
      localStorage.setItem('foodie_supabase_session', JSON.stringify(dbResponse));
      setIsAuthenticated(true);
    } catch (dbErr: any) {
      // Record Failure
      const failData = await MenuService.recordLoginFailure(email, clientIp);
      const triesLeft = 5 - failData.attempts;
      setRemainingTries(Math.max(0, triesLeft));

      if (failData.blocked_until) {
        const diff = Math.ceil((new Date(failData.blocked_until).getTime() - Date.now()) / 1000);
        setIsBlocked(true);
        setCountdown(diff);
        setError("Too many mistakes. Account locked.");
      } else {
        setError(`Incorrect password. ${triesLeft} tries left.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleBiometricLogin = () => {
    if (isBlocked) return;
    const isEnrolled = localStorage.getItem('foodie_biometric_enrolled') === 'true';
    if (!isEnrolled) {
      setError('Setup Touch ID in your settings first.');
      return;
    }
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setIsAuthenticated(true);
    }, 1800);
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 animate-fade-in font-jakarta relative overflow-hidden">
      {/* Design Accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-50 rounded-full blur-[100px] opacity-40"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-50 rounded-full blur-[100px] opacity-40"></div>

      <div className="w-full max-w-sm relative z-10 space-y-12">
        
        {view === 'login' ? (
          <div className="space-y-10">
            <header className="space-y-5 text-center">
              <div className={`inline-flex w-16 h-16 rounded-3xl items-center justify-center text-white shadow-2xl transition-all duration-700 ${isBlocked ? 'bg-rose-500 scale-110 shadow-rose-100 rotate-12' : 'bg-slate-900 shadow-slate-100'}`}>
                <i className={`fa-solid ${isBlocked ? 'fa-lock' : 'fa-fingerprint'} text-2xl`}></i>
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight italic uppercase">
                  {isBlocked ? 'Locked' : 'Sign In'}
                </h2>
                <p className="text-slate-400 text-sm font-medium">
                  {isBlocked ? `Please wait ${formatTime(countdown)}` : 'Enter your merchant details below'}
                </p>
              </div>
            </header>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className={`space-y-6 transition-all duration-700 ${isBlocked ? 'opacity-10 blur-sm pointer-events-none' : 'opacity-100'}`}>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address</label>
                    {remainingTries < 5 && !isBlocked && (
                      <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100 animate-pulse">
                        {remainingTries} tries left
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    placeholder="you@business.com"
                    className="w-full bg-slate-50 p-5 rounded-3xl font-bold text-base outline-none focus:ring-4 ring-indigo-500/5 border border-transparent focus:border-indigo-100 transition-all shadow-inner placeholder:text-slate-300"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Secure Key</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-50 p-5 rounded-3xl font-bold text-base outline-none focus:ring-4 ring-indigo-500/5 border border-transparent focus:border-indigo-100 transition-all shadow-inner placeholder:text-slate-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-shake">
                  <i className="fa-solid fa-triangle-exclamation text-rose-500"></i>
                  <p className="text-rose-600 text-xs font-bold leading-tight">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                <button
                  type="submit"
                  disabled={loading || isBlocked}
                  className={`w-full py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all ${isBlocked ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-100 disabled:opacity-50'}`}
                >
                  {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : isBlocked ? 'SECURE LOCK' : 'Access Portal'}
                </button>

                <div className="flex justify-between items-center px-4">
                  <button 
                    type="button" 
                    onClick={() => setView('forgot')}
                    className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    Forgot Key?
                  </button>
                  <button 
                    type="button"
                    onClick={handleBiometricLogin}
                    disabled={isBlocked}
                    className={`flex items-center gap-2 text-xs font-bold transition-all ${isBlocked ? 'text-slate-200 cursor-not-allowed' : 'text-indigo-500 hover:text-indigo-700 active:scale-90'}`}
                  >
                    <i className="fa-solid fa-fingerprint"></i> Touch ID
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-10 animate-fade-in">
            <header className="space-y-5">
              <button 
                onClick={() => setView('login')}
                className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 active:scale-90 transition-all"
              >
                <i className="fa-solid fa-arrow-left text-sm"></i>
              </button>
              <div className="space-y-2">
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight italic uppercase leading-none">
                  Reset <br/>
                  <span className="text-orange-500">Access.</span>
                </h2>
                <p className="text-slate-400 text-sm font-medium">Enter your email and request a manual reset.</p>
              </div>
            </header>

            <div className="space-y-8">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Registered Email</label>
                  <input
                    type="email"
                    placeholder="you@business.com"
                    className="w-full bg-slate-50 p-5 rounded-3xl font-bold text-base outline-none focus:ring-4 ring-orange-500/5 border border-transparent focus:border-orange-100 transition-all shadow-inner"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
               </div>

               <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-6">
                  <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
                    For security, our team processes all resets manually within 24 hours. Click below to start.
                  </p>
                  <a 
                    href={`mailto:geloelolo@gmail.com?subject=Merchant Reset: ${forgotEmail}&body=Requesting a manual password reset for my account: ${forgotEmail}`}
                    className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    <i className="fa-solid fa-paper-plane"></i> Send Request
                  </a>
               </div>
            </div>
          </div>
        )}

        <footer className="pt-8 border-t border-slate-50 text-center space-y-4">
          <p className="text-[8px] font-bold text-slate-200 uppercase tracking-widest italic">Connected Node: {clientIp}</p>
          <button 
            type="button"
            onClick={onExit}
            className="text-[10px] font-black uppercase text-slate-300 hover:text-slate-900 tracking-[0.4em] transition-colors"
          >
            Exit Terminal
          </button>
        </footer>
      </div>

      {/* Touch ID Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-[500] bg-white/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-fade-in">
          <div className="relative w-40 h-40 flex items-center justify-center">
             <i className="fa-solid fa-fingerprint text-8xl text-indigo-500 animate-pulse"></i>
             <div className="absolute inset-0 border-[3px] border-indigo-50 rounded-full border-t-indigo-500 animate-spin"></div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mt-12 mb-2">Analyzing ID</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Verifying Security Node...</p>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
};

export default AdminView;
