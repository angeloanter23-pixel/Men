
import React, { useState } from 'react';
import { MenuItem, Category } from '../../types';

interface AdminMenuProps {
  items: MenuItem[];
  setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  cats: Category[];
  setCats: React.Dispatch<React.SetStateAction<Category[]>>;
}

const AdminMenu: React.FC<AdminMenuProps> = ({ items, setItems, cats, setCats }) => {
  const [subTab, setSubTab] = useState<'add' | 'list' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  const initialFormState = {
    name: '', desc: '', price: '', cat: cats[0]?.name || 'Main Course', people: '', mins: '', image: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          setFormData(prev => ({ ...prev, image: loadEvent.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) return alert("Please fill in the Name and Price.");
    
    const newItem: MenuItem = {
      id: subTab === 'edit' && editingItem ? editingItem.id : Date.now(),
      name: formData.name,
      price: Number(formData.price),
      description: formData.desc,
      image_url: formData.image || 'https://picsum.photos/seed/placeholder/400/400',
      category_id: cats.find(c => c.name === formData.cat)?.id || (cats.length > 0 ? cats[0].id : 1),
      cat_name: formData.cat,
      is_popular: false,
      ingredients: [],
      pax: formData.people || '1 Person',
      serving_time: formData.mins ? `${formData.mins} mins` : '15 mins'
    };

    if (subTab === 'edit' && editingItem) {
      setItems(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
    } else {
      setItems(prev => [newItem, ...prev]);
    }

    setFormData(initialFormState);
    setEditingItem(null);
    setSubTab('list');
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      desc: item.description,
      price: item.price.toString(),
      cat: item.cat_name,
      people: item.pax.replace(' mins', ''),
      mins: item.serving_time.replace(' mins', ''),
      image: item.image_url
    });
    setSubTab('edit');
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleAddCategory = () => {
    const name = prompt("Enter new category name:");
    if (name) {
      const exists = cats.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (exists) return alert("Category already exists!");
      const newCat: Category = { id: Date.now(), name };
      setCats(prev => [...prev, newCat]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Categories</h3>
          <button onClick={handleAddCategory} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-lg active:scale-95 transition-all">New Cat</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map(c => (
            <span key={c.id} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border border-indigo-100">
              {c.name}
            </span>
          ))}
          {cats.length === 0 && <p className="text-[10px] text-slate-300 font-bold px-2">No categories defined yet.</p>}
        </div>
      </div>

      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
        <button onClick={() => { setSubTab('add'); setFormData(initialFormState); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'add' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Add Item</button>
        <button onClick={() => setSubTab('list')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'list' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Items ({items.length})</button>
        {subTab === 'edit' && <button className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-600">Editing</button>}
      </div>

      {(subTab === 'add' || subTab === 'edit') ? (
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-4 animate-fade-in">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{subTab === 'edit' ? 'Update Menu Item' : 'Product Definition'}</h4>
            {subTab === 'edit' && <button onClick={() => setSubTab('list')} className="text-rose-500 font-black text-[9px] uppercase">Cancel</button>}
          </div>
          
          <input type="file" id="img-up" className="hidden" onChange={handleImage} />
          <button onClick={() => document.getElementById('img-up')?.click()} className="w-full bg-slate-50 border-2 border-dashed border-slate-200 py-10 rounded-[2rem] text-[10px] font-black uppercase text-slate-400 flex flex-col items-center gap-2 overflow-hidden hover:border-indigo-200 transition-colors">
            {formData.image ? (
              <img src={formData.image} className="h-32 w-full object-cover rounded-xl shadow-md" />
            ) : (
              <><i className="fa-solid fa-cloud-arrow-up text-2xl text-slate-200 mb-2"></i><span>+ Product Photo</span></>
            )}
          </button>
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Dish Name" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-sm outline-none focus:ring-4 ring-indigo-500/5 transition-all border border-transparent focus:border-indigo-100" 
            />
            <textarea 
              placeholder="Delicious description..." 
              value={formData.desc} 
              onChange={e => setFormData({...formData, desc: e.target.value})} 
              className="w-full bg-slate-50 p-5 rounded-2xl text-sm h-28 outline-none resize-none focus:ring-4 ring-indigo-500/5 transition-all border border-transparent focus:border-indigo-100" 
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Price (₱)</label>
                <input 
                  type="number" 
                  placeholder="250" 
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value})} 
                  className="w-full bg-slate-50 p-5 rounded-2xl font-black text-sm outline-none focus:ring-4 ring-indigo-500/5 border border-transparent focus:border-indigo-100" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Category</label>
                <select 
                  value={formData.cat} 
                  onChange={e => setFormData({...formData, cat: e.target.value})} 
                  className="w-full bg-slate-50 p-5 rounded-2xl font-black text-[10px] uppercase outline-none border border-transparent"
                >
                  {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Serving Size</label>
                <input 
                    type="text" 
                    placeholder="e.g. 1-2 Persons" 
                    value={formData.people} 
                    onChange={e => setFormData({...formData, people: e.target.value})} 
                    className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-xs outline-none focus:ring-4 ring-indigo-500/5 border border-transparent focus:border-indigo-100" 
                  />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Prep Time (Mins)</label>
                <input 
                  type="number" 
                  placeholder="15" 
                  value={formData.mins} 
                  onChange={e => setFormData({...formData, mins: e.target.value})} 
                  className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-xs outline-none focus:ring-4 ring-indigo-500/5 border border-transparent focus:border-indigo-100" 
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave} 
            className={`w-full mt-4 ${subTab === 'edit' ? 'bg-orange-500' : 'bg-slate-900'} text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all`}
          >
            {subTab === 'edit' ? 'Confirm Changes' : 'Add to Menu Database'}
          </button>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {items.length === 0 ? (
            <div className="py-24 text-center text-slate-300 font-bold uppercase text-[9px] tracking-[0.3em] border-2 border-dashed border-slate-100 rounded-[3rem] bg-white">
              <i className="fa-solid fa-utensils text-2xl mb-4 opacity-10"></i><br />
              Menu database is empty
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-50 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                    <img src={item.image_url} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-black text-xs text-slate-800 tracking-tight">{item.name}</div>
                    <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{item.cat_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900">₱{item.price}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(item)} className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"><i className="fa-solid fa-pen text-[10px]"></i></button>
                    <button onClick={() => handleDelete(item.id)} className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminMenu;
