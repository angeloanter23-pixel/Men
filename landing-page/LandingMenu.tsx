
import React, { useEffect, useState } from 'react';

interface LandingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (view: 'pricing' | 'about' | 'contact' | 'terms') => void;
}

export const LandingMenu: React.FC<LandingMenuProps> = ({ isOpen, onClose, onSelect }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setShouldRender(true);
    else {
      const timer = setTimeout(() => setShouldRender(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const links = [
    { id: 'pricing', label: 'Pricing', icon: 'fa-tag' },
    { id: 'about', label: 'About Us', icon: 'fa-circle-info' },
    { id: 'contact', label: 'Contact', icon: 'fa-envelope' },
    { id: 'terms', label: 'Terms', icon: 'fa-file-contract' }
  ];

  return (
    <div className={`fixed inset-0 z-[2000] font-jakarta transition-all duration-500 ${isOpen ? 'visible' : 'invisible delay-500'}`}>
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className={`absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* Full Width Top Drawer */}
      <div className="absolute inset-x-0 top-0 pointer-events-none">
        <div 
          className={`w-full bg-white shadow-[0_30px_100px_rgba(15,23,42,0.15)] p-6 pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
        >
          <header className="flex justify-between items-center mb-4 px-2 max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                <span className="text-[10px] font-bold">M</span>
              </div>
              <span className="text-sm font-black tracking-tight text-slate-900 uppercase">Navigation</span>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all active:scale-90 border border-slate-100"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 max-w-5xl mx-auto w-full">
            {links.map((link) => (
              <button 
                key={link.id}
                onClick={() => { onSelect(link.id as any); onClose(); }} 
                className="group flex items-center justify-between p-5 rounded-none border-b border-slate-100 hover:bg-slate-50 transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 group-hover:bg-white transition-colors shadow-sm">
                    <i className={`fa-solid ${link.icon} text-xs`}></i>
                  </div>
                  <span className="text-[15px] font-bold text-slate-900 transition-colors uppercase tracking-wide">
                    {link.label}
                  </span>
                </div>
                <i className="fa-solid fa-arrow-right text-[10px] text-slate-200 group-hover:text-slate-900 transition-colors -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100"></i>
              </button>
            ))}
          </div>
          
          <div className="pt-4 border-t border-slate-50 max-w-5xl mx-auto w-full flex justify-between items-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em]">mymenu.asia v4.5</p>
          </div>
        </div>
      </div>
    </div>
  );
};
