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
      className="w-full flex flex-col bg-[#F2F2F7] rounded-[28px] shadow-[5px_5px_10px_#d1d1d6,-5px_-5px_10px_#ffffff] hover:shadow-[7px_7px_14px_#d1d1d6,-7px_-7px_14px_#ffffff] transition-all duration-500 group overflow-hidden mb-6 relative border border-white/50 active:scale-[0.99]"
    >
      <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden shadow-inner shrink-0">
        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      </div>
      
      <div className="p-5 flex flex-col w-full text-left">
        <div className="flex items-center gap-2 mb-3 flex-nowrap overflow-hidden">
           <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-2 py-1 rounded-full shadow-sm shrink-0">
              <i className="fa-solid fa-user-group text-[9px] shrink-0"></i>
              <span className="text-[10px] font-bold whitespace-nowrap">{item.pax || '1-2'}</span>
           </div>
           <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full shadow-sm shrink-0">
              <i className="fa-solid fa-clock text-[9px] shrink-0"></i>
              <span className="text-[10px] font-bold whitespace-nowrap">{item.serving_time || '15m'}</span>
           </div>
           {item.cat_name.toLowerCase() !== 'uncategorized' && (
             <div className="px-2 py-1 rounded-full border border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider ml-auto">
               {item.cat_name}
             </div>
           )}
        </div>

        <h4 className="text-[22px] font-black text-slate-900 leading-tight mb-2 tracking-tight">{item.name}</h4>
        <p className="text-slate-500 text-[14px] leading-relaxed font-medium line-clamp-2 mb-6">{item.description}</p>

        <div className="mt-auto flex items-center justify-between">
           <span className="text-[24px] font-black text-slate-900 tracking-tight">{getPriceDisplay(item)}</span>
           
           <div className="w-12 h-12 rounded-full bg-[#F2F2F7] text-slate-900 flex items-center justify-center shadow-[3px_3px_6px_#d1d1d6,-3px_-3px_6px_#ffffff] group-hover:shadow-inner transition-all shrink-0">
              <i className="fa-solid fa-plus text-lg"></i>
           </div>
        </div>
      </div>
    </button>
  );
};

export default DetailedItem;
