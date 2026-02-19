
import React from 'react';
import { ViewState } from '../types';

interface NavbarProps {
  logo: string | null;
  onMenuClick: () => void;
  onCartClick: () => void;
  onLogoClick: () => void;
  onImport: (config: any) => void;
  currentView: ViewState;
  cartCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ 
  logo,
  onMenuClick, 
  onCartClick, 
  onLogoClick, 
  currentView, 
  cartCount 
}) => {
  return (
    <nav className="sticky top-0 z-[60] bg-white/70 backdrop-blur-xl px-6 flex justify-between items-center h-[52px] border-b border-slate-100/50">
      <div className="flex-1 flex justify-start">
        <button onClick={onMenuClick} className="p-2 -ml-2 hover:bg-slate-100/50 rounded-full transition-all active:scale-90">
          <i className="fa-solid fa-bars-staggered text-lg text-slate-800"></i>
        </button>
      </div>
      
      <div className="flex-1 flex justify-center">
        <div className="cursor-pointer flex items-center" onClick={onLogoClick}>
          {logo ? (
            <img src={logo} alt="Logo" className="h-6 w-auto object-contain" />
          ) : (
            <span className="font-black text-lg tracking-tighter text-slate-900">mymenu<span className="text-[#FF6B00]">.asia</span></span>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex justify-end">
        <button 
          onClick={onCartClick} 
          className={`relative p-2 -mr-2 transition-all active:scale-90 ${currentView === 'cart' ? 'text-[#FF6B00]' : 'text-slate-800'}`}
        >
          <i className="fa-solid fa-bag-shopping text-lg"></i>
          {cartCount > 0 && (
            <span className="absolute top-1 right-1 bg-[#FF6B00] text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
