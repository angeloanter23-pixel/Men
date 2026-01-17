
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
    <a 
      href={`#/${view}`}
      onClick={(e) => { e.preventDefault(); onNavigate(view); onClose(); }} 
      className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition group text-left ${currentView === view ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'}`}
    >
      <i className={`fa-solid ${icon} ${currentView === view ? 'text-orange-500' : 'text-slate-400 group-hover:text-orange-500'}`}></i> 
      {label}
    </a>
  );

  return (
    <>
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white z-[110] shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h2 className="font-black text-2xl text-orange-600 tracking-tighter italic">FOODIE.</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-orange-500 transition">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>
          
          <nav className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
            <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Discovery</p>
            {navItem('landing', 'fa-sparkles', 'Product Tour')}
            {navItem('menu', 'fa-utensils', 'Main Menu')}
            {navItem('test-supabase', 'fa-cloud', 'Test Supabase Menu')}
            
            <div className="my-6 border-t border-slate-100 pt-6 space-y-1">
              <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">My Account</p>
              {navItem('orders', 'fa-clock-rotate-left', 'Order History')}
              {navItem('favorites', 'fa-heart', 'Saved Favorites')}
              {navItem('feedback', 'fa-comment-dots', 'Give Feedback')}
            </div>

            <div className="my-6 border-t border-slate-100 pt-6 space-y-1">
              <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Support</p>
              {navItem('privacy', 'fa-shield-halved', 'Privacy Policy')}
              {navItem('terms', 'fa-file-contract', 'Terms & Conditions')}
            </div>
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100 text-center space-y-3">
            <a href="#/admin" onClick={(e) => { e.preventDefault(); onNavigate('admin'); onClose(); }} className="p-5 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition flex items-center justify-center gap-2 w-full shadow-xl shadow-indigo-100">
              <i className="fa-solid fa-user-lock"></i> Merchant Access
            </a>
            <a href="#/super-admin" onClick={(e) => { e.preventDefault(); onNavigate('super-admin'); onClose(); }} className="p-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition flex items-center justify-center gap-2 w-full shadow-xl">
              <i className="fa-solid fa-shield-halved"></i> Super Admin
            </a>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-4">v2.5 Sharp Pro System</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
