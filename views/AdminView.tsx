import React, { useState, useEffect } from 'react';
import AdminDashboard from './admin/AdminDashboard';
import { RestaurantNameEditor } from '../components/RestaurantNameEditor';
import { DebugAccountView } from './DebugAccountView';
import { MenuItem, Category, Feedback, SalesRecord } from '../types';
import * as MenuService from '../services/menuService';
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
  onNavigateToCreateRestaurant: (userId: string, email: string) => void;
  onLoginSuccess: (restaurantId: string, restaurantName: string) => void;
  isDemo?: boolean;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  menuItems, setMenuItems, categories, setCategories, feedbacks, setFeedbacks, salesHistory, setSalesHistory, adminCreds, setAdminCreds, onExit, onLogoUpdate, onThemeUpdate, appTheme, onOpenFAQ, onBackToMenu, onNavigateToCreateMenu, onNavigateToCreateRestaurant, onLoginSuccess, isDemo
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(isDemo || false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasRestaurant, setHasRestaurant] = useState<boolean | null>(null);
  const [hasConfirmedAccount, setHasConfirmedAccount] = useState(() => {
    return sessionStorage.getItem('hasConfirmedAccount') === 'true';
  });
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || null);
        setUserId(session.user.id || null);
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
        setUserId(session.user.id || null);
        const restaurant = await MenuService.getRestaurantByOwnerId(session.user.id);
        setHasRestaurant(!!restaurant);
        if (event === 'SIGNED_IN') {
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserId(null);
        setHasRestaurant(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      let redirectUrl = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null' 
        ? window.location.origin 
        : 'https://ais-dev-vq36wkzk5myyzjspsrxtyg-10111269819.asia-east1.run.app';

      if (window.location.hostname.includes('mymenu.asia')) {
          redirectUrl = 'https://www.mymenu.asia';
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (e: any) {
      console.error("Login failed", e.message);
    }
  };

  const handleConfirmAccount = () => {
    setHasConfirmedAccount(true);
    sessionStorage.setItem('hasConfirmedAccount', 'true');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    sessionStorage.removeItem('hasConfirmedAccount');
    window.location.href = '/';
  };

  if (!hasCheckedSession) {
    return (
      <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center font-jakarta">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-6 text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Initializing</p>
      </div>
    );
  }

  if (isAuthenticated && !hasConfirmedAccount && !isDemo) {
    return (
      <div className="fixed inset-0 bg-white z-[200] flex flex-col font-jakarta selection:bg-slate-100">
        <header className="flex items-center justify-end p-6">
          {onBackToMenu && (
            <button 
              onClick={onBackToMenu}
              className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group"
            >
              <span className="text-sm font-bold uppercase tracking-widest">Close</span>
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors">
                <i className="fa-solid fa-xmark text-sm"></i>
              </div>
            </button>
          )}
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner border border-slate-100">
              <i className="fa-solid fa-user-tie text-4xl text-slate-300"></i>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-slate-500 font-medium text-base">
                You are currently logged in as <br/>
                <span className="font-bold text-slate-900">{userEmail}</span>
              </p>
            </div>

            <div className="space-y-4 pt-6">
              <button 
                onClick={handleConfirmAccount}
                className="w-full h-14 bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all uppercase tracking-widest flex items-center justify-center gap-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Continue as {userEmail?.split('@')[0]}</span>
                <i className="fa-solid fa-arrow-right text-sm"></i>
              </button>
              
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-xs font-bold text-slate-300 uppercase tracking-widest">Or</span>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full h-14 bg-white text-slate-900 border-2 border-slate-200 font-bold text-sm hover:border-slate-900 hover:bg-slate-50 transition-colors uppercase tracking-widest flex items-center justify-center gap-4"
              >
                <i className="fa-brands fa-google text-lg"></i>
                <span>Login with another account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (hasRestaurant === false) {
      return (
        <RestaurantNameEditor 
          userId={userId || ''}
          email={userEmail || ''}
          onComplete={() => {
            setHasRestaurant(true);
            setHasConfirmedAccount(true);
            window.history.pushState(null, '', '/admin');
          }} 
        />
      );
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
        initialUserId={userId}
        initialUserEmail={userEmail}
      />
    );
  }

  return (
    <>
    <div className="fixed inset-0 bg-white z-[200] flex flex-col font-jakarta selection:bg-slate-100">
      <header className="flex items-center justify-between p-6">
        <div className="w-10 h-10 bg-slate-900 flex items-center justify-center text-white">
           <span className="text-xl font-black">M</span>
        </div>
        {onBackToMenu && (
          <button 
            onClick={onBackToMenu}
            className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group"
          >
            <span className="text-sm font-bold uppercase tracking-widest">Close</span>
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors">
              <i className="fa-solid fa-xmark text-sm"></i>
            </div>
          </button>
        )}
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                {isDemo ? 'Demo Access' : 'Merchant Login'}
            </h2>
            <div className="w-12 h-1 bg-indigo-600"></div>
            <p className="text-slate-500 font-medium text-base">
                {isDemo ? 'Explore the admin dashboard in view-only mode.' : 'Sign in to manage your restaurant.'}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
                {isDemo ? (
                    <>
                        <button 
                            onClick={() => { 
                                setUserId('0016aebe-a2fa-4914-b7c7-83bd5f0c84d0');
                                setUserEmail('demo@mymenu.asia');
                                setIsAuthenticated(true); 
                            }}
                            className="w-full h-14 bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors uppercase tracking-widest flex items-center justify-center gap-4"
                        >
                            <span>Continue to demo</span>
                            <i className="fa-solid fa-arrow-right text-sm"></i>
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={handleGoogleLogin}
                        className="w-full h-14 bg-white border-2 border-slate-100 text-slate-900 font-bold text-sm hover:bg-slate-50 transition-colors uppercase tracking-widest flex items-center justify-center gap-4 rounded-xl"
                    >
                        <i className="fa-brands fa-google text-lg"></i>
                        <span>Sign in with Google</span>
                    </button>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};



export { AdminView as default };