
import React from 'react';
import { MenuItem } from '../../../types';

interface SingleFoodListProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onAddNew: () => void;
}

const SingleFoodList: React.FC<SingleFoodListProps> = ({ items, onEdit, onDelete, onAddNew }) => {
  return (
    <div className="space-y-6 animate-fade-in px-2">
      <div className="flex justify-between items-center px-4">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none">Dish Collection ({items.length})</h3>
        <button 
          onClick={onAddNew}
          className="text-[#007AFF] text-[13px] font-bold active:opacity-50 transition-opacity"
        >
          Add Dish
        </button>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200/60 overflow-hidden divide-y divide-slate-100">
        {items.length > 0 ? items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 group active:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-50">
                <img src={item.image_url} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-[16px] truncate leading-none uppercase">{item.name}</h4>
                  {item.is_popular && <i className="fa-solid fa-star text-[10px] text-amber-500"></i>}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{item.cat_name}</span>
                  <span className="text-[10px] font-black text-slate-400">₱{item.price}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => onEdit(item)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-200 hover:text-[#007AFF] active:scale-90 transition-all"><i className="fa-solid fa-pen text-sm"></i></button>
              <button onClick={() => onDelete(item)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-200 hover:text-rose-500 active:scale-90 transition-all"><i className="fa-solid fa-trash-can text-sm"></i></button>
            </div>
          </div>
        )) : (
          <div className="py-24 text-center space-y-4 opacity-40">
            <i className="fa-solid fa-plate-wheat text-4xl text-slate-200"></i>
            <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Empty Menu</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleFoodList;
