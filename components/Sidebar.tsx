import React from 'react';
import { ViewState } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, currentView }) => {
  const navItem = (view: ViewState, icon: string, label: string) => (
    <button 
      onClick={() => { onNavigate(view); onClose(); }} 
      className={`w-full flex items-center gap-5 p-5 rounded-2xl font-black transition group text-left ${currentView === view ? 'bg-orange-50 text-brand-primary shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
    >
      <i className={`fa-solid ${icon} text-lg ${currentView === view ? 'text-brand-primary' : 'text-slate-400 group-hover:text-brand-primary'}`}></i> 
      <span className="text-[13px] uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <>
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <aside className={`fixed top-0 left-0 h-full w-80 bg-white z-[110] shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 h-full flex flex-col">
          <div className="flex justify-between items-center mb-12">
            <h2 className="font-black text-3xl text-brand-primary tracking-tighter uppercase">FOODIE</h2>
            <button onClick={onClose} className="p-3 text-slate-300 hover:text-brand-primary transition-all active:scale-90">
              <i className="fa-solid fa-xmark text-2xl"></i>
            </button>
          </div>
          
          <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
            <p className="px-5 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">Discovery</p>
            {navItem('menu', 'fa-utensils', 'Menu')}
            {navItem('group', 'fa-users', 'Group Order')}
            {navItem('create-menu', 'fa-map', 'Product Tour')}
            
            <div className="my-8 border-t border-slate-100 pt-8 space-y-2">
              <p className="px-5 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">Account</p>
              {navItem('orders', 'fa-clock-rotate-left', 'History')}
              {navItem('favorites', 'fa-heart', 'Saved')}
              {navItem('feedback', 'fa-comment-dots', 'Feedback')}
            </div>
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-100 text-center">
            <button 
              onClick={() => { onNavigate('admin'); onClose(); }} 
              className="p-6 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95 w-full"
            >
              Merchant Access
            </button>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.4em] mt-8 leading-none">Version 3.3 Premium Clean</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;