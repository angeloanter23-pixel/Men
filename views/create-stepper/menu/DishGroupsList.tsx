
import React, { useState } from 'react';
import { MenuItem } from '../../../types';

interface DishGroupsListProps {
  headers: MenuItem[];
  variationMap: Record<string, MenuItem[]>;
  onEditHeader: (item: MenuItem) => void;
  onAddVariant: (parentId: string | number, catName: string) => void;
  onEditVariant: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onAddNewGroup: () => void;
}

const DishGroupsList: React.FC<DishGroupsListProps> = ({ 
  headers, variationMap, onEditHeader, onAddVariant, onEditVariant, onDelete, onAddNewGroup 
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string | number) => {
    setExpandedGroups(prev => ({ ...prev, [String(id)]: !prev[String(id)] }));
  };

  return (
    <div className="space-y-6 animate-fade-in px-2">
      <div className="flex justify-between items-center px-4">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none">Menu Groups ({headers.length})</h3>
        <button 
          onClick={onAddNewGroup}
          className="text-[#007AFF] text-[13px] font-bold active:opacity-50 transition-opacity"
        >
          Add Group
        </button>
      </div>

      <div className="space-y-4">
        {headers.length > 0 ? headers.map(header => {
          const isExpanded = !!expandedGroups[String(header.id)];
          const children = variationMap[String(header.id)] || [];
          
          return (
            <div key={header.id} className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
              <div 
                onClick={() => toggleGroup(header.id)}
                className="p-4 flex justify-between items-center active:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                    <img src={header.image_url} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-slate-900 font-bold text-[17px] tracking-tight leading-none mb-1.5 truncate uppercase">{header.name}</h4>
                    <span className="text-indigo-600 text-[9px] font-black uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                      {children.length} {children.length === 1 ? 'Variant' : 'Variants'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEditHeader(header); }} 
                    className="w-9 h-9 rounded-full text-slate-300 hover:text-[#007AFF] active:scale-90 transition-all flex items-center justify-center"
                  >
                    <i className="fa-solid fa-pen text-xs"></i>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAddVariant(header.id, header.cat_name); }} 
                    className="w-9 h-9 rounded-full bg-[#007AFF]/10 text-[#007AFF] active:scale-90 transition-all flex items-center justify-center"
                  >
                    <i className="fa-solid fa-plus text-xs"></i>
                  </button>
                  <i className={`fa-solid fa-chevron-down text-slate-300 transition-transform duration-300 ml-2 ${isExpanded ? 'rotate-180' : ''}`}></i>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-slate-50/50 divide-y divide-slate-100 border-t border-slate-100">
                  {children.map(child => (
                    <div key={child.id} className="p-4 pl-12 flex items-center justify-between group active:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <img src={child.image_url} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-800 text-[14px] uppercase truncate leading-none mb-1">{child.name}</h5>
                          <p className="text-[10px] font-black text-[#007AFF] tracking-widest leading-none">₱{child.price}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => onEditVariant(child)} className="w-9 h-9 rounded-full text-slate-300 hover:text-[#007AFF] flex items-center justify-center transition-all active:scale-90"><i className="fa-solid fa-pen-to-square text-[10px]"></i></button>
                        <button onClick={() => onDelete(child)} className="w-9 h-9 rounded-full text-slate-300 hover:text-rose-500 flex items-center justify-center transition-all active:scale-90"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                      </div>
                    </div>
                  ))}
                  {children.length === 0 && (
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest py-6 px-12 italic">No variants added.</p>
                  )}
                </div>
              )}
            </div>
          );
        }) : (
          <div className="py-24 text-center space-y-4 opacity-40">
            <i className="fa-solid fa-layer-group text-4xl text-slate-200"></i>
            <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Empty Groups</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DishGroupsList;
