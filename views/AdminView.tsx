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
  const [showDebug, setShowDebug] = useState(false);
  const [hasRestaurant, setHasRestaurant] = useState<boolean | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || null);
        const restaurant = await MenuService.getRestaurantByOwnerId(session.user.id);
        setHasRestaurant(!!restaurant);
        
        // If we have a hash in the URL (e.g. from OAuth redirect), auto-authenticate
        if (window.location.hash.includes('access_token')) {
          setIsAuthenticated(true);
        }
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
          setShowDebug(true);
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
  };

  if (!hasCheckedSession) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isAuthenticated) {
    if (hasRestaurant === null) {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 font-jakarta selection:bg-indigo-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-50/80 blur-[100px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-orange-50/80 blur-[120px]"></div>
      </div>

      {onBackToMenu && (
        <button 
          onClick={onBackToMenu}
          className="absolute top-8 left-8 flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors group z-20"
        >
          <div className="w-10 h-10 bg-white flex items-center justify-center rounded-full border border-slate-200 shadow-sm group-hover:scale-105 transition-all">
            <i className="fa-solid fa-xmark text-sm"></i>
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">Close</span>
        </button>
      )}

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white p-10 md:p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <header className="mb-10 text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-8 shadow-lg transform -rotate-3">
               <span className="text-2xl font-black">M</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                {isDemo ? 'Demo Access' : 'Merchant Login'}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
                {isDemo ? 'Explore the admin dashboard in view-only mode.' : 'Sign in to manage your restaurant.'}
            </p>
            {userEmail && (
                <div className="mt-8 flex flex-col items-center gap-6">
                    <div className="text-center w-full bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Signed in as</p>
                      <p className="font-bold text-slate-900 text-base truncate">{userEmail}</p>
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                      <button 
                          onClick={() => { setIsAuthenticated(true); setShowDebug(true); }}
                          className="w-full py-4 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                      >
                          Continue to Dashboard
                      </button>
                      <button 
                          onClick={handleGoogleLogin}
                          disabled={loading || !agreedToTerms}
                          className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Use a different account
                      </button>
                    </div>
                </div>
            )}
            </header>

            <div className="space-y-6">
                {isDemo ? (
                    <button 
                        onClick={() => { setIsAuthenticated(true); setShowDebug(true); }}
                        className="w-full h-[56px] bg-indigo-600 text-white rounded-xl font-bold text-[15px] hover:bg-indigo-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3"
                    >
                        <span>Continue to Demo Admin</span>
                        <i className="fa-solid fa-arrow-right text-sm"></i>
                    </button>
                ) : !userEmail && (
                    <button 
                        onClick={handleGoogleLogin}
                        disabled={loading || !agreedToTerms} 
                        className="w-full h-[56px] bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-[15px] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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

                {!isDemo && !userEmail && (
                    <div className="flex items-start gap-3 px-2 pt-2 justify-center">
                        <div 
                        onClick={() => setAgreedToTerms(!agreedToTerms)}
                        className={`mt-0.5 w-5 h-5 rounded border shrink-0 transition-all flex items-center justify-center cursor-pointer ${agreedToTerms ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 hover:border-indigo-400'}`}
                        >
                        {agreedToTerms && <i className="fa-solid fa-check text-white text-[10px]"></i>}
                        </div>
                        <p className="text-[12px] font-medium text-slate-500 leading-snug">
                        I agree to the <button type="button" onClick={() => setIsTermsOverlayOpen(true)} className="text-slate-900 font-bold hover:underline">Terms</button> and <button type="button" onClick={() => setIsPrivacyOverlayOpen(true)} className="text-slate-900 font-bold hover:underline">Privacy Policy</button>
                        </p>
                    </div>
                )}

                {error && (
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center shrink-0 text-rose-500">
                        <i className="fa-solid fa-circle-exclamation text-sm"></i>
                    </div>
                    <p className="text-rose-600 text-[12px] font-bold leading-tight">{error}</p>
                    </div>
                )}
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