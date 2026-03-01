
import React from 'react';

interface LandingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const LandingOverlay: React.FC<LandingOverlayProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center animate-fade-in font-jakarta">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
      
      <div className="relative bg-white w-full h-full md:h-[92vh] md:max-w-5xl md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Minimalist Close Button Only */}
        <div className="absolute top-6 right-6 z-50">
          <button 
            onClick={onClose} 
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-100/50 backdrop-blur text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center shadow-sm"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="pt-12">
            {children}
          </div>
          <div className="h-20" />
        </div>
      </div>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.7s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};
