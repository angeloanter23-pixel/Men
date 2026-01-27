
import React, { useState, useRef, useEffect } from 'react';
import AdminMenu from './AdminMenu';
import AdminAnalytics from './AdminAnalytics';
import AdminQR from './AdminQR';
import AdminSettings from './AdminSettings';
import AdminBranches from './AdminBranches';
import AdminOrders from './AdminOrders';
import AdminAccounts from './AdminAccounts';
import { MenuItem, Category, Feedback, SalesRecord } from '../../types';
import * as MenuService from '../../services/menuService';

type AdminTab = 'menu' | 'analytics' | 'branches' | 'qr' | 'settings' | 'orders' | 'accounts' | 'import-preview';

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
  const [availableBranches, setAvailableBranches] = useState<any[]>([]);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;
  const userRole = session?.user?.role;
  const isSuperAdmin = userRole === 'super-admin';
  const isBranchManager = userRole === 'branch-manager';

  useEffect(() => {
    if (restaurantId && restaurantId !== "undefined") {
      refreshAllData();
      const interval = setInterval(syncSalesOnly, 30000);
      
      const hasSeenRole = sessionStorage.getItem('foodie_role_verified');
      if (!hasSeenRole) {
        setShowRoleDialog(true);
      }
      
      return () => clearInterval(interval);
    }
  }, [restaurantId]);

  const syncSalesOnly = async () => {
    if (!restaurantId) return;
    try {
      const dbOrders = await MenuService.getMerchantOrders(restaurantId);
      const mappedSales: SalesRecord[] = dbOrders.map((o: any) => ({
        timestamp: o.created_at,
        amount: o.amount,
        itemId: parseInt(o.item_id),
        itemName: o.item_name,
        categoryName: 'General',
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
    try {
      const [cloudMenu, branches] = await Promise.all([
        MenuService.getMenuByRestaurantId(restaurantId),
        MenuService.getBranchesForRestaurant(restaurantId)
      ]);
      
      if (cloudMenu) {
        setMenuItems(cloudMenu.items || []);
        setCategories(cloudMenu.categories || []);
      }
      if (branches) {
        setAvailableBranches(branches);
      }
      await syncSalesOnly();
    } catch (err: any) {
      console.error("Refresh failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleVerifyRole = () => {
    setShowRoleDialog(false);
    sessionStorage.setItem('foodie_role_verified', 'true');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'menu': return <AdminMenu items={menuItems} setItems={setMenuItems} cats={categories} setCats={setCategories} availableBranches={availableBranches} />;
      case 'analytics': return <AdminAnalytics feedbacks={feedbacks} salesHistory={salesHistory} setSalesHistory={setSalesHistory} menuItems={menuItems} />;
      case 'branches': return isSuperAdmin ? <AdminBranches /> : <AdminMenu items={menuItems} setItems={setMenuItems} cats={categories} setCats={setCategories} availableBranches={availableBranches} />;
      case 'qr': return <AdminQR availableBranches={availableBranches} />;
      case 'orders': return <AdminOrders />;
      case 'accounts': return <AdminAccounts branches={availableBranches} setActiveTab={setActiveTab} />;
      case 'settings': return <AdminSettings onLogout={onLogout} adminCreds={adminCreds} setAdminCreds={setAdminCreds} onImportClick={() => fileInputRef.current?.click()} />;
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
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" />
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-[90] backdrop-blur-sm" />}
      
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-[#0f172a] text-slate-400 h-full p-6 flex flex-col z-[100] transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex justify-between items-center px-2">
          <h1 className="text-xl font-black italic tracking-tighter text-white uppercase">Admin<span className="text-indigo-500">Panel</span></h1>
        </div>
        <nav className="flex-1 space-y-2">
          {navItem('menu', 'fa-utensils', 'Menu Editor')}
          {navItem('orders', 'fa-receipt', 'Live Orders')}
          {navItem('analytics', 'fa-chart-pie', 'Sales & Stats')}
          {isSuperAdmin && navItem('branches', 'fa-sitemap', 'Branches')}
          {navItem('qr', 'fa-qrcode', 'QR Codes')}
          {navItem('accounts', 'fa-user-group', 'Staff & Accounts')}
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

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-600"><i className="fa-solid fa-bars-staggered"></i></button>
             <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Panel / <span className="text-slate-900">{activeTab}</span></h2>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
             <i className={`fa-solid ${isSuperAdmin ? 'fa-crown' : 'fa-shield-halved'} text-indigo-600 text-[10px]`}></i>
             <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{isSuperAdmin ? 'Super Admin' : 'Branch Manager'}</span>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-slate-50 relative no-scrollbar pb-20">
          {renderContent()}
        </main>
      </div>

      {showRoleDialog && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-8 animate-fade-in">
          <div className="bg-white rounded-[4rem] p-12 w-full max-w-sm text-center shadow-2xl space-y-10 animate-scale">
            <div className={`w-24 h-24 mx-auto rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl ${isSuperAdmin ? 'bg-slate-900' : 'bg-indigo-600'}`}>
              <i className={`fa-solid ${isSuperAdmin ? 'fa-crown' : 'fa-user-shield'} text-4xl`}></i>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.5em]">Identity Check</p>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">
                {isSuperAdmin ? 'Super Admin' : 'Branch Manager'}
              </h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {isSuperAdmin 
                  ? 'Access granted to all branches. You can manage everything.' 
                  : 'Access granted to your branch. You can manage your staff and menu.'}
              </p>
            </div>
            <button 
              onClick={handleVerifyRole} 
              className="w-full bg-slate-900 text-white h-20 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-xl active:scale-95 transition-all hover:bg-indigo-600"
            >
              Enter Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
