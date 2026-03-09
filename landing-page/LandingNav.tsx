
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
    <nav className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-2 shadow-sm' : 'bg-transparent py-4'}`}>
      <div className="max-w-[1200px] mx-auto flex justify-between items-center px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-95 group-hover:rotate-3 shadow-md overflow-hidden bg-white">
               <img src="https://tjfqlutqsxhdraoraoyb.supabase.co/storage/v1/object/public/Menu-images/Platform/logo/logo.png" alt="MyMenu.asia Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-[18px] tracking-tight text-slate-900">mymenu.asia</span>
          </div>

          {/* New Menu Bar Items */}
          <div className="hidden lg:flex items-center gap-6">
            <button onClick={() => scrollTo('about')} className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">About Us</button>
            <button onClick={() => scrollTo('pricing')} className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">Pricing</button>
            <button onClick={() => scrollTo('contact')} className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">Contact</button>
            <button onClick={() => scrollTo('terms')} className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">Terms</button>
            <button onClick={() => scrollTo('privacy')} className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">Privacy</button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenMenu} 
            className="px-5 py-2 bg-slate-900 text-white rounded-full text-[11px] font-bold uppercase tracking-widest shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all hidden md:block"
          >
            Open App
          </button>
          <button 
            onClick={onOpenMenu} 
            className="w-9 h-9 flex items-center justify-center text-slate-900 bg-white md:bg-transparent hover:bg-slate-50 rounded-xl border border-slate-200 md:border-none shadow-sm md:shadow-none transition-all active:scale-90"
            aria-label="Toggle Menu"
          >
             <i className="fa-solid fa-bars-staggered text-lg"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};
