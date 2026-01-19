
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

  // Auto-sync from cloud on load
  useEffect(() => {
    if (restaurantId && restaurantId !== "undefined") {
      refreshCloudMenu();
    }
  }, [restaurantId]);

  const refreshCloudMenu = async () => {
    if (!restaurantId || restaurantId === "undefined") return;
    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 100, label: 'Synchronizing with Database...' });
    try {
      // Direct call to fetch from database, ignoring local mockups
      const cloudMenu = await MenuService.getMenuByRestaurantId(restaurantId);
      
      // HARD OVERWRITE: Clear current state and use database values.
      // If the database returns empty categories/items, the editor will correctly show an empty state.
      if (cloudMenu) {
        setMenuItems(cloudMenu.items || []);
        setCategories(cloudMenu.categories || []);
      }
    } catch (err: any) {
      const errorMsg = err.message || JSON.stringify(err);
      console.error("Cloud Refresh Failed:", errorMsg);
      setSyncProgress(p => ({ ...p, label: `Sync Error: ${errorMsg.slice(0, 15)}...` }));
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
        alert("Manifest Error: Invalid JSON configuration.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const commitImportToCloud = async () => {
    if (!previewData) return;
    const menuId = session?.defaultMenuId;
    if (!restaurantId || !menuId || restaurantId === "undefined") return alert("Enterprise Context Missing.");

    setIsSyncing(true);
    try {
      const menuData = previewData.menu?.items || previewData.menu?.menuItems || previewData.menu || [];
      const categoryData = previewData.menu?.categories || previewData.categories || [];
      const totalSteps = categoryData.length + menuData.length;
      let currentStep = 0;

      const currentCats = [...categories];

      for (const cat of categoryData) {
        setSyncProgress(p => ({ ...p, label: `Syncing: ${cat.name}`, current: ++currentStep, total: totalSteps }));
        
        let dbCat = currentCats.find(c => c.name.toLowerCase() === cat.name.toLowerCase());
        
        if (!dbCat) {
          // Explicitly NOT sending an icon field as it doesn't exist
          dbCat = await MenuService.upsertCategory({ name: cat.name, menu_id: menuId, order_index: currentStep });
          currentCats.push(dbCat!);
        }
        
        const itemsInCat = menuData.filter((m: any) => m.cat_name === cat.name || m.category_id === cat.id);
        for (const item of itemsInCat) {
          const itemExists = menuItems.some(i => i.name.toLowerCase() === item.name.toLowerCase() && i.category_id === dbCat!.id);
          if (itemExists) {
            currentStep++;
            continue;
          }

          setSyncProgress(p => ({ ...p, label: `Syncing Item: ${item.name}`, current: ++currentStep, total: totalSteps }));
          await MenuService.upsertMenuItem({
            name: item.name,
            price: Number(item.price),
            description: item.description,
            image_url: item.image_url,
            category_id: dbCat!.id,
            pax: item.pax || '1 Person',
            serving_time: item.serving_time || '15 mins'
          });
        }
      }
      await refreshCloudMenu();
      setPreviewData(null);
      setActiveTab('menu');
      alert("Deployment Success.");
    } catch (err: any) {
      alert("Deployment Error: " + (err.message || "Unknown error"));
    } finally {
      setIsSyncing(false);
    }
  };

  const renderImportPreview = () => {
    if (!previewData) return null;
    const items = previewData.menu?.items || previewData.menu?.menuItems || previewData.menu || [];
    return (
      <div className="p-6 lg:p-12 animate-fade-in space-y-10 font-['Plus_Jakarta_Sans'] pb-40">
        <header className="flex justify-between items-center">
            <h2 className="text-4xl font-black italic tracking-tighter uppercase text-slate-900">MANIFEST<span className="text-indigo-600">PREVIEW</span></h2>
            <div className="flex gap-3">
               <button onClick={() => setPreviewData(null)} className="bg-slate-100 text-slate-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase">Discard</button>
               <button onClick={commitImportToCloud} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase shadow-xl">Deploy to Cloud</button>
            </div>
        </header>
        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100"><tr className="text-[9px] font-black uppercase tracking-widest text-slate-400"><th className="p-5">Entity</th><th className="p-5 text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((it: any, i: number) => (
                  <tr key={i}><td className="p-5 font-black text-xs text-slate-800 uppercase italic">{it.name}</td><td className="p-5 text-right"><span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase">To be Synced</span></td></tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'menu': return <AdminMenu items={menuItems} setItems={setMenuItems} cats={categories} setCats={setCategories} />;
      case 'analytics': return <AdminAnalytics feedbacks={feedbacks} salesHistory={salesHistory} setSalesHistory={setSalesHistory} menuItems={menuItems} />;
      case 'branches': return <AdminBranches />;
      case 'qr': return <AdminQR />;
      case 'orders': return <AdminOrders salesHistory={salesHistory} setSalesHistory={setSalesHistory} />;
      case 'settings': return <AdminSettings onLogout={onLogout} adminCreds={adminCreds} setAdminCreds={setAdminCreds} />;
      case 'import-preview': return renderImportPreview();
    }
  };

  const navItem = (id: AdminTab, icon: string, label: string) => (
    <button 
      onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800'}`}
    >
      <i className={`fa-solid ${icon}`}></i> {label}
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-['Plus_Jakarta_Sans']">
      {isSidebarOpen && <div onClick={toggleSidebar} className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-[#0f172a] text-slate-400 h-full p-6 flex flex-col z-[60] transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex justify-between items-center px-2">
          <h1 className="text-xl font-black italic tracking-tighter text-white uppercase">SHARP<span className="text-indigo-500">ADMIN</span></h1>
        </div>
        <nav className="flex-1 space-y-2">
          {navItem('menu', 'fa-utensils', 'Menu Editor')}
          {navItem('orders', 'fa-receipt', 'Live Orders')}
          {navItem('analytics', 'fa-chart-pie', 'Analytics')}
          {navItem('branches', 'fa-sitemap', 'Branches')}
          {navItem('qr', 'fa-qrcode', 'QR Generator')}
          {navItem('settings', 'fa-gears', 'System Config')}
          <div className="pt-6 mt-4 border-t border-slate-800">
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleLoadConfig} />
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold text-indigo-400 hover:bg-indigo-500/10">
              <i className="fa-solid fa-file-import"></i> Load Config
            </button>
          </div>
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-800 px-2">
           <button onClick={refreshCloudMenu} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-black uppercase text-indigo-400 hover:bg-indigo-500/10 mb-4 transition-all">
             <i className={`fa-solid fa-rotate ${isSyncing ? 'animate-spin' : ''}`}></i> Cloud Sync
           </button>
           <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-black uppercase text-rose-400 hover:bg-rose-500/10">
            <i className="fa-solid fa-right-from-bracket"></i> Terminate
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={toggleSidebar} className="lg:hidden text-slate-600"><i className="fa-solid fa-bars-staggered"></i></button>
             <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Dashboard / <span className="text-slate-900 italic">{activeTab}</span></h2>
          </div>
          {isSyncing && <div className="text-[10px] font-black uppercase text-indigo-600 animate-pulse">{syncProgress.label}</div>}
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 relative no-scrollbar pb-20">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
