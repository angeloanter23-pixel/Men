import React from 'react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onSupportClick: () => void;
  isSupportOpen: boolean;
  cartCount: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate, onSupportClick, isSupportOpen, cartCount }) => {
  const tabs = [
    { id: 'menu', icon: 'fa-house', label: 'Menu' },
    { id: 'group', icon: 'fa-users', label: 'Group' },
    { id: 'support', icon: 'fa-comment-dots', label: 'Message', action: onSupportClick },
    { id: 'orders', icon: 'fa-receipt', label: 'Orders' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-6 pb-6 pt-3 md:pb-5">
      <nav className="max-w-md mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = tab.id === 'support' ? isSupportOpen : (currentView === tab.id && !isSupportOpen);
          
          return (
            <button
              key={tab.id}
              onClick={() => tab.action ? tab.action() : onNavigate(tab.id as ViewState)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 ease-out group border-none outline-none ${
                isActive 
                ? 'bg-[#FF6B00] text-white scale-105 shadow-none' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <i className={`fa-solid ${tab.icon} text-base transition-transform duration-300 ${isActive ? 'scale-100 text-white' : 'group-hover:scale-110'}`}></i>
                {!isActive && tab.id === 'orders' && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full border border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
                )}
              </div>
              
              <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap overflow-hidden ${
                isActive ? 'max-w-[80px] opacity-100 ml-1 text-white' : 'max-w-0 opacity-0 pointer-events-none'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;