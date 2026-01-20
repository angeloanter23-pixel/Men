
import React, { useState, useRef, useEffect } from 'react';
import AdminMenu from './AdminMenu';
import AdminAnalytics from './AdminAnalytics';
import AdminQR from './AdminQR';
import AdminSettings from './AdminSettings';
import AdminBranches from './AdminBranches';
import AdminOrders from './AdminOrders';
import { MenuItem, Category, Feedback, SalesRecord } from '../../types';
import * as MenuService from '../../services/menuService';

type AdminTab = 'menu' | 'analytics' | 'branches' | 'qr' | 'settings' | 'orders' | 'import-preview';

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
  const [syncProgress, setSyncProgress] = useState<{current: number, total: number, label: string}>({ current: 0, total: 0, label: '' });
  const [previewData, setPreviewData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

  // 1. Sync Menu and Orders (Sales) from database on load
  useEffect(() => {
    if (restaurantId && restaurantId !== "undefined") {
      refreshAllData();
      // Poll for new sales/orders every 30 seconds to update charts
      const interval = setInterval(syncSalesOnly, 30000);
      return () => clearInterval(interval);
    }
  }, [restaurantId]);

  const syncSalesOnly = async () => {
    if (!restaurantId) return;
    try {
      const dbOrders = await MenuService.getMerchantOrders(restaurantId);
      // Map DB orders to the SalesRecord format used by Analytics charts
      const mappedSales: SalesRecord[] = dbOrders.map((o: any) => ({
        timestamp: o.created_at,
        amount: o.amount,
        itemId: parseInt(o.item_id),
        itemName: o.item_name,
        categoryName: 'General', // Simplified for now
        quantity: o.quantity,
        branch: o.branch || 'Main',
        paymentStatus: o.payment_status,
        orderStatus: o.order_status
      }));
      setSalesHistory(mappedSales);
    } catch (e) {
      console.error("Sales sync failed", e);
    }
  };

  const refreshAllData = async () => {
    if (!restaurantId || restaurantId === "undefined") return;
    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 100, label: 'Syncing with Server...' });
    try {
      const cloudMenu = await MenuService.getMenuByRestaurantId(restaurantId);
      if (cloudMenu) {
        setMenuItems(cloudMenu.items || []);
        setCategories(cloudMenu.categories || []);
      }
      await syncSalesOnly();
    } catch (err: any) {
      console.error("Refresh failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLoadConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        setPreviewData(backup);
        setActiveTab('import-preview');
      } catch (err) {
        alert("Invalid file.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'menu': return <AdminMenu items={menuItems} setItems={setMenuItems} cats={categories} setCats={setCategories} />;
      case 'analytics': return <AdminAnalytics feedbacks={feedbacks} salesHistory={salesHistory} setSalesHistory={setSalesHistory} menuItems={menuItems} />;
      case 'branches': return <AdminBranches />;
      case 'qr': return <AdminQR />;
      case 'orders': return <AdminOrders salesHistory={salesHistory} setSalesHistory={setSalesHistory} />;
      case 'settings': return <AdminSettings onLogout={onLogout} adminCreds={adminCreds} setAdminCreds={setAdminCreds} />;
      default: return null;
    }
  };

  const navItem = (id: AdminTab, icon: string, label: string) => (
    <button 
      onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
    >
      <i className={`fa-solid ${icon}`}></i> {label}
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-['Plus_Jakarta_Sans']">
      {isSidebarOpen && <div onClick={toggleSidebar} className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-[#0f172a] text-slate-400 h-full p-6 flex flex-col z-[60] transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex justify-between items-center px-2">
          <h1 className="text-xl font-black italic tracking-tighter text-white uppercase">Admin<span className="text-indigo-500">Panel</span></h1>
        </div>
        <nav className="flex-1 space-y-2">
          {navItem('menu', 'fa-utensils', 'Menu Editor')}
          {navItem('orders', 'fa-receipt', 'Live Orders')}
          {navItem('analytics', 'fa-chart-pie', 'Sales & Stats')}
          {navItem('branches', 'fa-sitemap', 'Branches')}
          {navItem('qr', 'fa-qrcode', 'QR Codes')}
          {navItem('settings', 'fa-gears', 'Settings')}
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-800 px-2">
           <button onClick={refreshAllData} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-black uppercase text-indigo-400 hover:bg-indigo-500/10 mb-4 transition-all">
             <i className={`fa-solid fa-rotate ${isSyncing ? 'animate-spin' : ''}`}></i> Sync Data
           </button>
           <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-black uppercase text-rose-400 hover:bg-rose-500/10">
            <i className="fa-solid fa-right-from-bracket"></i> Exit
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={toggleSidebar} className="lg:hidden text-slate-600"><i className="fa-solid fa-bars-staggered"></i></button>
             <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Panel / <span className="text-slate-900 italic">{activeTab}</span></h2>
          </div>
          {isSyncing && <div className="text-[10px] font-black uppercase text-indigo-600 animate-pulse">{syncProgress.label}</div>}
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 relative no-scrollbar pb-20">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
