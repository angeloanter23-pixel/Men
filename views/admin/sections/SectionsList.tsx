
import React, { useState } from 'react';
import { Category } from '../../../types';

interface SectionsListProps {
  cats: Category[];
  onAdd: (name: string) => void;
  onDelete: (id: string | number) => void;
  loading: boolean;
}

const SectionsList: React.FC<SectionsListProps> = ({ cats, onAdd, onDelete, loading }) => {
  const [newCatName, setNewCatName] = useState('');

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    onAdd(newCatName.trim());
    setNewCatName('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/60 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">New Section Label</label>
          <div className="flex gap-3">
            <input 
              type="text" 
              value={newCatName} 
              onChange={e => setNewCatName(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="flex-1 bg-slate-50 border border-transparent p-5 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-slate-100 transition-all shadow-inner" 
              placeholder="e.g. Signature Dishes" 
            />
            <button 
              onClick={handleAdd} 
              disabled={loading || !newCatName.trim()} 
              className="px-8 bg-[#007AFF] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 disabled:opacity-50 transition-all"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-200/60 overflow-hidden">
        {cats.length > 0 ? cats.map((cat, idx) => (
          <div key={cat.id} className={`flex items-center justify-between p-6 ${idx !== cats.length - 1 ? 'border-b border-slate-50' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100/50"><i className="fa-solid fa-tag text-xs"></i></div>
              <span className="font-bold text-slate-800 uppercase tracking-tight text-lg">{cat.name}</span>
            </div>
            <button 
              onClick={() => onDelete(cat.id)} 
              className="w-10 h-10 text-slate-200 hover:text-rose-500 transition-colors active:scale-90"
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
          </div>
        )) : (
          <div className="py-20 text-center opacity-20 italic text-[11px] font-bold uppercase tracking-widest">No Sections Defined</div>
        )}
      </div>
    </div>
  );
};

export default SectionsList;
