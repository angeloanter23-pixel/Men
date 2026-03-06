import React, { useState, useEffect } from 'react';
import * as MenuService from '../services/menuService';
import { supabase } from '../lib/supabase';

interface CreateMenuOptionsProps {
  onClose: () => void;
}

type WizardStep = 'login' | 'identity' | 'activation';

export const CreateMenuOptions: React.FC<CreateMenuOptionsProps> = ({ onClose }) => {
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
                const trialEnd = restaurant.trial_end_at ? new Date(restaurant.trial_end_at) : null;
                const now = new Date();
                
                if (restaurant.account_type === 'trial' && trialEnd && trialEnd < now) {
                    setError("Your trial has expired. Please upgrade to continue.");
                    // Optional: Redirect to upgrade page
                    return;
                }

                // User already has a restaurant, redirect to admin
                window.location.hash = '#/admin';
                onClose();
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
      let redirectUrl = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null' 
        ? window.location.origin 
        : 'https://ais-dev-vq36wkzk5myyzjspsrxtyg-10111269819.asia-east1.run.app';

      // Explicitly force production URL if on custom domain to prevent localhost fallback
      if (window.location.hostname.includes('mymenu.asia')) {
          redirectUrl = 'https://mymenu.asia';
      }

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
    window.location.hash = '#/admin';
    // Force reload to ensure fresh data is fetched and cache is cleared
    window.location.reload();
  };

  return (
    <div className="p-8 md:p-12 space-y-10 animate-fade-in font-jakarta">
      <div className="flex flex-col items-center">
        <div className="flex gap-2 mb-4">
          <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 'login' ? 'bg-indigo-600 w-8' : 'bg-indigo-600 w-8'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 'identity' || step === 'activation' ? 'bg-indigo-600 w-8' : 'bg-slate-200 w-4'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 'activation' ? 'bg-indigo-600 w-8' : 'bg-slate-200 w-4'}`} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {step === 'login' ? 'Step 1 of 3' : step === 'identity' ? 'Step 2 of 3' : 'Step 3 of 3'}
        </span>
      </div>

      {step === 'login' ? (
        <div className="space-y-8 animate-slide-up">
          <header className="text-center space-y-3">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-xl shadow-slate-200">
              <i className="fa-solid fa-rocket"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              Get Started <span className="text-xs font-mono text-slate-400 align-top ml-1">v1.9</span>
            </h2>
            <p className="text-slate-500 text-sm font-medium">Sign in to create your digital menu.</p>
          </header>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            {loading ? (
              <i className="fa-solid fa-spinner animate-spin"></i>
            ) : (
              <span>Continue with Google</span>
            )}
          </button>
          
          {error && <p className="text-rose-500 text-center text-xs font-bold animate-shake">{error}</p>}
        </div>
      ) : step === 'identity' ? (
        <div className="space-y-8 animate-slide-up">
          <header className="text-center space-y-3">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
              <i className="fa-solid fa-building"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Brand Identity</h2>
            <p className="text-slate-500 text-sm font-medium">What's the name of your establishment?</p>
          </header>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Restaurant Name</label>
              <input 
                type="text" 
                value={brandName}
                onChange={(e) => { setBrandName(e.target.value); setError(null); }}
                className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all placeholder:text-slate-300"
                placeholder="e.g. Blue Ocean Grill"
              />
              {error && <p className="text-rose-500 text-[11px] font-bold ml-1 animate-shake">{error}</p>}
            </div>
          </div>

          <button 
            onClick={handleNext}
            disabled={loading || !brandName.trim()}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-30 uppercase tracking-widest"
          >
            {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Continue'}
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-slide-up">
          <header className="text-center space-y-3">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
              <i className="fa-brands fa-facebook-messenger"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Activation</h2>
            <p className="text-slate-500 text-sm font-medium">Connect with our team to activate your license.</p>
          </header>

          <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-3xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <i className="fa-solid fa-check text-xs"></i>
              </div>
              <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                Your brand <span className="font-bold text-slate-900">"{brandName}"</span> is ready for deployment.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <i className="fa-solid fa-bolt text-xs"></i>
              </div>
              <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                Instant activation via Messenger support.
              </p>
            </div>
          </div>

          <button 
            onClick={handleActivation}
            className="w-full py-5 bg-[#0084FF] text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-3"
          >
            <i className="fa-brands fa-facebook-messenger text-lg"></i>
            Send to Messenger
          </button>
        </div>
      )}

      {step !== 'login' && (
        <button 
          onClick={onClose}
          className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-wider hover:text-slate-900 transition-colors"
        >
          Cancel
        </button>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};
