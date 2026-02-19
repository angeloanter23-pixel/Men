import React from 'react';
import { MenuItem } from '../../types';

interface ItemListProps {
  items: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  getPriceDisplay: (item: MenuItem) => string;
  Reveal: React.FC<{ children: React.ReactNode; delay?: number; noWait?: boolean }>;
  layout?: 'default' | 'compact' | 'minimal';
}

const ItemList: React.FC<ItemListProps> = ({ items, onItemSelect, getPriceDisplay, Reveal, layout = 'default' }) => {
  return (
    <div className="max-w-2xl mx-auto px-6">
      <div className={
        layout === 'default' ? "flex flex-col gap-8" : 
        layout === 'compact' ? "grid grid-cols-2 gap-4" : 
        "flex flex-col gap-3"
      }>
        {items.map((item, idx) => (
          <Reveal key={item.id} noWait={idx < 4}>
            <button 
              onClick={() => onItemSelect(item)}
              className={`w-full bg-white border border-slate-100 flex text-left group active:scale-[0.98] transition-all hover:shadow-lg shadow-sm ${
                layout === 'default' ? 'flex-col p-4 rounded-[2.5rem]' : 
                layout === 'compact' ? 'flex-col p-3 rounded-2xl' : 
                'flex-row p-3 rounded-xl gap-4'
              }`}
            >
              <div className={`
                ${layout === 'default' ? 'aspect-[4/3] w-full rounded-[2rem] mb-5' : 
                  layout === 'compact' ? 'aspect-square w-full rounded-xl mb-3' : 
                  'w-20 h-20 rounded-lg shrink-0'} 
                overflow-hidden bg-slate-50 relative
              `}>
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                {layout !== 'minimal' && (
                  <div className={`absolute top-3 right-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg font-black text-slate-900 border border-slate-50 ${layout === 'default' ? 'text-[12px]' : 'text-[9px]'}`}>
                      {getPriceDisplay(item)}
                  </div>
                )}
              </div>
              <div className={`
                ${layout === 'minimal' ? 'flex-1 flex flex-col justify-center py-0.5' : 'px-1 pb-1'}
              `}>
                <div className="flex justify-between items-start mb-1">
                  {item.cat_name.toLowerCase() !== 'uncategorized' && (
                    <p className={`font-black tracking-widest text-orange-600 ${
                      layout === 'default' ? 'text-[9px] mb-1.5' : 
                      layout === 'compact' ? 'text-[7px] mb-1' : 
                      'text-[7px]'
                    }`}>{item.cat_name}</p>
                  )}
                  {layout === 'minimal' && <span className="text-[10px] font-black text-slate-900">{getPriceDisplay(item)}</span>}
                </div>
                <h4 className={`font-bold text-slate-900 leading-tight tracking-tight ${
                  layout === 'default' ? 'text-[19px] mb-2' : 
                  layout === 'compact' ? 'text-[13px] mb-1 line-clamp-1' : 
                  'text-[14px] mb-1'
                }`}>{item.name}</h4>
                
                {layout !== 'compact' && (
                  <p className={`text-slate-400 font-medium line-clamp-2 leading-relaxed ${
                    layout === 'default' ? 'text-[12px] mb-4' : 'text-[10px] mb-2'
                  }`}>{item.description}</p>
                )}
                
                {layout === 'default' && item.ingredients && (item.ingredients as any).length > 0 && (
                  <div className="flex overflow-x-auto no-scrollbar gap-1.5 mb-5 pb-1">
                    {(item.ingredients as any).map((ing: any, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-100">
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
