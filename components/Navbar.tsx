
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
    <nav className="sticky top-0 z-[60] bg-white/90 backdrop-blur-3xl px-6 py-4 flex justify-between items-center border-b border-gray-50 h-[72px]">
      <button onClick={onMenuClick} className="p-2 hover:bg-gray-100 rounded-xl transition active:scale-90">
        <i className="fa-solid fa-align-left text-xl text-slate-700"></i>
      </button>
      
      <div className="cursor-pointer flex items-center h-full" onClick={onLogoClick}>
        {logo ? (
          <img src={logo} alt="Logo" className="h-8 w-auto object-contain max-w-[140px]" />
        ) : (
          <h1 className="font-black text-2xl tracking-tighter text-[#1D1D1F] uppercase">mymenu<span className="text-[#FF6B00]">.asia</span></h1>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onCartClick} 
          className={`relative p-2 transition-all active:scale-90 ${currentView === 'cart' ? 'text-[#FF6B00]' : 'text-slate-700'}`}
        >
          <i className="fa-solid fa-cart-shopping text-xl"></i>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#FF6B00] text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white font-black animate-pulse">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
