import React from 'react';

interface LandingFooterProps {
  onStart: () => void;
  onCreateMenu: () => void;
  onInvestmentClick?: () => void;
  onCareerClick?: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onStart, onCreateMenu, onInvestmentClick, onCareerClick }) => (
  <footer className="bg-slate-50 pt-24 pb-12 border-t border-slate-200/50 px-6 font-jakarta">
    <div className="max-w-[1100px] mx-auto">
       <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pb-20 border-b border-slate-200">
          
          {/* Brand Identity */}
          <div className="col-span-2 md:col-span-1 space-y-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-lg shadow-slate-200">
                 <span className="text-[10px] font-bold">M</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">mymenu.asia</span>
            </div>
            <p className="text-[14px] text-slate-400 font-medium leading-relaxed pr-4">
              Building intelligent digital infrastructure for modern hospitality across Asia and beyond.
            </p>
            <div className="flex gap-5">
              <i className="fa-brands fa-x-twitter text-slate-300 hover:text-slate-900 transition-all cursor-pointer text-lg"></i>
              <i className="fa-brands fa-instagram text-slate-300 hover:text-slate-900 transition-all cursor-pointer text-lg"></i>
              <i className="fa-brands fa-linkedin text-slate-300 hover:text-slate-900 transition-all cursor-pointer text-lg"></i>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-5">
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.3em]">Platform</h4>
            <ul className="space-y-3.5 text-[14px] font-bold text-slate-400">
              <li><button onClick={onStart} className="hover:text-orange-500 transition-colors border-none bg-transparent">Sandbox</button></li>
              <li><button onClick={onCreateMenu} className="hover:text-orange-500 transition-colors border-none bg-transparent">Pricing</button></li>
              <li><button onClick={onInvestmentClick} className="hover:text-orange-500 transition-colors text-orange-600 font-bold border-none bg-transparent">Investment</button></li>
              <li><button className="hover:text-orange-500 transition-colors border-none bg-transparent">Enterprise</button></li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-5">
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.3em]">Resources</h4>
            <ul className="space-y-3.5 text-[14px] font-bold text-slate-400">
              <li><button onClick={onCareerClick} className="hover:text-orange-500 transition-colors border-none bg-transparent">Careers</button></li>
              <li><button className="hover:text-orange-500 transition-colors border-none bg-transparent">Guides</button></li>
              <li><button className="hover:text-orange-500 transition-colors border-none bg-transparent">Case Studies</button></li>
              <li><button className="hover:text-orange-500 transition-colors border-none bg-transparent">Help Center</button></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-5">
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.3em]">Corporate</h4>
            <ul className="space-y-3.5 text-[14px] font-bold text-slate-400">
              <li><button className="hover:text-orange-500 transition-colors border-none bg-transparent">Privacy</button></li>
              <li><button className="hover:text-orange-500 transition-colors border-none bg-transparent">Terms</button></li>
              <li><button className="hover:text-orange-500 transition-colors border-none bg-transparent">Node Registry</button></li>
              <li><button className="hover:text-orange-500 transition-colors border-none bg-transparent">Compliance</button></li>
            </ul>
          </div>

       </div>
       
       <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">© 2025 mymenu.asia • Platinum Digital Core</p>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Global Status: Operational</span>
          </div>
       </div>
    </div>
  </footer>
);