
import React, { useState, useEffect } from 'react';
import AdminMenu from './AdminMenu';
import AdminAnalytics from './AdminAnalytics';
import AdminQR from './AdminQR';
import AdminSettings from './AdminSettings';
import AdminOrders from './AdminOrders';
import AdminAccounts from './AdminAccounts';
import AdminLegal from './AdminLegal';
import AdminAbout from './AdminAbout';
import { MenuItem, Category, Feedback, SalesRecord } from '../../types';
import * as MenuService from '../../services/menuService';
import { supabase } from '../../lib/supabase';

type AdminTab = 'menu' | 'analytics' | 'qr' | 'settings' | 'orders' | 'accounts';
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
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onLogout, menuItems, setMenuItems, categories, setCategories, feedbacks, setFeedbacks, salesHistory, setSalesHistory, adminCreds, setAdminCreds, onLogoUpdate, onThemeUpdate, appTheme, onOpenFAQ 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('menu');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('general');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [menuId, setMenuId] = useState<number | null>(null);
  
  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

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

  const navItemsConfig: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'menu', icon: 'fa-utensils', label: 'Menu Editor' },
    { id: 'orders', icon: 'fa-message', label: 'Console' },
    { id: 'analytics', icon: 'fa-chart-pie', label: 'Stats' },
    { id: 'qr', icon: 'fa-qrcode', label: 'QR Tokens' },
    { id: 'accounts', icon: 'fa-user-group', label: 'Team' },
    { id: 'settings', icon: 'fa-gears', label: 'Site Settings' }
  ];

  const renderNavButton = (config: typeof navItemsConfig[0]) => (
    <button 
      key={config.id}
      onClick={() => { setActiveTab(config.id); setSettingsSubTab('general'); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all group mb-1 text-left ${activeTab === config.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
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

  const renderContent = () => {
    switch (activeTab) {
      case 'menu': return <AdminMenu items={menuItems} setItems={setMenuItems} cats={categories} setCats={setCategories} menuId={menuId} restaurantId={restaurantId} onOpenFAQ={onOpenFAQ} />;
      case 'analytics': return <AdminAnalytics feedbacks={feedbacks} salesHistory={salesHistory} setSalesHistory={setSalesHistory} menuItems={menuItems} appTheme={appTheme} onThemeUpdate={onThemeUpdate} />;
      case 'qr': return <AdminQR />;
      case 'orders': return <AdminOrders />;
      case 'accounts': return <AdminAccounts setActiveTab={setActiveTab} />;
      case 'settings':
        return (
          <div className="animate-fade-in space-y-6">
            {settingsSubTab === 'general' && (
              <AdminSettings 
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

  const currentTabLabel = navItemsConfig.find(n => n.id === activeTab)?.label || 'Dashboard';

  return (
    <div className="flex h-screen w-full bg-[#F2F2F7] overflow-hidden font-jakarta">
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90]" />}
      <aside className={`fixed lg:static inset-y-0 left-0 w-80 bg-[#0f172a] h-full flex flex-col z-[100] transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-utensils text-sm"></i></div>
            <h1 className="font-black text-2xl text-white tracking-tighter uppercase">FOODIE</h1>
          </div>
          <nav className="space-y-1">{navItemsConfig.map(config => renderNavButton(config))}</nav>
        </div>
        <div className="mt-auto p-6"><button onClick={onLogout} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-700 hover:bg-rose-600 transition-all">Sign Out</button></div>
      </aside>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/40 h-24 flex items-center justify-between px-6 md:px-12 shrink-0">
          <div className="flex items-center gap-6">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm"><i className="fa-solid fa-bars-staggered text-sm"></i></button>
             <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">{currentTabLabel}</h2>
          </div>
          <div className="flex items-center gap-4">
             {/* Account icon removed */}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto no-scrollbar bg-[#F2F2F7] p-4 md:p-8">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
