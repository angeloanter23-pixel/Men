
import React, { useState } from 'react';
import AdminMenu from './AdminMenu';
import AdminAnalytics from './AdminAnalytics';
import AdminQR from './AdminQR';
import AdminSettings from './AdminSettings';
import { MenuItem, Category, Feedback, SalesRecord } from '../../types';

type AdminTab = 'menu' | 'analytics' | 'qr' | 'settings';

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
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, menuItems, setMenuItems, categories, setCategories, feedbacks, setFeedbacks, salesHistory, setSalesHistory, adminCreds, setAdminCreds }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderContent = () => {
    switch (activeTab) {
      case 'menu': return (
        <AdminMenu 
          items={menuItems} 
          setItems={setMenuItems} 
          cats={categories} 
          setCats={setCategories} 
        />
      );
      case 'analytics': return <AdminAnalytics feedbacks={feedbacks} salesHistory={salesHistory} setSalesHistory={setSalesHistory} menuItems={menuItems} />;
      case 'qr': return <AdminQR />;
      case 'settings': return <AdminSettings onLogout={onLogout} adminCreds={adminCreds} setAdminCreds={setAdminCreds} />;
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
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          onClick={toggleSidebar}
          className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        />
      )}

      {/* Dark Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-[#0f172a] text-slate-400 h-full p-6 flex flex-col z-[60] transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex justify-between items-center">
          <h1 className="text-xl font-black italic tracking-tighter text-white uppercase">SHARP<span className="text-indigo-500">QR</span></h1>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItem('menu', 'fa-utensils', 'Menu Editor')}
          {navItem('analytics', 'fa-chart-pie', 'Analytics')}
          {navItem('qr', 'fa-qrcode', 'QR Generator')}
          {navItem('settings', 'fa-gears', 'System Config')}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors">
            <i className="fa-solid fa-right-from-bracket"></i> Logout Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
        {/* Breadcrumb Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shrink-0">
          <div className="h-16 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button onClick={toggleSidebar} className="lg:hidden text-slate-600 text-xl active:scale-90 transition-transform">
                <i className="fa-solid fa-bars-staggered"></i>
              </button>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Admin Dashboard / <span className="text-slate-900">{activeTab}</span></h2>
            </div>
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-slate-900 uppercase">Administrator</p>
                  <p className="text-[9px] font-bold text-indigo-500">Level 4 Access</p>
               </div>
               <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                <i className="fa-solid fa-user text-xs text-slate-400"></i>
               </div>
            </div>
          </div>
        </header>

        {/* View Main Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative no-scrollbar pb-10">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
