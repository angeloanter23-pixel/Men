import React from 'react';
import { MenuItem } from '../types';

interface VariationDrawerProps {
  item: MenuItem | null;
  variants: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (variant: MenuItem) => void;
}

const VariationDrawer: React.FC<VariationDrawerProps> = ({ 
  item, 
  variants,
  isOpen, 
  onClose, 
  onSelect
}) => {
  if (!item) return null;

  return (
    <div className={`fixed inset-0 z-[1100] transition-all duration-500 font-jakarta ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop - Intense Blur for Focus */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl transition-opacity duration-500"
      />

      {/* Bottom Sheet - Apple Style Curve */}
      <aside 
        className={`absolute bottom-0 left-0 right-0 bg-[#F2F2F7] rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col p-6 pb-12
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {/* Grab Handle */}
        <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-8 shrink-0 opacity-50" />

        <header className="px-4 mb-8">
          <p className="text-[#FF6B00] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Item Customization</p>
          <h2 className="text-3xl font-black text-[#1D1D1F] tracking-tighter leading-none line-clamp-2">{item.name} <span className="text-slate-400">Variations.</span></h2>
        </header>

        <div className="space-y-3 max-w-xl mx-auto w-full overflow-y-auto no-scrollbar max-h-[50vh]">
          {variants.length > 0 ? variants.map((v) => (
            <button
              key={v.id}
              onClick={() => onSelect(v)}
              className="w-full bg-white p-4 rounded-[2.2rem] flex items-center gap-4 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group active:scale-95 text-left border border-slate-100/50"
            >
              {/* Asset Section */}
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#E8E8ED] shrink-0 shadow-inner group-hover:rotate-2 transition-transform duration-500">
                <img src={v.image_url} className="w-full h-full object-cover" alt="" />
                {v.is_popular && (
                    <div className="absolute top-0 left-0 right-0 bg-[#FF6B00] py-0.5 text-center">
                        <span className="text-[6px] font-black uppercase text-white tracking-widest">Popular</span>
                    </div>
                )}
              </div>
              
              {/* Identity Section */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-[#1D1D1F] tracking-tight line-clamp-2">{v.name}</h4>
                </div>
              </div>

              {/* Price & Selection Section */}
              <div className="text-right shrink-0">
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-0.5">Price</p>
                <span className="text-lg font-black text-[#1D1D1F] tracking-tighter leading-none">₱{v.price.toLocaleString()}</span>
              </div>

              {/* Action Circle */}
              <div className="w-8 h-8 rounded-full bg-[#FF6B00] text-white flex items-center justify-center shadow-sm shrink-0">
                <i className="fa-solid fa-plus text-[10px]"></i>
              </div>
            </button>
          )) : (
            <div className="py-12 text-center text-slate-300 font-bold italic uppercase tracking-widest">
                No variations configured.
            </div>
          )}
        </div>

        {/* Global Action Footer */}
        <div className="mt-10 px-4">
            <button 
                onClick={onClose}
                className="w-full py-5 text-[15px] font-semibold text-[#007AFF] hover:underline transition-colors active:opacity-50"
            >
                Cancel
            </button>
        </div>
      </aside>
    </div>
  );
};

export default VariationDrawer;