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
  onLoginSuccess: (restaurantId: string, restaurantName: string) => void;
  isDemo?: boolean;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  menuItems, setMenuItems, categories, setCategories, feedbacks, setFeedbacks, salesHistory, setSalesHistory, adminCreds, setAdminCreds, onExit, onLogoUpdate, onThemeUpdate, appTheme, onOpenFAQ, onBackToMenu, onNavigateToCreateMenu, onLoginSuccess, isDemo
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(isDemo || false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasRestaurant, setHasRestaurant] = useState<boolean | null>(null);
  const [hasConfirmedAccount, setHasConfirmedAccount] = useState(false);
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



  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
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

  if (isAuthenticated) {
    if (hasRestaurant === false) {
      if (userEmail && !hasConfirmedAccount) {
        return (
          <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center p-6 font-jakarta">
            <div className="w-full max-w-md space-y-8 text-center">
              <h2 className="text-3xl font-black text-slate-900">Welcome back</h2>
              <p className="text-slate-500">You are logged in as <strong className="text-slate-900">{userEmail}</strong></p>
              <button 
                onClick={() => setHasConfirmedAccount(true)}
                className="w-full h-14 bg-slate-900 text-white font-bold rounded-xl"
              >
                Continue as {userEmail}
              </button>
              <button onClick={handleLogout} className="text-slate-500 hover:text-slate-900">Logout</button>
            </div>
          </div>
        );
      }
      return (
        <RestaurantNameEditor 
          userId={userId || ''}
          email={userEmail || ''}
          onComplete={() => {
            setHasRestaurant(true);
            window.location.reload();
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
                <p className="text-slate-500 font-medium text-sm text-center">
                    Restaurant ID: <span className="font-mono font-bold text-slate-900">aeec6204-496e-46c4-adfb-ba154fa92153</span>
                </p>
                <button 
                    onClick={() => { setIsAuthenticated(true); }}
                    className="w-full h-14 bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors uppercase tracking-widest flex items-center justify-center gap-4"
                >
                    <span>Continue to demo</span>
                    <i className="fa-solid fa-arrow-right text-sm"></i>
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};



export { AdminView as default };