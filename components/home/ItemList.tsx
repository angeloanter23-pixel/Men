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
        layout === 'default' ? "flex flex-col gap-6" : 
        layout === 'compact' ? "grid grid-cols-2 gap-3" : 
        "flex flex-col"
      }>
        {items.map((item, idx) => (
          <Reveal key={item.id} noWait={idx < 4}>
            <button 
              onClick={() => onItemSelect(item)}
              className={`w-full flex text-left group active:scale-[0.98] transition-all relative overflow-hidden ${
                layout === 'default' ? 'flex-col p-0 rounded-3xl bg-white border border-slate-100 hover:shadow-2xl shadow-lg mb-6' : 
                layout === 'compact' ? 'flex-col p-2 rounded-xl bg-white border border-slate-100 hover:shadow-2xl shadow-lg' : 
                'flex-row py-5 border-b border-slate-100/80 gap-5 items-center bg-transparent'
              }`}
            >
              <div className={`
                ${layout === 'default' ? 'aspect-[16/9] w-full' : 
                  layout === 'compact' ? 'aspect-square w-full rounded-lg mb-2' : 
                  'w-24 h-24 aspect-square rounded-2xl shrink-0'} 
                overflow-hidden bg-slate-50 relative shadow-inner
              `}>
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                {layout !== 'minimal' && (
                  <div className={`absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1 rounded-xl font-black text-slate-900 border border-slate-50 shadow-md ${layout === 'default' ? 'text-[13px]' : 'text-[9px]'}`}>
                      {getPriceDisplay(item)}
                  </div>
                )}
              </div>
              
              <div className={`
                ${layout === 'minimal' ? 'flex-1 flex flex-col py-1' : 
                  layout === 'default' ? 'p-6' : 'px-1 pb-1'}
              `}>
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1 min-w-0">
                    {item.cat_name.toLowerCase() !== 'uncategorized' && (
                      <p className={`font-black tracking-widest text-orange-600 uppercase ${
                        layout === 'default' ? 'text-[10px] mb-2' : 
                        layout === 'compact' ? 'text-[7px] mb-1' : 
                        'text-[8px] mb-0.5'
                      }`}>{item.cat_name}</p>
                    )}
                    <h4 className={`font-bold text-slate-900 leading-tight tracking-tight line-clamp-2 ${
                      layout === 'default' ? 'text-[22px] mb-2' : 
                      layout === 'compact' ? 'text-[13px] mb-1' : 
                      'text-[18px]'
                    }`}>{item.name}</h4>
                  </div>
                  {layout === 'minimal' && (
                    <span className="text-[17px] font-black text-slate-900 tabular-nums ml-4 shrink-0">{getPriceDisplay(item)}</span>
                  )}
                </div>
                
                {layout !== 'compact' && (
                  <p className={`text-slate-400 font-medium line-clamp-2 leading-relaxed ${
                    layout === 'default' ? 'text-[14px] mb-4' : 'text-[12px] mb-3'
                  }`}>{item.description}</p>
                )}
                
                {layout === 'default' && item.ingredients && (item.ingredients as any).length > 0 && (
                  <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-1">
                    {(item.ingredients as any).map((ing: any, i: number) => (
                      <span key={i} className="px-3 py-1 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100">
                        {typeof ing === 'string' ? ing : (ing.label || ing.name)}
                      </span>
                    ))}
                  </div>
                )}

                <div className={`flex items-center gap-4 ${layout === 'minimal' ? 'mt-auto' : 'mt-auto'}`}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <i className="fa-solid fa-clock text-[10px] text-slate-300"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.serving_time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <i className="fa-solid fa-user-group text-[10px] text-slate-300"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.pax}</span>
                      </div>
                    </div>
                    {layout === 'minimal' && (
                      <div className="ml-auto">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg">
                          <i className="fa-solid fa-plus text-[12px]"></i>
                        </div>
                      </div>
                    )}
                </div>
              </div>
              
              {layout !== 'minimal' && (
                <div className={`absolute text-slate-900 active:scale-90 transition-all ${
                  layout === 'default' ? 'bottom-6 right-6' : 
                  'bottom-2 right-2'
                }`}>
                  <i className="fa-solid fa-plus text-[20px]"></i>
                </div>
              )}
            </button>
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default ItemList;
