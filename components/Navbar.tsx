
import React from 'react';
// Fix: Import ViewState from types.ts as App.tsx is empty and not a module
import { ViewState } from '../types';

interface NavbarProps {
  onMenuClick: () => void;
  onCartClick: () => void;
  onLogoClick: () => void;
  currentView: ViewState;
  cartCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, onCartClick, onLogoClick, currentView, cartCount }) => {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-gray-50">
      <button onClick={onMenuClick} className="p-2 hover:bg-gray-100 rounded-xl transition">
        <i className="fa-solid fa-align-left text-xl text-slate-700"></i>
      </button>
      <h1 className="font-black text-2xl tracking-tighter text-orange-600 cursor-pointer" onClick={onLogoClick}>FOODIE.</h1>
      <button onClick={onCartClick} className={`relative p-2 transition-all ${currentView === 'cart' ? 'text-orange-500' : 'text-slate-700'}`}>
        <i className="fa-solid fa-cart-shopping text-xl"></i>
        {cartCount > 0 && (
          <span className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white font-bold animate-bounce">
            {cartCount}
          </span>
        )}
      </button>
    </nav>
  );
};

export default Navbar;