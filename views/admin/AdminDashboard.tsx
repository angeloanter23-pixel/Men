
import React, { useState, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{current: number, total: number, label: string}>({ current: 0, total: 0, label: '' });
  const [previewData, setPreviewData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        alert("Manifest Error: The uploaded file is not a valid JSON configuration.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const commitImportToCloud = async () => {
    if (!previewData) return;
    
    const sessionRaw = localStorage.getItem('foodie_supabase_session');
    if (!sessionRaw) return alert("Session expired. Please re-authenticate.");
    
    const session = JSON.parse(sessionRaw);
    const restaurantId = session.restaurant?.id;
    const menuId = session.defaultMenuId;

    if (!restaurantId || !menuId) return alert("Enterprise Context missing. Please re-login to a valid merchant account.");

    setIsSyncing(true);
    
    try {
      const menuData = previewData.menu?.items || previewData.menu?.menuItems || previewData.menu || [];
      const categoryData = previewData.menu?.categories || previewData.categories || [];
      const qrData = previewData.business?.qrAssets || previewData.qrAssets || [];
      const bizName = previewData.business?.name || previewData.businessName || '';
      const bizLogo = previewData.business?.logo || previewData.businessLogo || null;

      const totalSteps = categoryData.length + menuData.length + qrData.length;
      let currentStep = 0;

      setSyncProgress({ current: 0, total: totalSteps, label: 'Initializing deployment...' });

      const newlyCreatedItems: MenuItem[] = [];
      const newlyCreatedCats: Category[] = [];

      for (const cat of categoryData) {
        setSyncProgress(p => ({ ...p, label: `Processing Category: ${cat.name}` }));
        
        let dbCat;
        const existingCat = categories.find(c => c.name.toLowerCase() === cat.name.toLowerCase());
        
        if (existingCat) {
          dbCat = existingCat;
        } else {
          dbCat = await MenuService.upsertCategory({
            name: cat.name,
            menu_id: menuId,
            order_index: categories.length + newlyCreatedCats.length
          });
          newlyCreatedCats.push(dbCat);
        }
        
        currentStep++;
        setSyncProgress(p => ({ ...p, current: currentStep }));

        const itemsInCat = menuData.filter((m: any) => 
          m.cat_name === cat.name || m.category_id === cat.id
        );
        
        for (const item of itemsInCat) {
          setSyncProgress(p => ({ ...p, label: `Validating Item: ${item.name}` }));
          
          const itemExists = menuItems.find(mi => mi.name.toLowerCase() === item.name.toLowerCase());
          
          if (itemExists) {
            alert(`Duplicate Found: "${item.name}" already exists in your library. Skipping entry.`);
            currentStep++;
            setSyncProgress(p => ({ ...p, current: currentStep }));
            continue;
          }

          const dbItem = await MenuService.upsertMenuItem({
            name: item.name,
            price: Number(item.price),
            description: item.description,
            image_url: item.image_url || 'https://picsum.photos/seed/placeholder/400/400',
            category_id: dbCat.id,
            pax: item.pax || '1 Person',
            serving_time: item.serving_time || '15 mins',
            is_popular: !!item.is_popular
          });
          
          newlyCreatedItems.push({ ...dbItem, cat_name: dbCat.name });
          currentStep++;
          setSyncProgress(p => ({ ...p, current: currentStep }));
        }
      }
      
      for (const qr of qrData) {
        setSyncProgress(p => ({ ...p, label: `Securing Node: ${qr.name || qr.label}` }));
        
        await MenuService.upsertQRCode({
          restaurant_id: restaurantId,
          code: qr.token || qr.code,
          label: qr.name || qr.label,
          type: 'menu'
        });
        
        currentStep++;
        setSyncProgress(p => ({ ...p, current: currentStep }));
      }

      if (newlyCreatedItems.length) {
        setMenuItems(prev => [...prev, ...newlyCreatedItems]);
      }
      if (newlyCreatedCats.length) {
        setCategories(prev => [...prev, ...newlyCreatedCats]);
      }

      if (bizLogo) {
        onLogoUpdate(bizLogo);
        localStorage.setItem('foodie_business_logo', bizLogo);
      }
      if (bizName) {
        localStorage.setItem('foodie_business_name', bizName);
      }

      alert("Deployment Success: Imported data merged with your existing library.");
      setPreviewData(null);
      setActiveTab('menu');
    } catch (err: any) {
      console.error("Import Failure:", err);
      alert("Deployment Aborted: " + (err.message || "An unexpected error occurred during database sync."));
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0, label: '' });
    }
  };

  const renderImportPreview = () => {
    if (!previewData) return null;
    const items = previewData.menu?.items || previewData.menu?.menuItems || previewData.menu || [];
    const cats = previewData.menu?.categories || previewData.categories || [];

    return (
      <div className="p-6 lg:p-12 animate-fade-in space-y-10 font-['Plus_Jakarta_Sans'] pb-40">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Staging Environment</span>
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-900">
              MANIFEST<span className="text-indigo-600">PREVIEW</span>
            </h2>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
             <button onClick={() => setPreviewData(null)} disabled={isSyncing} className="flex-1 sm:flex-none bg-slate-100 text-slate-500 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100">Discard</button>
             <button onClick={commitImportToCloud} disabled={isSyncing} className="flex-[2] sm:flex-none bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">Deploy</button>
          </div>
        </header>

        {isSyncing && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-xl shadow-indigo-500/5 animate-pulse">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 italic">{syncProgress.label}</span>
                    <span className="text-xs font-black text-slate-900">{Math.round((syncProgress.current / syncProgress.total) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}></div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 gap-10">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6 italic">Structural Hierarchy</h3>
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-10 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Context Name</th>
                            <th className="px-10 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                    {cats.map((c: any, i: number) => {
                        const exists = categories.find(mi => mi.name.toLowerCase() === c.name.toLowerCase());
                        return (
                            <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-10 py-5 text-sm font-black text-slate-800 uppercase italic tracking-tight">{c.name}</td>
                                <td className="px-10 py-5 text-right"><span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${exists ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{exists ? 'Existing Category' : 'New Context'}</span></td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
                </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6 italic">Entity Inventory</h3>
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                        <th className="px-10 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Entity Details</th>
                        <th className="px-10 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Class</th>
                        <th className="px-10 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                    {items.map((it: any, i: number) => {
                        const exists = menuItems.find(mi => mi.name.toLowerCase() === it.name.toLowerCase());
                        return (
                            <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 shadow-sm"><img src={it.image_url} className="w-full h-full object-cover" /></div>
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{it.name}</span>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-[10px] font-black uppercase text-indigo-400 italic tracking-widest">{it.cat_name || 'Generic'}</td>
                                <td className="px-10 py-6 text-right"><span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${exists ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>{exists ? 'Will be Skipped' : 'Valid Entry'}</span></td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
                </div>
            </div>
          </section>
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
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          {navItem('orders', 'fa-receipt', 'Live Orders')}
          {navItem('menu', 'fa-utensils', 'Menu Editor')}
          {navItem('analytics', 'fa-chart-pie', 'Analytics')}
          {navItem('branches', 'fa-sitemap', 'Branches')}
          {navItem('qr', 'fa-qrcode', 'QR Generator')}
          {navItem('settings', 'fa-gears', 'System Config')}
          
          <div className="pt-6 mt-4 border-t border-slate-800">
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleLoadConfig} />
            <button 
               onClick={() => fileInputRef.current?.click()} 
               className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold text-indigo-400 hover:bg-indigo-500/10 transition-all ${activeTab === 'import-preview' ? 'bg-indigo-500/20 border border-indigo-500/50 text-white' : ''}`}
            >
              <i className="fa-solid fa-file-import"></i> Load Manifest
            </button>
          </div>
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-800 px-2">
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500/10 transition-colors">
            <i className="fa-solid fa-right-from-bracket"></i> Terminate
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shrink-0">
          <div className="h-16 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button onClick={toggleSidebar} className="lg:hidden text-slate-600 text-xl active:scale-90 transition-transform"><i className="fa-solid fa-bars-staggered"></i></button>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Dashboard / <span className="text-slate-900 italic">{activeTab}</span></h2>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shadow-sm"><i className="fa-solid fa-user text-xs text-slate-400"></i></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 relative no-scrollbar pb-10">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
