
import React from 'react';
import { ViewState } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
  isDemo?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, currentView, isDemo }) => {
  const navItems: { id: ViewState; label: string; icon: string }[] = [
    { id: 'landing', label: isDemo ? 'Exit Demo' : 'Product Overview', icon: isDemo ? 'fa-door-open' : 'fa-circle-info' },
    { id: 'terms', label: 'Terms and Agreement', icon: 'fa-file-contract' },
    { id: 'privacy', label: 'Privacy Policy', icon: 'fa-shield-halved' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer Panel */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[2001] w-72 bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col font-jakarta ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <span className="text-[10px] font-bold">M</span>
            </div>
            <h2 className="text-lg font-black tracking-tighter uppercase text-slate-900">mymenu</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          <div>
            <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">System Navigation</p>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-[14px] font-bold transition-all group ${currentView === item.id ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <i className={`fa-solid ${item.icon} w-5 text-center ${currentView === item.id ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600'}`}></i>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-6 border-t border-slate-50">
          <button 
            onClick={() => { onNavigate('admin'); onClose(); }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-[14px] font-bold text-indigo-600 hover:bg-indigo-50 transition-all group"
          >
            <i className="fa-solid fa-user-tie w-5 text-center text-indigo-400"></i>
            <span>Merchant Login</span>
          </button>
          <p className="mt-6 text-center text-[9px] font-black text-slate-200 uppercase tracking-widest leading-none">v4.5.2 Platinum</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
