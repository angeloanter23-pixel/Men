import React from 'react';
import { MenuItem } from '../../types';

interface PopularProps {
  items: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  getPriceDisplay: (item: MenuItem) => string;
}

const Popular: React.FC<PopularProps> = ({ items, onItemSelect, getPriceDisplay }) => {
  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="px-6 mb-4 max-w-2xl mx-auto">
        <h3 className="text-[11px] font-black tracking-[0.3em] text-slate-400">Trending Picks</h3>
      </div>
      <div className="flex overflow-x-auto no-scrollbar gap-3 px-6 pb-2">
        <div className="flex gap-3">
          {items.map((item) => (
            <div key={item.id} className="shrink-0">
              <button 
                onClick={() => onItemSelect(item)}
                className="w-[160px] bg-white rounded-2xl p-2 text-left group active:scale-[0.98] transition-all border border-slate-100 shadow-sm flex flex-col"
              >
                <div className="aspect-square w-full rounded-xl overflow-hidden mb-2 relative bg-slate-50">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-2 right-2 bg-white/95 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-black text-slate-900 shadow-sm border border-slate-50">
                    {getPriceDisplay(item)}
                  </div>
                </div>
                <div className="px-1 pb-1 flex-1 flex flex-col">
                  {item.cat_name.toLowerCase() !== 'uncategorized' && (
                    <p className="text-[7px] font-black text-orange-600 tracking-widest mb-0.5">{item.cat_name}</p>
                  )}
                  <h4 className="text-[12px] font-bold text-slate-900 leading-tight mb-1 line-clamp-1 tracking-tight">{item.name}</h4>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Popular;
