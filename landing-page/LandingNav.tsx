
import React from 'react';

interface LandingNavProps {
  isScrolled: boolean;
  onOpenMenu: () => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({ isScrolled, onOpenMenu }) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-100 py-3 shadow-sm' : 'bg-transparent py-6'}`}>
      <div className="max-w-[1200px] mx-auto flex justify-between items-center px-6">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white transition-all group-hover:scale-95 group-hover:rotate-3 shadow-lg">
               <span className="text-[11px] font-bold">M</span>
            </div>
            <span className="font-bold text-[20px] tracking-tight text-slate-900">mymenu.asia</span>
          </div>

          {/* New Menu Bar Items */}
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => scrollTo('about')} className="text-[13px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">About Us</button>
            <button onClick={() => scrollTo('pricing')} className="text-[13px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Pricing</button>
            <button onClick={() => scrollTo('contact')} className="text-[13px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Contact</button>
            <button onClick={() => scrollTo('terms')} className="text-[13px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Terms</button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenMenu} 
            className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-[12px] font-bold uppercase tracking-widest shadow-xl active:scale-90 transition-all hidden md:block"
          >
            Open App
          </button>
          <button 
            onClick={onOpenMenu} 
            className="w-11 h-11 flex items-center justify-center text-slate-900 bg-white md:bg-transparent hover:bg-slate-50 rounded-2xl border border-slate-100 md:border-none shadow-sm md:shadow-none transition-all active:scale-90"
            aria-label="Toggle Menu"
          >
             <i className="fa-solid fa-bars-staggered text-xl"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};
