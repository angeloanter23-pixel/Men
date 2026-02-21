import React from 'react';
import { MenuItem } from '../../types';

interface PopularProps {
  items: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  getPriceDisplay: (item: MenuItem) => string;
}

const Popular: React.FC<PopularProps> = ({ items, onItemSelect, getPriceDisplay }) => {
  if (items.length === 0) return null;

  // Limit to 4 items for 2x2 grid
  const displayItems = items.slice(0, 4);

  return (
    <section className="mb-10">
      <div className="px-6 mb-5 max-w-2xl mx-auto flex justify-between items-end">
        <h3 className="text-[20px] font-black text-slate-900 uppercase tracking-tighter">Popular Picks</h3>
        <button className="text-[#FF6B00] text-[11px] font-black uppercase tracking-widest">See All</button>
      </div>
      <div className="px-6 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {displayItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => onItemSelect(item)}
              className="w-full bg-white rounded-2xl p-2 text-left group active:scale-[0.98] transition-all border border-slate-100 shadow-lg flex flex-col relative overflow-hidden"
            >
              <div className="aspect-square w-full rounded-xl overflow-hidden mb-2 relative bg-slate-50 shrink-0">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-2 right-2 bg-white/95 backdrop-blur px-2 py-0.5 rounded-lg text-[9px] font-black text-slate-900 shadow-sm border border-slate-50">
                  {getPriceDisplay(item)}
                </div>
              </div>
              <div className="px-1 pb-1 flex-1 flex flex-col">
                {item.cat_name.toLowerCase() !== 'uncategorized' && (
                  <p className="text-[7px] font-black text-orange-600 uppercase tracking-widest mb-0.5">{item.cat_name}</p>
                )}
                <h4 className="text-[13px] font-bold text-slate-900 leading-tight mb-1 line-clamp-2 tracking-tight">{item.name}</h4>
                
                <div className="mt-auto flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <i className="fa-solid fa-clock text-[7px] text-orange-500"></i>
                    <span className="text-[7px] font-black uppercase tracking-widest text-orange-500">{item.serving_time}</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-2 right-2 text-slate-900 active:scale-90 transition-all">
                <i className="fa-solid fa-plus text-[14px]"></i>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Popular;
