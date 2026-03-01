
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
    { id: 'about', icon: 'fa-circle-info', label: 'About' },
    { id: 'support', icon: 'fa-comment-dots', label: 'Message', action: onSupportClick },
    { id: 'orders', icon: 'fa-receipt', label: 'Orders' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-t border-white/20 px-4 pb-4 pt-2">
      <nav className="max-w-md mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = tab.id === 'support' ? isSupportOpen : (currentView === tab.id && !isSupportOpen);
          
          return (
            <button
              key={tab.id}
              onClick={() => tab.action ? tab.action() : onNavigate(tab.id as ViewState)}
              className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 ease-out group border-none outline-none flex-1 ${
                isActive 
                ? 'text-[#FF6B00]' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <i className={`fa-solid ${tab.icon} text-lg transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}></i>
                {!isActive && tab.id === 'orders' && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full border border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
                )}
              </div>
              
              <span className={`text-[10px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
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
