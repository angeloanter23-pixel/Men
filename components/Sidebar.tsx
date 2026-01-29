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
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all group text-left ${currentView === view ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-50/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      <i className={`fa-solid ${icon} text-base transition-colors ${currentView === view ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}></i> 
      <span className="uppercase tracking-widest text-[11px]">{label}</span>
    </button>
  );

  return (
    <>
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <aside className={`fixed top-0 left-0 h-full w-80 bg-[#0f172a] text-slate-400 z-[110] shadow-2xl transition-transform duration-500 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-12 px-2">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <i className="fa-solid fa-utensils text-sm"></i>
               </div>
               <h2 className="font-black text-2xl text-white tracking-tighter uppercase leading-none">FOODIE</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all active:scale-90">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>
          
          <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar pr-2">
            <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">Main Menu</p>
            {navItem('menu', 'fa-house', 'Home')}
            {navItem('group', 'fa-users', 'Group Order')}
            
            <div className="my-8 border-t border-slate-800 pt-8 space-y-2">
              <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">Support & Account</p>
              {navItem('orders', 'fa-receipt', 'My Orders')}
              {navItem('feedback-data', 'fa-star', 'Reviews')}
              {navItem('feedback', 'fa-comment-dots', 'Write Review')}
            </div>

            <div className="my-2 space-y-2">
              <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">Dining Tools</p>
              {navItem('landing', 'fa-rocket', 'Landing Page')}
              {navItem('super-admin', 'fa-shield-halved', 'System Status')}
            </div>
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-800 text-center px-2">
            <button 
              onClick={() => { onNavigate('admin'); onClose(); }} 
              className="group flex items-center justify-between p-6 bg-slate-800 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl active:scale-95 w-full border border-slate-700 hover:border-indigo-500"
            >
              <span>Merchant Log In</span>
              <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
            </button>
            <div className="mt-8 space-y-1">
              <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.4em] leading-none">Premium Digital Interface</p>
              <p className="text-[7px] text-slate-700 font-bold uppercase tracking-[0.2em] leading-none">V3.5.0 Clean Core</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;