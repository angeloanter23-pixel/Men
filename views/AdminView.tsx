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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isTermsOverlayOpen, setIsTermsOverlayOpen] = useState(false);
  const [isPrivacyOverlayOpen, setIsPrivacyOverlayOpen] = useState(false);
  const [hasRestaurant, setHasRestaurant] = useState<boolean | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || null);
        const restaurant = await MenuService.getRestaurantByOwnerId(session.user.id);
        setHasRestaurant(!!restaurant);
        setIsAuthenticated(true);
      }
      setHasCheckedSession(true);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUserEmail(session.user.email || null);
        const restaurant = await MenuService.getRestaurantByOwnerId(session.user.id);
        setHasRestaurant(!!restaurant);
        if (event === 'SIGNED_IN') {
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setHasRestaurant(null);
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
    window.location.href = '/';
  };

  if (!hasCheckedSession) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isAuthenticated) {
    if (hasRestaurant === null) {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-jakarta selection:bg-slate-100 relative">
      {onBackToMenu && (
        <button 
          onClick={onBackToMenu}
          className="absolute top-8 left-8 flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group z-20"
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors">
            <i className="fa-solid fa-xmark text-sm"></i>
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">Close</span>
        </button>
      )}

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-12">
            <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white mx-auto mb-8">
               <span className="text-2xl font-black">M</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                {isDemo ? 'Demo Access' : 'Merchant Login'}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
                {isDemo ? 'Explore the admin dashboard in view-only mode.' : 'Sign in to manage your restaurant.'}
            </p>
        </div>

        {userEmail ? (
            <div className="flex flex-col items-center gap-8">
                <div className="text-center w-full">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Signed in as</p>
                  <p className="font-bold text-slate-900 text-lg truncate">{userEmail}</p>
                </div>
                <div className="flex flex-col gap-4 w-full">
                  <button 
                      onClick={() => { setIsAuthenticated(true); }}
                      className="w-full py-5 bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors uppercase tracking-widest"
                  >
                      Continue to Dashboard
                  </button>
                  <button 
                      onClick={handleGoogleLogin}
                      disabled={loading || !agreedToTerms}
                      className="w-full py-5 bg-transparent border-2 border-slate-200 text-slate-600 font-bold text-sm hover:border-slate-900 hover:text-slate-900 transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      Use a different account
                  </button>
                </div>
            </div>
        ) : (
            <div className="space-y-8">
                {isDemo ? (
                    <button 
                        onClick={() => { setIsAuthenticated(true); }}
                        className="w-full h-[64px] bg-slate-900 text-white font-bold text-[13px] hover:bg-slate-800 transition-colors uppercase tracking-widest flex items-center justify-center gap-3"
                    >
                        <span>Continue to Demo Admin</span>
                        <i className="fa-solid fa-arrow-right text-sm"></i>
                    </button>
                ) : (
                    <button 
                        onClick={handleGoogleLogin}
                        disabled={loading || !agreedToTerms} 
                        className="w-full h-[64px] bg-transparent text-slate-900 border-2 border-slate-200 font-bold text-[13px] hover:border-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest flex items-center justify-center gap-4"
                    >
                        {loading ? (
                            <i className="fa-solid fa-spinner animate-spin text-xl"></i>
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>Continue with Google</span>
                            </>
                        )}
                    </button>
                )}

                {!isDemo && (
                    <div className="flex items-start gap-3 px-2 justify-center">
                        <div 
                        onClick={() => setAgreedToTerms(!agreedToTerms)}
                        className={`mt-0.5 w-5 h-5 border-2 shrink-0 transition-colors flex items-center justify-center cursor-pointer ${agreedToTerms ? 'bg-slate-900 border-slate-900' : 'bg-transparent border-slate-300 hover:border-slate-900'}`}
                        >
                        {agreedToTerms && <i className="fa-solid fa-check text-white text-[10px]"></i>}
                        </div>
                        <p className="text-[12px] font-medium text-slate-500 leading-snug">
                        I agree to the <button type="button" onClick={() => setIsTermsOverlayOpen(true)} className="text-slate-900 font-bold hover:underline">Terms</button> and <button type="button" onClick={() => setIsPrivacyOverlayOpen(true)} className="text-slate-900 font-bold hover:underline">Privacy Policy</button>
                        </p>
                    </div>
                )}

                {error && (
                    <div className="bg-rose-50 border border-rose-100 p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-100 flex items-center justify-center shrink-0 text-rose-500">
                        <i className="fa-solid fa-circle-exclamation text-sm"></i>
                    </div>
                    <p className="text-rose-600 text-[12px] font-bold leading-tight">{error}</p>
                    </div>
                )}
            </div>
        )}
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