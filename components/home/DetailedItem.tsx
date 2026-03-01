import React from 'react';
import { MenuItem } from '../../types';

interface DetailedItemProps {
  item: MenuItem;
  onItemSelect: (item: MenuItem) => void;
  getPriceDisplay: (item: MenuItem) => string;
}

const DetailedItem: React.FC<DetailedItemProps> = ({ item, onItemSelect, getPriceDisplay }) => {
  return (
    <button 
      onClick={() => onItemSelect(item)}
      className="w-full flex flex-col bg-white rounded-[28px] shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_40px_-5px_rgba(0,0,0,0.1)] transition-all duration-500 group overflow-hidden mb-6 relative border border-slate-100/60 active:scale-[0.99]"
    >
      <div className="aspect-square w-full bg-slate-100 relative overflow-hidden">
        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80"></div>
        <div className="absolute bottom-6 left-6 text-white text-left">
           {item.cat_name.toLowerCase() !== 'uncategorized' && (
             <p className="text-[10px] font-bold uppercase tracking-widest opacity-90 mb-2 text-white/90">{item.cat_name}</p>
           )}
           <h4 className="text-[24px] font-black leading-none tracking-tight">{item.name}</h4>
        </div>
      </div>
      
      <div className="p-6 flex flex-col w-full gap-4">
        <div className="flex items-start justify-between w-full">
          <div className="max-w-[65%] text-left space-y-3">
             <p className="text-slate-500 text-[14px] leading-relaxed font-medium line-clamp-2">{item.description}</p>
             
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  <i className="fa-solid fa-clock text-[9px]"></i>
                  <span className="text-[9px] font-bold uppercase tracking-wider">{item.serving_time}</span>
                </div>
                <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  <i className="fa-solid fa-user-group text-[9px]"></i>
                  <span className="text-[9px] font-bold uppercase tracking-wider">{item.pax}</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col items-end">
             <span className="text-[20px] font-black text-slate-900 tracking-tight">{getPriceDisplay(item)}</span>
          </div>
        </div>

        <div className="w-full pt-2">
           <div className="w-full py-3 bg-transparent border border-slate-200 text-slate-900 rounded-full font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <span>View Details</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
           </div>
        </div>
      </div>
    </button>
  );
};

export default DetailedItem;
