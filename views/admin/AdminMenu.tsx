
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
    name: '', desc: '', price: '', cat: cats[0]?.name || '', people: '', mins: '', image: ''
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
      category_id: cats.find(c => c.name === formData.cat)?.id || 1,
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
      const newCat: Category = { id: Date.now(), name };
      setCats(prev => [...prev, newCat]);
    }
  };

  return (
    <div className="p-5 space-y-6">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categories</h3>
          <button onClick={handleAddCategory} className="bg-slate-900 text-white px-3 py-1.5 rounded-xl font-black text-[9px] uppercase">New Cat</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map(c => (
            <span key={c.id} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">{c.name}</span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 bg-slate-200/50 p-1.5 rounded-2xl">
        <button onClick={() => { setSubTab('add'); setFormData(initialFormState); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${subTab === 'add' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Add Item</button>
        <button onClick={() => setSubTab('list')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${subTab === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>List & Edit</button>
        {subTab === 'edit' && <button className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-600">Editing...</button>}
      </div>

      {(subTab === 'add' || subTab === 'edit') ? (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 animate-fade-in">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-[10px] font-black uppercase text-slate-400">{subTab === 'edit' ? 'Update Product' : 'New Product'}</h4>
            {subTab === 'edit' && <button onClick={() => setSubTab('list')} className="text-rose-500 font-bold text-[9px] uppercase">Cancel</button>}
          </div>
          <input type="file" id="img-up" className="hidden" onChange={handleImage} />
          <button onClick={() => document.getElementById('img-up')?.click()} className="w-full bg-slate-50 border-2 border-dashed border-slate-200 py-6 rounded-2xl text-[10px] font-black uppercase text-slate-400 flex flex-col items-center gap-2 overflow-hidden">
            {formData.image ? (
              <img src={formData.image} className="h-32 w-full object-cover rounded-xl" />
            ) : (
              <><i className="fa-solid fa-cloud-arrow-up text-xl"></i><span>+ Upload Image</span></>
            )}
          </button>
          
          <input 
            type="text" 
            placeholder="Item Name" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-indigo-500/20 transition-all" 
          />
          <textarea 
            placeholder="Description" 
            value={formData.desc} 
            onChange={e => setFormData({...formData, desc: e.target.value})} 
            className="w-full bg-slate-50 p-4 rounded-2xl text-sm h-20 outline-none resize-none focus:ring-2 ring-indigo-500/20 transition-all" 
          />
          
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="number" 
              placeholder="Price (₱)" 
              value={formData.price} 
              onChange={e => setFormData({...formData, price: e.target.value})} 
              className="bg-slate-50 p-4 rounded-2xl font-black text-sm outline-none focus:ring-2 ring-indigo-500/20 transition-all" 
            />
            <select 
              value={formData.cat} 
              onChange={e => setFormData({...formData, cat: e.target.value})} 
              className="bg-slate-50 p-4 rounded-2xl font-bold text-xs outline-none"
            >
              {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <input 
                type="text" 
                placeholder="Serves (e.g. 1-2)" 
                value={formData.people} 
                onChange={e => setFormData({...formData, people: e.target.value})} 
                className="bg-slate-50 p-4 rounded-2xl font-bold text-xs outline-none focus:ring-2 ring-indigo-500/20 transition-all" 
              />
              <input 
                type="number" 
                placeholder="Prep Mins" 
                value={formData.mins} 
                onChange={e => setFormData({...formData, mins: e.target.value})} 
                className="bg-slate-50 p-4 rounded-2xl font-bold text-xs outline-none focus:ring-2 ring-indigo-500/20 transition-all" 
              />
          </div>

          <button 
            onClick={handleSave} 
            className={`w-full ${subTab === 'edit' ? 'bg-orange-500' : 'bg-indigo-600'} text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all`}
          >
            {subTab === 'edit' ? 'Update Menu Item' : 'Add to Menu'}
          </button>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {items.length === 0 ? (
            <div className="py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-slate-100 rounded-[2.5rem]">
              No items in menu
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <img src={item.image_url} className="w-12 h-12 object-cover rounded-xl bg-slate-50" />
                  <div>
                    <div className="font-black text-xs text-slate-800">{item.name}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase">{item.cat_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-black text-indigo-600">₱{item.price}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(item)} className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"><i className="fa-solid fa-pen text-[10px]"></i></button>
                    <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
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
