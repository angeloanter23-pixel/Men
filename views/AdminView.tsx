import React, { useState, useEffect } from 'react';
import AdminDashboard from './admin/AdminDashboard';
import { DebugAccountView } from './DebugAccountView';
import { MenuItem, Category, Feedback, SalesRecord } from '../types';
import * as MenuService from '../services/menuService';
import { LandingOverlay } from '../landing-page/LandingOverlay';
import { TermsSection } from '../landing-page/TermsSection';
import { PrivacySection } from '../landing-page/PrivacySection';
import { supabase } from '../lib/supabase';

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
  onNavigateToCreateMenu: () => void;
  isDemo?: boolean;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  menuItems, setMenuItems, categories, setCategories, feedbacks, setFeedbacks, salesHistory, setSalesHistory, adminCreds, setAdminCreds, onExit, onLogoUpdate, onThemeUpdate, appTheme, onOpenFAQ, onBackToMenu, onNavigateToCreateMenu, isDemo
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(isDemo || false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isTermsOverlayOpen, setIsTermsOverlayOpen] = useState(false);
  const [isPrivacyOverlayOpen, setIsPrivacyOverlayOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    if (!agreedToTerms) {
      setError("Please agree to the terms to continue.");
      return;
    }
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setError('');
  };

  if (isAuthenticated) {
    if (showDebug) {
      return <DebugAccountView onContinue={() => setShowDebug(false)} />;
    }
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
        onNavigateToCreateMenu={onNavigateToCreateMenu}
        onExit={onExit}
      />
    );
  }

  return (
    <>
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
            <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center mx-auto text-3xl shadow-xl shadow-slate-200 mb-6">
                <i className="fa-solid fa-rocket"></i>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-2 md:mb-3">
                Merchant Access <span className="text-xs font-mono text-slate-400 align-top ml-1">v1.2</span>
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed">
                Sign in to manage your restaurant.
            </p>
            </header>

            <div className="space-y-6">
                <div className="flex items-start gap-3 px-2 pt-1 md:pt-2 justify-center">
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
                    onClick={handleGoogleLogin}
                    disabled={loading || !agreedToTerms} 
                    className="w-full h-[64px] md:h-[72px] bg-slate-900 text-white rounded-3xl font-bold text-[14px] md:text-[15px] shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.1em] flex items-center justify-center gap-4"
                >
                    {loading ? (
                        <i className="fa-solid fa-spinner animate-spin text-xl"></i>
                    ) : (
                        <span>Continue with Google</span>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>

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
    </>
  );
};

export { AdminView as default };