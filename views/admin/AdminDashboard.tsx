import React, { useState, useRef, useEffect, useMemo } from 'react';
import AdminMenu from './AdminMenu';
import AdminAnalytics from './AdminAnalytics';
import AdminQR from './AdminQR';
import AdminSettings from './AdminSettings';
import AdminOrders from './AdminOrders';
import AdminAccounts from './AdminAccounts';
import { MenuItem, Category, Feedback, SalesRecord } from '../../types';
import * as MenuService from '../../services/menuService';
import { supabase } from '../../lib/supabase';

type AdminTab = 'menu' | 'analytics' | 'qr' | 'settings' | 'orders' | 'accounts' | 'import-preview';

interface ProgressItem {
  data: any;
  exists: boolean;
}

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
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onLogout, menuItems, setMenuItems, categories, setCategories, feedbacks, setFeedbacks, salesHistory, setSalesHistory, adminCreds, setAdminCreds, onLogoUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('menu');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  
  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;
  const userRole = session?.user?.role;
  const isSuperAdmin = userRole === 'super-admin';

  useEffect(() => {
    if (!restaurantId || restaurantId === "undefined") return;
    refreshAllData();
    
    // Alert listener
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
    setIsSyncing(true);
    try {
      const cloudMenu = await MenuService.getMenuByRestaurantId(restaurantId);
      if (cloudMenu) {
        setMenuItems(cloudMenu.items || []);
        setCategories(cloudMenu.categories || []);
      }
    } catch (err: any) {
      console.error("Refresh failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const navItem = (id: AdminTab, icon: string, label: string) => (
    <button 
      onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
      className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      <div className="flex items-center gap-4 relative">
        <i className={`fa-solid ${icon}`}></i>
        <span>{label}</span>
        {id === 'orders' && activeAlertCount > 0 && (
            <span className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-[#0f172a] shadow-sm animate-pulse"></span>
        )}
      </div>
      {id === 'orders' && activeAlertCount > 0 && (
        <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-black">{activeAlertCount}</span>
      )}
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'menu': return <AdminMenu items={menuItems} setItems={setMenuItems} cats={categories} setCats={setCategories} />;
      case 'analytics': return <AdminAnalytics feedbacks={feedbacks} salesHistory={salesHistory} setSalesHistory={setSalesHistory} menuItems={menuItems} />;
      case 'qr': return <AdminQR />;
      case 'orders': return <AdminOrders />;
      case 'accounts': return <AdminAccounts setActiveTab={setActiveTab} />;
      case 'settings': return <AdminSettings onLogout={onLogout} adminCreds={adminCreds} setAdminCreds={setAdminCreds} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-jakarta">
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-[90] backdrop-blur-sm" />}
      
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-[#0f172a] text-slate-400 h-full p-6 flex flex-col z-[100] transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex justify-between items-center px-2">
          <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">SHARP. <span className="text-indigo-500">ADMIN</span></h1>
        </div>
        <nav className="flex-1 space-y-2">
          {navItem('menu', 'fa-utensils', 'Menu Editor')}
          {navItem('orders', 'fa-bell', 'Alerts')}
          {navItem('analytics', 'fa-chart-pie', 'Sales & Stats')}
          {navItem('qr', 'fa-qrcode', 'QR Codes')}
          {navItem('accounts', 'fa-user-group', 'Staff & Accounts')}
          {navItem('settings', 'fa-gears', 'Settings')}
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-800 px-2">
           <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-black uppercase text-rose-400 hover:bg-rose-500/10">
            <i className="fa-solid fa-right-from-bracket"></i> Exit
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-600"><i className="fa-solid fa-bars-staggered"></i></button>
             <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Hub / <span className="text-slate-900 uppercase">{activeTab === 'orders' ? 'ALERTS' : activeTab}</span></h2>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
             <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{session?.restaurant?.name || 'Restaurant'}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 relative no-scrollbar">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;