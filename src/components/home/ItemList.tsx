import React from 'react';
import { MenuItem } from '../../../types';

interface ItemListProps {
  items: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  getPriceDisplay: (item: MenuItem) => string;
  Reveal: React.FC<{ children: React.ReactNode; delay?: number; noWait?: boolean }>;
}

const ItemList: React.FC<ItemListProps> = ({ items, onItemSelect, getPriceDisplay, Reveal }) => {
  return (
    <div className="max-w-2xl mx-auto px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <Reveal key={item.id} noWait={idx < 4}>
            <button 
              onClick={() => onItemSelect(item)}
              className="w-full bg-white p-3 rounded-[2rem] border border-slate-100 flex flex-col text-left group active:scale-[0.98] transition-all hover:shadow-lg shadow-sm"
            >
              <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden mb-4 bg-slate-50 relative">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl text-[12px] font-black text-slate-900 border border-slate-50">
                    {getPriceDisplay(item)}
                </div>
              </div>
              <div className="px-2 pb-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-orange-600 mb-1">{item.cat_name}</p>
                <h4 className="text-[17px] font-bold text-slate-900 leading-tight mb-1.5 uppercase tracking-tight">{item.name}</h4>
                <p className="text-[11px] text-slate-400 font-medium line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
                
                {item.ingredients && (item.ingredients as any).length > 0 && (
                  <div className="flex overflow-x-auto no-scrollbar gap-1.5 mb-3 pb-1">
                    {(item.ingredients as any).map((ing: any, i: number) => (
                      <span key={i} className="px-2 py-1 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-100">
                        {typeof ing === 'string' ? ing : (ing.label || ing.name)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-clock text-[9px]"></i>
                      <span className="text-[9px] font-black uppercase tracking-widest">{item.serving_time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-user-group text-[9px]"></i>
                      <span className="text-[9px] font-black uppercase tracking-widest">{item.pax}</span>
                    </div>
                </div>
              </div>
            </button>
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default ItemList;
