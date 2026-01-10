
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
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, menuItems, setMenuItems, categories, setCategories, feedbacks, setFeedbacks, salesHistory }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('menu');

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
      case 'analytics': return <AdminAnalytics feedbacks={feedbacks} salesHistory={salesHistory} menuItems={menuItems} />;
      case 'qr': return <AdminQR />;
      case 'settings': return <AdminSettings onLogout={onLogout} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 animate-fade-in">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 px-6">
        <div className="max-w-md mx-auto flex justify-between items-center h-16">
          <h1 className="font-black text-lg italic tracking-tight uppercase">SHARP<span className="text-indigo-600">ADMIN</span></h1>
          <button onClick={onLogout} className="text-[10px] font-black uppercase text-slate-400">Exit</button>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        {renderContent()}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around py-4 z-50 max-w-xl mx-auto shadow-xl">
        {[
          { id: 'menu', icon: 'fa-utensils', label: 'Menu' },
          { id: 'analytics', icon: 'fa-chart-line', label: 'Stats' },
          { id: 'qr', icon: 'fa-qrcode', label: 'QR' },
          { id: 'settings', icon: 'fa-gears', label: 'Settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`flex flex-col items-center gap-1 transition ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-300'}`}
          >
            <i className={`fa-solid ${tab.icon} text-lg`}></i>
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
