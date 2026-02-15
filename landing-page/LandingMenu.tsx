
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

      {/* Small Centered Top Modal */}
      <div className="absolute inset-x-0 top-0 flex justify-center p-4 pointer-events-none">
        <div 
          className={`w-full max-w-[420px] bg-white shadow-[0_30px_100px_rgba(15,23,42,0.15)] rounded-[3rem] p-8 pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-12 opacity-0 scale-95'}`}
        >
          <header className="flex justify-between items-center mb-8 px-2">
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

          <div className="grid grid-cols-1 gap-2 mb-8">
            {links.map((link) => (
              <button 
                key={link.id}
                onClick={() => { onSelect(link.id as any); onClose(); }} 
                className="group flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 hover:bg-slate-900 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-colors shadow-sm">
                    <i className={`fa-solid ${link.icon} text-xs`}></i>
                  </div>
                  <span className="text-[17px] font-bold text-slate-900 group-hover:text-white transition-colors">
                    {link.label}
                  </span>
                </div>
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-200 group-hover:text-white/40 transition-colors"></i>
              </button>
            ))}
          </div>
          
          <div className="pt-2 border-t border-slate-50">
            <button 
              className="group w-full flex items-center justify-between bg-orange-500 text-white p-6 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all hover:bg-orange-600"
              onClick={onClose}
            >
              <span>Get Started</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <i className="fa-solid fa-arrow-right text-[10px] transition-transform group-hover:translate-x-0.5"></i>
              </div>
            </button>
            
            <p className="text-center mt-6 text-[9px] font-black text-slate-200 uppercase tracking-[0.6em]">mymenu.asia v4.5</p>
          </div>
        </div>
      </div>
    </div>
  );
};
