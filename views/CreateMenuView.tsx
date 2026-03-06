import React, { useState, useEffect } from 'react';
import * as MenuService from '../services/menuService';
import { supabase } from '../lib/supabase';

interface CreateMenuViewProps {
  onCancel: () => void;
  onComplete: () => void;
}

type WizardStep = 'login' | 'identity' | 'activation' | 'qr-generator';

const CreateMenuView: React.FC<CreateMenuViewProps> = ({ onCancel, onComplete }) => {
  const [step, setStep] = useState<WizardStep>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showPreviouslyLoggedIn, setShowPreviouslyLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setShowPreviouslyLoggedIn(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser(session.user);
        setShowPreviouslyLoggedIn(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const redirectUrl = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null' 
        ? window.location.origin 
        : 'https://ais-dev-vq36wkzk5myyzjspsrxtyg-10111269819.asia-east1.run.app';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message || "Login failed");
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 'identity') {
      if (!brandName.trim()) {
        setError("Restaurant name is required");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const exists = await MenuService.checkBusinessNameExists(brandName);
        if (exists) {
          setError("This business name is already taken");
          setLoading(false);
          return;
        }
        if (user && user.email) {
            await MenuService.createRestaurantForUser(user.id, user.email, brandName);
        } else {
            throw new Error("User email not found. Please login again.");
        }
        setStep('activation');
      } catch (e: any) {
        setError(e.message || "Verification failed. Check your connection.");
      } finally {
        setLoading(false);
      }
    } else if (step === 'activation') {
        setStep('qr-generator');
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col font-jakarta selection:bg-indigo-100 relative">
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 px-6 py-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
           <button onClick={onCancel} className="text-[#007AFF] text-[17px] font-semibold flex items-center gap-1 transition-all active:opacity-50">
             <i className="fa-solid fa-chevron-left text-sm"></i>
             <span>Exit</span>
           </button>
           <div className="flex flex-col items-center">
             <div className="flex gap-2 mb-1.5">
               <div className={`h-1 rounded-full transition-all duration-700 ${step === 'login' ? 'bg-indigo-600 w-6' : 'bg-indigo-600 w-6'}`} />
               <div className={`h-1 rounded-full transition-all duration-700 ${['identity', 'activation', 'qr-generator'].includes(step) ? 'bg-indigo-600 w-6' : 'bg-slate-200 w-3'}`} />
               <div className={`h-1 rounded-full transition-all duration-700 ${['activation', 'qr-generator'].includes(step) ? 'bg-indigo-600 w-6' : 'bg-slate-200 w-3'}`} />
               <div className={`h-1 rounded-full transition-all duration-700 ${step === 'qr-generator' ? 'bg-indigo-600 w-6' : 'bg-slate-200 w-3'}`} />
             </div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
               Step {step === 'login' ? '1' : step === 'identity' ? '2' : step === 'activation' ? '3' : '4'} of 4
             </span>
           </div>
           <div className="w-10"></div>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-10 pb-48">
        {step === 'login' ? (
          <div className="space-y-12 animate-slide-up">
            <header className="text-center space-y-4">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Get Started <span className="text-xs font-mono text-slate-400 align-top ml-1">v2.1</span></h2>
              <p className="text-slate-500 text-base font-medium leading-relaxed px-6">Sign in to create your digital menu.</p>
            </header>

            {showPreviouslyLoggedIn ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <p className="text-sm text-slate-600">You were previously logged in as <span className="font-bold text-slate-900">{user?.email}</span></p>
                <div className="flex gap-4">
                  <button onClick={() => setStep('identity')} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm">Login</button>
                  <button onClick={handleGoogleLogin} className="flex-1 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl font-bold text-sm">Login with another account</button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-5 bg-white border border-slate-200 hover:border-slate-900 text-slate-900 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-4"
                >
                  {loading ? (
                    <i className="fa-solid fa-spinner animate-spin"></i>
                  ) : (
                    <>
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
                {error && <p className="text-rose-500 text-center text-sm font-bold animate-shake">{error}</p>}
              </div>
            )}
          </div>
        ) : step === 'identity' ? (
          <div className="space-y-12 animate-slide-up">
            <header className="text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto text-3xl shadow-inner">
                <i className="fa-solid fa-building"></i>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Brand Identity</h2>
              <p className="text-slate-500 text-base font-medium leading-relaxed px-6">What's the name of your establishment?</p>
            </header>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Restaurant Name</label>
                <input 
                  type="text" 
                  value={brandName}
                  onChange={(e) => { setBrandName(e.target.value); setError(null); }}
                  className="w-full bg-white border-2 border-slate-100 p-6 rounded-3xl font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300 text-lg shadow-sm"
                  placeholder="e.g. Blue Ocean Grill"
                />
                {error && <p className="text-rose-500 text-[12px] font-bold ml-2 animate-shake">{error}</p>}
              </div>
            </div>
          </div>
        ) : step === 'activation' ? (
          <div className="space-y-12 animate-slide-up">
            <header className="text-center space-y-4">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto text-3xl shadow-inner">
                <i className="fa-brands fa-facebook-messenger"></i>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Activation</h2>
              <p className="text-slate-500 text-base font-medium leading-relaxed px-6">Connect with our team to activate your license.</p>
            </header>

            <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] space-y-6 shadow-sm">
              <div className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <i className="fa-solid fa-check text-sm"></i>
                </div>
                <p className="text-[15px] font-medium text-slate-600 leading-relaxed">
                  Your brand <span className="font-bold text-slate-900">"{brandName}"</span> is ready for deployment.
                </p>
              </div>
              <div className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <i className="fa-solid fa-bolt text-sm"></i>
                </div>
                <p className="text-[15px] font-medium text-slate-600 leading-relaxed">
                  Instant activation via Messenger support.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-slide-up">
            <header className="text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto text-3xl shadow-inner">
                <i className="fa-solid fa-qrcode"></i>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">QR Generator</h2>
              <p className="text-slate-500 text-base font-medium leading-relaxed px-6">Generate your table QR codes.</p>
            </header>
            <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm text-center">
                <p className="text-sm text-slate-500">QR Generator component placeholder.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-[110] bg-white/90 backdrop-blur-2xl border-t border-slate-200/50 p-6 md:p-8">
        <div className="max-w-xl mx-auto">
          {step !== 'login' && (
            <button 
              onClick={step === 'identity' ? handleNext : step === 'activation' ? handleNext : handleComplete} 
              disabled={loading || (step === 'identity' && !brandName.trim())} 
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[14px] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed ${step === 'identity' ? 'bg-slate-900 text-white' : step === 'activation' ? 'bg-[#0084FF] text-white shadow-blue-200' : 'bg-emerald-600 text-white shadow-emerald-200'}`}
            >
              {loading ? (
                <i className="fa-solid fa-spinner animate-spin"></i>
              ) : (
                <>
                  {step === 'activation' && <i className="fa-brands fa-facebook-messenger text-lg"></i>}
                  {step === 'qr-generator' && <i className="fa-solid fa-check text-lg"></i>}
                  <span>{step === 'identity' ? 'Continue' : step === 'activation' ? 'Send to Messenger' : 'Finish'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </footer>

      <style>{`
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default CreateMenuView;
