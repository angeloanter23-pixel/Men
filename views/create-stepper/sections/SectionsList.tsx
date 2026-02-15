
import React, { useState } from 'react';
import { Category } from '../../../types';

interface CategoryListProps {
  cats: Category[];
  onSave: (id: string | number | null, name: string) => void;
  onDelete: (id: string | number) => void;
  loading: boolean;
}

const CategoryList: React.FC<CategoryListProps> = ({ cats, onSave, onDelete, loading }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<{id: string | number | null, name: string}>({id: null, name: ''});

  const openAdd = () => {
    setEditingCat({id: null, name: ''});
    setIsModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat({id: cat.id, name: cat.name});
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    if (!editingCat.name.trim()) return;
    onSave(editingCat.id, editingCat.name.trim());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in px-2">
      <div className="flex justify-between items-center px-4">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none">Categories ({cats.length})</h3>
        <button 
          onClick={openAdd}
          className="text-[#007AFF] text-[13px] font-bold active:opacity-50 transition-opacity"
        >
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200/60 overflow-hidden divide-y divide-slate-100">
        {cats.length > 0 ? cats.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between p-5 group active:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100/50">
                <i className="fa-solid fa-tag text-xs"></i>
              </div>
              <span className="font-bold text-slate-800 uppercase tracking-tight text-[16px]">{cat.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(cat)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-200 hover:text-indigo-600 transition-all active:scale-90"><i className="fa-solid fa-pen text-sm"></i></button>
              <button onClick={() => onDelete(cat.id)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-200 hover:text-rose-500 transition-all active:scale-90"><i className="fa-solid fa-trash-can text-sm"></i></button>
            </div>
          </div>
        )) : (
          <div className="py-24 text-center space-y-4 opacity-40">
            <i className="fa-solid fa-tags text-4xl text-slate-200"></i>
            <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">No Categories</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-end justify-center font-jakarta animate-fade-in">
          <div onClick={() => setIsModalOpen(false)} className="absolute inset-0 backdrop-blur-sm" />
          <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] shadow-2xl flex flex-col p-8 space-y-8 animate-slide-up pb-12">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 shrink-0" />
            
            <header className="text-center">
              <h3 className="text-xl font-black uppercase text-slate-900 leading-none">
                {editingCat.id ? 'Modify Category' : 'New Category'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">Define your menu grouping</p>
            </header>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Label</label>
                <input 
                  autoFocus
                  type="text" 
                  value={editingCat.name} 
                  onChange={e => setEditingCat({...editingCat, name: e.target.value})}
                  className="w-full bg-slate-50 border border-transparent p-6 rounded-2xl font-bold text-lg outline-none focus:bg-white focus:border-slate-100 transition-all shadow-inner" 
                  placeholder="e.g. Signature Dishes" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handleConfirm}
                disabled={loading || !editingCat.name.trim()}
                className="w-full py-6 bg-slate-900 text-white rounded-none font-black uppercase text-[12px] tracking-[0.4em] shadow-xl active:scale-95 transition-all"
              >
                {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Confirm Registry'}
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full py-5 text-slate-400 font-bold uppercase text-[10px] tracking-widest active:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;
