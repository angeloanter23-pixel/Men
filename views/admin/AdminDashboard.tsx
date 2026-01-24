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

interface ImportLog {
  msg: string;
  status: 'info' | 'success' | 'update' | 'exists';
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onLogout, menuItems, setMenuItems, categories, setCategories, feedbacks, setFeedbacks, salesHistory, setSalesHistory, adminCreds, setAdminCreds, onLogoUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('menu');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<any[]>([]);
  
  // Import States
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

  useEffect(() => {
    if (restaurantId && restaurantId !== "undefined") {
      refreshAllData();
      const interval = setInterval(syncSalesOnly, 30000);
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
        alert("Invalid JSON file.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const addLog = (msg: string, status: ImportLog['status'] = 'info') => {
    setImportLogs(prev => [...prev, { msg, status }]);
  };

  const commitImport = async () => {
    if (!previewData || !restaurantId) return;
    setIsImporting(true);
    setImportProgress(5);
    setImportLogs([{ msg: 'Analyzing local configuration...', status: 'info' }]);
    
    try {
      // Step 1: Pre-fetch current state to build local lookup maps for duplicate prevention
      addLog('Fetching existing cloud entities...', 'info');
      const [existingBranches, existingQRs, cloudMenu] = await Promise.all([
        MenuService.getBranchesForRestaurant(restaurantId),
        MenuService.getQRCodes(restaurantId),
        MenuService.getMenuByRestaurantId(restaurantId)
      ]);
      
      const branchMap = new Map(existingBranches.map((b: any) => [b.subdomain.toLowerCase(), b.id]));
      const qrByLabelMap = new Map(existingQRs.map((q: any) => [q.label.toLowerCase(), q.id]));
      const catMap = new Map(cloudMenu.categories.map((c: any) => [c.name.toLowerCase(), c.id]));
      const itemMap = new Map(cloudMenu.items.map((i: any) => [i.name.toLowerCase(), i.id]));
      
      setImportProgress(20);

      // 2. Process Branches
      if (previewData.business?.branches) {
        addLog('Processing Branches...', 'info');
        for (const branch of previewData.business.branches) {
          const sub = (branch.subdomain || branch.name.toLowerCase().replace(/\s+/g, '-')).toLowerCase();
          if (branchMap.has(sub)) {
            addLog(`Branch "${branch.name}" exists. Skipped.`, 'exists');
          } else {
            addLog(`Deploying branch: ${branch.name}`, 'success');
            await MenuService.insertBranch(branch.name, sub, restaurantId);
          }
        }
      }
      setImportProgress(40);

      // 3. Process QR Codes
      if (previewData.business?.qrAssets) {
        addLog('Syncing QR Infrastructure...', 'info');
        for (const qr of previewData.business.qrAssets) {
          const existingId = qrByLabelMap.get(qr.name.toLowerCase());
          if (existingId) {
            addLog(`Table "${qr.name}" exists. Merging tokens.`, 'exists');
          } else {
            addLog(`Creating table: ${qr.name}`, 'success');
          }
          await MenuService.upsertQRCode({
            id: existingId || undefined,
            restaurant_id: restaurantId,
            label: qr.name,
            code: qr.token,
            type: 'menu'
          });
        }
      }
      setImportProgress(60);

      // 4. Process Categories
      if (previewData.menu?.categories) {
        addLog('Organizing Menu Groups...', 'info');
        for (const cat of previewData.menu.categories) {
          const existingId = catMap.get(cat.name.toLowerCase());
          if (existingId) {
            addLog(`Group "${cat.name}" exists. Skipping duplication.`, 'exists');
          } else {
            addLog(`Adding new group: ${cat.name}`, 'success');
            await MenuService.upsertCategory({
              id: existingId || undefined,
              name: cat.name,
              menu_id: session.defaultMenuId,
              order_index: cat.order_index || 0
            });
          }
        }
      }
      setImportProgress(80);

      const updatedMenu = await MenuService.getMenuByRestaurantId(restaurantId);
      const updatedCatMap = new Map(updatedMenu.categories.map((c: any) => [c.name.toLowerCase(), c.id]));

      // 5. Process Items
      if (previewData.menu?.items) {
        addLog('Archiving Menu Items...', 'info');
        for (const item of previewData.menu.items) {
          const existingId = itemMap.get(item.name.toLowerCase());
          const catId = updatedCatMap.get(item.cat_name?.toLowerCase()) || null;
          
          if (existingId) {
            addLog(`Dish "${item.name}" exists. Applying update.`, 'update');
          } else {
            addLog(`Storing new dish: ${item.name}`, 'success');
          }
          
          await MenuService.upsertMenuItem({
            id: existingId || undefined,
            name: item.name,
            price: item.price,
            description: item.description,
            image_url: item.image_url,
            category_id: catId,
            pax: item.pax,
            serving_time: item.serving_time,
            is_popular: item.is_popular
          });
        }
      }
      
      setImportProgress(100);
      addLog('Deployment Successful!', 'success');
      
      setTimeout(async () => {
        await refreshAllData();
        setIsImporting(false);
        setActiveTab('menu');
        setPreviewData(null);
      }, 1500);

    } catch (err: any) {
      addLog(`Sync Error: ${err.message}`, 'info');
      console.error(err);
      setIsImporting(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'menu': return <AdminMenu items={menuItems} setItems={setMenuItems} cats={categories} setCats={setCategories} availableBranches={availableBranches} />;
      case 'analytics': return <AdminAnalytics feedbacks={feedbacks} salesHistory={salesHistory} setSalesHistory={setSalesHistory} menuItems={menuItems} />;
      case 'branches': return <AdminBranches />;
      case 'qr': return <AdminQR availableBranches={availableBranches} />;
      case 'orders': return <AdminOrders />;
      case 'settings': return <AdminSettings onLogout={onLogout} adminCreds={adminCreds} setAdminCreds={setAdminCreds} onImportClick={() => fileInputRef.current?.click()} />;
      case 'import-preview': return (
        <div className="p-10 max-w-2xl mx-auto space-y-8 animate-fade-in">
           <header className="text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm"><i className="fa-solid fa-file-import"></i></div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Review Import</h3>
              <p className="text-slate-500 text-sm">Review entities before cloud synchronization.</p>
           </header>
           
           <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl space-y-10 max-h-[500px] overflow-y-auto no-scrollbar">
              {previewData?.menu?.items?.length > 0 && (
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest px-4 italic">Proposed Menu Entities</h4>
                   <div className="grid grid-cols-1 gap-2">
                     {previewData.menu.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                           <span className="font-bold text-slate-700 text-xs">{it.name}</span>
                           <span className="font-black text-indigo-600 text-xs">₱{it.price}</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}
           </div>

           <div className="flex gap-4">
              <button onClick={() => { setActiveTab('settings'); setPreviewData(null); }} className="flex-1 py-5 bg-slate-100 rounded-3xl font-black uppercase text-[10px] tracking-widest text-slate-400">Cancel</button>
              <button onClick={commitImport} className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all">Synchronize Now</button>
           </div>
        </div>
      );
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
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleLoadConfig} />
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-[90] backdrop-blur-sm" />}
      
      {/* Enhanced Import Progress Dialog */}
      {isImporting && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-8 shadow-inner animate-pulse">
              <i className="fa-solid fa-cloud-arrow-up text-3xl"></i>
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2 text-slate-900">Synchronizing</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 text-center">Restoring cloud infrastructure...</p>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-10 border border-slate-50 shadow-inner relative">
              <div className="h-full bg-indigo-600 transition-all duration-700 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]" style={{ width: `${importProgress}%` }}></div>
            </div>
          </div>
        </div>
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-[#0f172a] text-slate-400 h-full p-6 flex flex-col z-[100] transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Sticky Dashboard Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-600"><i className="fa-solid fa-bars-staggered"></i></button>
             <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Panel / <span className="text-slate-900 italic">{activeTab}</span></h2>
          </div>
          {isSyncing && <div className="text-[10px] font-black text-indigo-600 animate-pulse uppercase tracking-widest">Active Sync</div>}
        </header>
        
        <main className="flex-1 overflow-y-auto bg-slate-50 relative no-scrollbar pb-20">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
