import React from 'react';
import { MenuItem } from '../../types';

interface PopularProps {
  items: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  getPriceDisplay: (item: MenuItem) => string;
}

const Popular: React.FC<PopularProps> = ({ items, onItemSelect, getPriceDisplay }) => {
  if (items.length === 0) return null;

  // Limit to 8 items for horizontal scroll
  const displayItems = items.slice(0, 8);

  return (
    <section className="mb-6">
      <div className="px-6 mb-3 flex justify-between items-center">
        <h3 className="text-[20px] font-black text-slate-900 tracking-tighter">Popular Picks</h3>
        <button className="text-slate-900 text-[16px] active:scale-90 transition-transform"><i className="fa-solid fa-arrow-right"></i></button>
      </div>
      <div className="pl-6 pr-6 overflow-x-auto no-scrollbar pb-4 -mb-4">
        <div className="flex gap-4 w-max">
          {displayItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => onItemSelect(item)}
              className="w-40 bg-[#F2F2F7] rounded-2xl p-2 text-left group active:scale-[0.98] transition-all border border-white/50 shadow-[5px_5px_10px_#d1d1d6,-5px_-5px_10px_#ffffff] hover:shadow-[7px_7px_14px_#d1d1d6,-7px_-7px_14px_#ffffff] flex flex-col relative overflow-hidden shrink-0 h-full"
            >
              <div className="aspect-square w-full rounded-xl overflow-hidden mb-2 relative bg-slate-100 shadow-inner shrink-0">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-lg text-[9px] font-black text-slate-900 shadow-sm border border-white/50">
                  {getPriceDisplay(item)}
                </div>
              </div>
              <div className="px-1 pb-1 flex-1 flex flex-col">
                {item.cat_name.toLowerCase() !== 'uncategorized' && (
                  <p className="text-[7px] font-black text-orange-600 uppercase tracking-widest mb-0.5 truncate">{item.cat_name}</p>
                )}
                <h4 className="text-[13px] font-bold text-slate-900 leading-tight mb-1 line-clamp-2 tracking-tight min-h-[2.4em]">{item.name}</h4>
                
                <div className="mt-auto flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <i className="fa-solid fa-clock text-[7px] text-orange-500"></i>
                    <span className="text-[7px] font-black uppercase tracking-widest text-orange-500 truncate">{item.serving_time}</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-[#F2F2F7] text-slate-900 flex items-center justify-center shadow-[3px_3px_6px_#d1d1d6,-3px_-3px_6px_#ffffff] group-hover:shadow-inner transition-all active:scale-90">
                <i className="fa-solid fa-plus text-[10px]"></i>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Popular;
