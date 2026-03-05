import React, { useState, useEffect } from 'react';
import * as MenuService from '../services/menuService';
import { supabase } from '../lib/supabase';

interface CreateMenuViewProps {
  onCancel: () => void;
  onComplete: () => void;
}

type WizardStep = 'login' | 'identity' | 'activation';

const CreateMenuView: React.FC<CreateMenuViewProps> = ({ onCancel, onComplete }) => {
  const [step, setStep] = useState<WizardStep>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        if (step === 'login') setStep('identity');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser(session.user);
        
        // Check if user already has a restaurant
        try {
            const restaurant = await MenuService.getRestaurantByOwnerId(session.user.id);
            if (restaurant) {
                const trialEnd = restaurant.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
                const now = new Date();
                
                if (restaurant.account_type === 'trial' && trialEnd && trialEnd < now) {
                    setError("Your trial has expired. Please upgrade to continue.");
                    // Optional: Redirect to upgrade page or show modal
                    return;
                }

                // User already has a restaurant, redirect to admin
                onComplete();
                return;
            }
        } catch (e) {
            console.error("Error checking restaurant", e);
        }

        if (step === 'login') setStep('identity');
      }
    });

    return () => subscription.unsubscribe();
  }, [step]);

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

        // Create Restaurant and User Link
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
    }
  };

  const handleActivation = () => {
    const message = encodeURIComponent(`Hello! I'd like to activate my digital menu for "${brandName}".`);
    window.open(`https://m.me/940288252493266?text=${message}`, '_blank');
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
               <div className={`h-1 rounded-full transition-all duration-700 ${step === 'identity' || step === 'activation' ? 'bg-indigo-600 w-6' : 'bg-slate-200 w-3'}`} />
               <div className={`h-1 rounded-full transition-all duration-700 ${step === 'activation' ? 'bg-indigo-600 w-6' : 'bg-slate-200 w-3'}`} />
             </div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
               {step === 'login' ? 'Step 1 of 3' : step === 'identity' ? 'Step 2 of 3' : 'Step 3 of 3'}
             </span>
           </div>
           <div className="w-10"></div>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-10 pb-48">
         {step === 'login' ? (
            <div className="space-y-12 animate-slide-up">
              <header className="text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto text-3xl shadow-inner">
                  <i className="fa-brands fa-google"></i>
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Get Started</h2>
                <p className="text-slate-500 text-base font-medium leading-relaxed px-6">Sign in with Google to create your menu.</p>
              </header>

              <div className="space-y-6">
                <button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-6 bg-white border-2 border-slate-100 hover:border-indigo-100 hover:bg-indigo-50 text-slate-900 rounded-3xl font-bold text-lg shadow-sm hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  {loading ? (
                    <i className="fa-solid fa-spinner animate-spin text-indigo-600"></i>
                  ) : (
                    <>
                      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
                {error && <p className="text-rose-500 text-center text-sm font-bold animate-shake">{error}</p>}
              </div>
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
         ) : (
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
         )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-[110] bg-white/90 backdrop-blur-2xl border-t border-slate-200/50 p-6 md:p-8">
        <div className="max-w-xl mx-auto">
          {step !== 'login' && (
            <button 
              onClick={step === 'identity' ? handleNext : handleActivation} 
              disabled={loading || !brandName.trim()} 
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[14px] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed ${step === 'identity' ? 'bg-slate-900 text-white' : 'bg-[#0084FF] text-white shadow-blue-200'}`}
            >
              {loading ? (
                <i className="fa-solid fa-spinner animate-spin"></i>
              ) : (
                <>
                  {step === 'activation' && <i className="fa-brands fa-facebook-messenger text-lg"></i>}
                  <span>{step === 'identity' ? 'Continue' : 'Send to Messenger'}</span>
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
