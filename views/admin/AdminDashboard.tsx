import React, { useState, useEffect } from 'react';
import AdminMenu from './AdminMenu';
import AdminAnalytics from './AdminAnalytics';
import AdminQR from './AdminQR';
import AdminSettings from './AdminSettings';
import AdminOrders from './AdminOrders';
import AdminLegal from './AdminLegal';
import AdminAbout from './AdminAbout';
import AdminApps from './AdminApps';
import { QuickSetupWizard } from '../../components/QuickSetupWizard';
import { DemoOrderModal } from '../../components/DemoOrderModal';
import { UpgradeView } from '../UpgradeView';
import { MenuItem, Category, Feedback, SalesRecord } from '../../types';
import * as MenuService from '../../services/menuService';
import { supabase } from '../../lib/supabase';

type AdminTab = 'menu' | 'analytics' | 'qr' | 'settings' | 'orders' | 'apps' | 'setup-wizard';
type SettingsSubTab = 'general' | 'about' | 'terms' | 'privacy';

interface AdminDashboardProps {
  onLogout: () => void;
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
  onLogoUpdate: (logo: string | null) => void;
  onThemeUpdate: (theme: any) => void;
  appTheme: any;
  onOpenFAQ?: () => void;
  onNavigateToCreateMenu: () => void;
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onLogout, menuItems, setMenuItems, categories, setCategories, feedbacks, setFeedbacks, salesHistory, setSalesHistory, adminCreds, setAdminCreds, onLogoUpdate, onThemeUpdate, appTheme, onOpenFAQ, onNavigateToCreateMenu, onExit 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const hash = window.location.hash.replace('#', '');
    return (hash === 'menu' || hash === 'qr') ? hash as AdminTab : 'menu';
  });
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('general');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [showRestrictModal, setShowRestrictModal] = useState(false);
  const [restrictModalContent, setRestrictModalContent] = useState({ title: '', message: '' });
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [accountType, setAccountType] = useState<'demo' | 'trial' | 'pro'>('demo');
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);
  const [trialTimeLeft, setTrialTimeLeft] = useState<string>('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDemoNotice, setShowDemoNotice] = useState(false);
  const [upgradeStep, setUpgradeStep] = useState<'pricing' | 'payment' | 'contact'>('pricing');
  
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'menu' || hash === 'qr') {
        window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!trialEndDate) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = trialEndDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTrialTimeLeft('0d 0h 0m 0s');
        setIsTrialExpired(true);
        return false;
      }
      const h = Math.floor((diff / (1000 * 60 * 60)));
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTrialTimeLeft(`${h}h ${m}m ${s}s`);
      return true;
    };

    updateCountdown(); // Run immediately
    const interval = setInterval(() => {
      if (!updateCountdown()) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [trialEndDate]);

  useEffect(() => {
    const fetchUserAndRestaurant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setCurrentUserEmail(user.email);
        setCurrentUserId(user.id);
        
        let foundRestaurantId = null;
        let userRole = 'super-admin';

        // 1. Check if user is an owner
        const ownerRestaurant = await MenuService.getRestaurantByOwnerId(user.id);
        if (ownerRestaurant) {
            foundRestaurantId = ownerRestaurant.id;
            setAccountType(ownerRestaurant.account_type === 'trial' ? 'trial' : 'pro');
            
            // Check trial status
            const trialEnd = ownerRestaurant.trial_end_at ? new Date(ownerRestaurant.trial_end_at) : null;
            const now = new Date();
            if (ownerRestaurant.account_type === 'trial' && trialEnd) {
                setTrialEndDate(trialEnd);
                const diffTime = trialEnd.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setTrialDaysLeft(diffDays > 0 ? diffDays : 0);
                if (diffDays <= 0) {
                    setIsTrialExpired(true);
                }
            }
        } else {
            // 2. Check if user is staff (public.users table)
            const { data: publicUsers } = await supabase
              .from('users')
              .select('restaurant_id, role')
              .eq('email', user.email)
              .limit(1);
            
            if (publicUsers && publicUsers.length > 0 && publicUsers[0].restaurant_id) {
                foundRestaurantId = publicUsers[0].restaurant_id;
                userRole = publicUsers[0].role;

                // Fetch the restaurant to get account_type and trial info
                const { data: restData } = await supabase.from('restaurants').select('*').eq('id', foundRestaurantId).single();
                if (restData) {
                    setAccountType(restData.account_type === 'trial' ? 'trial' : 'pro');
                    
                    const trialEnd = restData.trial_end_at ? new Date(restData.trial_end_at) : null;
                    const now = new Date();
                    if (restData.account_type === 'trial' && trialEnd) {
                        setTrialEndDate(trialEnd);
                        const diffTime = trialEnd.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        setTrialDaysLeft(diffDays > 0 ? diffDays : 0);
                        if (diffDays <= 0) {
                            setIsTrialExpired(true);
                        }
                    }
                }
            }
        }
        
        if (foundRestaurantId) {
          setRestaurantId(foundRestaurantId);
          setAdminCreds(prev => ({ ...prev, role: userRole, email: user.email }));
        } else {
          if (user.email !== 'demo1@mymenu') {
            setShowSetupWizard(true);
          } else {
            setAccountType('demo');
          }
        }
      }
    };
    fetchUserAndRestaurant();
  }, []);

  useEffect(() => {
    if (currentUserEmail === 'demo1@mymenu') setShowDemoNotice(true);
  }, [currentUserEmail]);

  useEffect(() => {
    if (!restaurantId || restaurantId === "undefined") return;
    refreshAllData();
    
    const orderChannel = supabase.channel('admin-sidebar-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, () => {
        checkActiveAlerts();
      })
      .subscribe();
    
    checkActiveAlerts();
    return () => { supabase.removeChannel(orderChannel); };
  }, [restaurantId]);

  const checkActiveAlerts = async () => {
    if (!restaurantId) return;
    try {
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .in('order_status', ['Pending', 'Preparing', 'Serving']);
      setActiveAlertCount(data?.length || 0);
    } catch (e) {}
  };

  const refreshAllData = async () => {
    if (!restaurantId || restaurantId === "undefined") return;
    try {
      const cloudMenu = await MenuService.getMenuByRestaurantId(restaurantId);
      if (cloudMenu) {
        setMenuId(cloudMenu.menu_id);
        setMenuItems(cloudMenu.items || []);
        setCategories(cloudMenu.categories || []);
      }
      
      const cloudFeedbacks = await MenuService.getFeedbacks(restaurantId);
      setFeedbacks(cloudFeedbacks);

    } catch (err: any) {
      console.error("Refresh failed", err);
    }
  };

  const mainNav: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'menu', icon: 'fa-utensils', label: 'Menu Editor' },
    { id: 'orders', icon: 'fa-message', label: 'Console' },
    { id: 'analytics', icon: 'fa-chart-pie', label: 'Stats' },
    { id: 'qr', icon: 'fa-qrcode', label: 'QR and Tables' },
  ];

  const appsNav: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'apps', icon: 'fa-cubes', label: 'Apps' },
  ];

  const settingsNav: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'settings', icon: 'fa-gears', label: 'Site Settings' }
  ];

  const isDemoUser = currentUserEmail === 'demo1@mymenu';

  const triggerRestrictModal = (title: string, message: string) => {
    setRestrictModalContent({ title, message });
    setShowRestrictModal(true);
  };

  const renderNavButton = (config: any) => (
    <button 
      key={config.id}
      onClick={() => { 
        if (config.id === 'exit-demo') {
            onLogout();
            onExit();
            return;
        }
        if (config.id === 'setup-wizard') {
            setShowSetupWizard(true);
            return;
        }
        setActiveTab(config.id); 
        setSettingsSubTab('general'); 
        setIsSidebarOpen(false); 
      }}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all group mb-1 text-left ${activeTab === config.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      <i className={`fa-solid ${config.icon} text-base transition-colors ${activeTab === config.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}></i> 
      <div className="flex-1 flex items-center justify-between">
        <span className="uppercase tracking-widest text-[11px] font-bold">{config.label}</span>
        {config.id === 'orders' && activeAlertCount > 0 && (
          <span className="bg-[#FF3B30] text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">{activeAlertCount}</span>
        )}
      </div>
    </button>
  );

  if (isDemoUser) {
    if (!settingsNav.find(n => n.id === 'exit-demo' as any)) {
        settingsNav.push({ id: 'exit-demo' as any, icon: 'fa-door-open', label: 'Exit Demo' });
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'menu': return <AdminMenu onCreateMenu={onNavigateToCreateMenu} isDemo={isDemoUser} items={menuItems} setItems={setMenuItems} cats={categories} setCats={setCategories} menuId={menuId} restaurantId={restaurantId} onOpenFAQ={onOpenFAQ} />;
      case 'analytics': return <AdminAnalytics restaurantId={restaurantId} feedbacks={feedbacks} salesHistory={salesHistory} setSalesHistory={setSalesHistory} menuItems={menuItems} appTheme={appTheme} onThemeUpdate={onThemeUpdate} />;
      case 'qr': return <AdminQR restaurantId={restaurantId} isDemo={isDemoUser} onRestrict={triggerRestrictModal} />;
      case 'orders': return <AdminOrders restaurantId={restaurantId} isDemo={isDemoUser} onRestrict={triggerRestrictModal} />;
      case 'apps': return <AdminApps restaurantId={restaurantId} isDemo={isDemoUser} onRestrict={triggerRestrictModal} />;
      case 'settings':
        return (
          <div className="animate-fade-in space-y-6">
            {settingsSubTab === 'general' && (
              <AdminSettings 
                restaurantId={restaurantId}
                userId={currentUserId}
                userEmail={currentUserEmail}
                onLogout={onLogout} 
                adminCreds={adminCreds} 
                setAdminCreds={setAdminCreds} 
                onThemeUpdate={onThemeUpdate} 
                onSubTabChange={(sub) => setSettingsSubTab(sub as SettingsSubTab)}
              />
            )}
            {settingsSubTab === 'about' && <AdminAbout restaurantId={restaurantId} onBack={() => setSettingsSubTab('general')} />}
            {settingsSubTab === 'terms' && <AdminLegal restaurantId={restaurantId} initialDocType="terms" onBack={() => setSettingsSubTab('general')} />}
            {settingsSubTab === 'privacy' && <AdminLegal restaurantId={restaurantId} initialDocType="privacy" onBack={() => setSettingsSubTab('general')} />}
          </div>
        );
      default: return null;
    }
  };

  const currentTabLabel = activeTab === 'qr' ? 'QR and Tables' : (mainNav.find(n => n.id === activeTab) || appsNav.find(n => n.id === activeTab) || settingsNav.find(n => n.id === activeTab))?.label || 'Dashboard';

  if (showSetupWizard && currentUserId && currentUserEmail) {
    return (
      <QuickSetupWizard 
        userId={currentUserId}
        email={currentUserEmail}
        onComplete={(nextAction) => {
          setShowSetupWizard(false);
          if (nextAction) {
              window.location.hash = nextAction;
          }
          window.location.reload();
        }} 
      />
    );
  }

  if (isTrialExpired) {
    return <UpgradeView onLogout={onLogout} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#F2F2F7] overflow-hidden font-jakarta">
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90]" />}
      <aside className={`fixed lg:static inset-y-0 left-0 w-80 bg-[#0f172a] h-full flex flex-col z-[100] transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-utensils text-sm"></i></div>
            <h1 className="font-black text-2xl text-white tracking-tighter uppercase">FOODIE</h1>
          </div>
          
          <nav className="space-y-6 overflow-y-auto no-scrollbar max-h-[70vh]">
            <div>
               <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Management</p>
               {mainNav.map(n => renderNavButton(n))}
            </div>

            <div>
               <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Utilities</p>
               {appsNav.map(n => renderNavButton(n))}
            </div>

            <div>
               <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Preferences</p>
               {settingsNav.map(n => renderNavButton(n))}
            </div>
          </nav>
        </div>
        <div className="mt-auto p-6 space-y-3">
            <button onClick={onLogout} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-700 hover:bg-rose-600 transition-all">Sign Out</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/40 h-24 flex items-center justify-between px-6 md:px-12 shrink-0">
          <div className="flex items-center gap-6">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm"><i className="fa-solid fa-bars-staggered text-sm"></i></button>
             <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">{currentTabLabel}</h2>
          </div>
          <div className="flex items-center gap-4">
            {accountType === 'trial' && (
               <div className="hidden md:flex bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                     <i className="fa-solid fa-clock text-[10px]"></i>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">Trial</span>
                     <span className="text-xs font-black text-rose-600 leading-none mt-1">{trialTimeLeft}</span>
                  </div>
               </div>
            )}
            <button 
                onClick={() => setShowUpgradeModal(true)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                    accountType === 'demo' ? 'bg-slate-100 text-slate-600' :
                    accountType === 'trial' ? 'bg-slate-900 text-white hover:bg-slate-800' :
                    'bg-emerald-100 text-emerald-600'
                }`}
            >
                {accountType === 'demo' ? 'Demo' : accountType === 'trial' ? 'Trial' : 'Pro'}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto no-scrollbar bg-[#F2F2F7] p-4 md:p-8">{renderContent()}</main>
      </div>

      {showRestrictModal && (
        <DemoOrderModal 
          title={restrictModalContent.title}
          message={restrictModalContent.message}
          onClose={() => setShowRestrictModal(false)}
          onUnderstand={() => setShowRestrictModal(false)}
          onCreateMenu={onNavigateToCreateMenu}
        />
      )}
      {showDemoNotice && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center">
            <div onClick={() => setShowDemoNotice(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <div className="w-full max-w-lg bg-white rounded-t-[2rem] p-8 animate-slide-up relative">
                <button onClick={() => setShowDemoNotice(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"><i className="fa-solid fa-xmark"></i></button>
                <div className="text-center space-y-4">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Demo Mode</h3>
                    <p className="text-slate-500 text-sm">For demo, admin features are restricted to view-only.</p>
                    <button 
                        onClick={() => setShowDemoNotice(false)}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest"
                    >
                        Continue to demo admin
                    </button>
                </div>
            </div>
        </div>
      )}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center">
            <div onClick={() => { setShowUpgradeModal(false); setUpgradeStep('pricing'); }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <div className="w-full max-w-lg bg-white rounded-t-[2rem] p-8 animate-slide-up relative">
                <button onClick={() => { setShowUpgradeModal(false); setUpgradeStep('pricing'); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"><i className="fa-solid fa-xmark"></i></button>
                
                {upgradeStep === 'pricing' && (
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fa-solid fa-crown text-2xl"></i>
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">Professional Plan</h3>
                        <div>
                            <span className="text-4xl font-black tracking-tighter">₱1,299</span>
                            <span className="text-xs font-bold text-slate-400 ml-2">/ one-time</span>
                        </div>
                        <ul className="text-left space-y-3 text-sm font-medium text-slate-600 bg-slate-50 p-6 rounded-2xl">
                            <li className="flex items-center gap-3"><i className="fa-solid fa-check text-emerald-500"></i> Unlimited Table Nodes</li>
                            <li className="flex items-center gap-3"><i className="fa-solid fa-check text-emerald-500"></i> AI Concierge Access</li>
                            <li className="flex items-center gap-3"><i className="fa-solid fa-check text-emerald-500"></i> Priority Staff Messaging</li>
                            <li className="flex items-center gap-3"><i className="fa-solid fa-check text-emerald-500"></i> Sales Insights Hub</li>
                        </ul>
                        <button 
                            onClick={() => setUpgradeStep('payment')}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-colors"
                        >
                            Continue to Payment
                        </button>
                    </div>
                )}

                {upgradeStep === 'payment' && (
                    <div className="space-y-6">
                        <button onClick={() => setUpgradeStep('pricing')} className="text-slate-400 hover:text-slate-900 text-sm font-bold flex items-center gap-2 mb-4">
                            <i className="fa-solid fa-arrow-left"></i> Back
                        </button>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-center">Payment Method</h3>
                        <p className="text-slate-500 text-sm text-center">Please send ₱1,299 to any of the following accounts:</p>
                        
                        <div className="space-y-4">
                            <div className="p-4 border-2 border-slate-100 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">GCash</p>
                                <p className="font-bold text-lg">0912 345 6789</p>
                                <p className="text-sm text-slate-500">Juan Dela Cruz</p>
                            </div>
                            <div className="p-4 border-2 border-slate-100 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">BDO (Bank Transfer)</p>
                                <p className="font-bold text-lg">0012 3456 7890</p>
                                <p className="text-sm text-slate-500">Juan Dela Cruz</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setUpgradeStep('contact')}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                        >
                            I have made the payment
                        </button>
                    </div>
                )}

                {upgradeStep === 'contact' && (
                    <div className="text-center space-y-6">
                        <button onClick={() => setUpgradeStep('payment')} className="absolute top-8 left-8 text-slate-400 hover:text-slate-900 text-sm font-bold flex items-center gap-2">
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fa-solid fa-receipt text-2xl"></i>
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">Send Proof of Payment</h3>
                        <p className="text-slate-500 text-sm">Please send us a screenshot of your transaction to activate your Pro account.</p>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <button 
                                onClick={() => window.open('https://m.me/940288252493266', '_blank')}
                                className="p-4 border-2 border-slate-100 rounded-2xl hover:border-[#0084FF] hover:bg-[#0084FF]/5 transition-colors group flex flex-col items-center gap-3"
                            >
                                <i className="fa-brands fa-facebook-messenger text-3xl text-slate-300 group-hover:text-[#0084FF] transition-colors"></i>
                                <span className="font-bold text-sm text-slate-600 group-hover:text-[#0084FF]">Messenger</span>
                            </button>
                            <button 
                                onClick={() => window.location.href = 'mailto:support@mymenu.asia?subject=Pro%20Upgrade%20Payment'}
                                className="p-4 border-2 border-slate-100 rounded-2xl hover:border-rose-500 hover:bg-rose-50 transition-colors group flex flex-col items-center gap-3"
                            >
                                <i className="fa-solid fa-envelope text-3xl text-slate-300 group-hover:text-rose-500 transition-colors"></i>
                                <span className="font-bold text-sm text-slate-600 group-hover:text-rose-500">Email</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;