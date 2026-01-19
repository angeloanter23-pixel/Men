
import React, { useState, useEffect } from 'react';
import { MenuItem, Category } from '../../types';
import * as MenuService from '../../services/menuService';

interface AdminMenuProps {
  items: MenuItem[];
  setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  cats: Category[];
  setCats: React.Dispatch<React.SetStateAction<Category[]>>;
  isWizard?: boolean; 
}

const AdminMenu: React.FC<AdminMenuProps> = ({ items, setItems, cats, setCats, isWizard = false }) => {
  const [subTab, setSubTab] = useState<'add' | 'list' | 'edit'>('list');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Enterprise Session Context
  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const menuId = session?.defaultMenuId;

  const initialFormState = {
    name: '', desc: '', price: '', cat: cats[0]?.name || '', people: '', mins: '', image: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (!formData.cat && cats.length > 0) {
      setFormData(prev => ({ ...prev, cat: cats[0].name }));
    }
  }, [cats]);

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

  const handleSave = async () => {
    if (!formData.name || !formData.price) return alert("Required: Dish Name and Price.");
    
    if (!isWizard && !menuId) {
      return alert("Critical: System context missing. Please re-login.");
    }

    setLoading(true);
    try {
      const targetCategory = cats.find(c => c.name === formData.cat);
      if (!targetCategory) throw new Error("A valid database category must be selected.");

      const itemPayload: any = {
        name: formData.name,
        price: Number(formData.price),
        description: formData.desc,
        image_url: formData.image || 'https://picsum.photos/seed/dish/400/400',
        category_id: targetCategory.id,
        pax: formData.people || '1 Person',
        serving_time: formData.mins ? `${formData.mins} mins` : '15 mins',
        is_popular: false
      };

      if (subTab === 'edit' && editingItem) {
        itemPayload.id = editingItem.id;
      }

      let savedItem: MenuItem;
      
      if (!isWizard) {
        const dbItem = await MenuService.upsertMenuItem(itemPayload);
        savedItem = {
           ...dbItem,
           cat_name: targetCategory.name
        };
      } else {
        savedItem = {
          ...itemPayload,
          id: itemPayload.id || Date.now(),
          cat_name: targetCategory.name,
          ingredients: []
        };
      }

      if (subTab === 'edit' && editingItem) {
        setItems(prev => prev.map(item => item.id === editingItem.id ? savedItem : item));
      } else {
        setItems(prev => [savedItem, ...prev]);
      }

      setFormData(initialFormState);
      setEditingItem(null);
      setSubTab('list');
    } catch (err: any) {
      alert("Database Sync Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      desc: item.description,
      price: item.price.toString(),
      cat: item.cat_name,
      people: item.pax.replace(' Persons', '').replace(' Person', ''),
      mins: item.serving_time.replace(' mins', ''),
      image: item.image_url
    });
    setSubTab('edit');
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Permanently remove this dish?")) return;
    setLoading(true);
    try {
      if (!isWizard) {
        await MenuService.deleteMenuItem(id.toString());
      }
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      alert("Purge operation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (!cleanName) return;
    
    const exists = cats.find(c => c.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      return alert("Category designation already exists.");
    }

    setLoading(true);
    try {
      let newCat: Category;
      if (!isWizard) {
        newCat = await MenuService.upsertCategory({
           name: cleanName,
           menu_id: menuId,
           order_index: cats.length
        });
      } else {
        newCat = { id: Date.now(), name: cleanName };
      }
      
      setCats(prev => [...prev, newCat]);
      setNewCatName('');
      setIsAddingCat(false);
      if (!formData.cat) setFormData(prev => ({ ...prev, cat: newCat.name }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Warning: This will detach items from this structural group. Purge?')) return;
    setLoading(true);
    try {
      if (!isWizard) {
        await MenuService.deleteCategory(id.toString());
      }
      setCats(prev => prev.filter(cat => cat.id !== id));
    } catch (err: any) {
      alert("Delete failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Catalog Management</h3>
          {!isAddingCat && (
            <button onClick={() => setIsAddingCat(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase shadow-lg shadow-indigo-100 active:scale-95 transition-all">Add Category</button>
          )}
        </div>

        {isAddingCat && (
          <form onSubmit={handleAddCategorySubmit} className="space-y-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 animate-fade-in shadow-inner">
             <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Category Name</label>
                <input 
                  autoFocus
                  disabled={loading}
                  type="text" 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="e.g. Signature Mains" 
                  className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all"
                />
             </div>
             <div className="flex gap-2">
               <button type="submit" disabled={loading} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all">
                 {loading ? 'Creating...' : 'Create Group'}
               </button>
               <button type="button" onClick={() => setIsAddingCat(false)} className="bg-slate-200 text-slate-500 px-6 rounded-2xl text-[9px] font-black uppercase">Cancel</button>
             </div>
          </form>
        )}

        <div className="flex flex-wrap gap-2 px-2">
          {cats.map(c => (
            <span key={c.id} className="bg-white text-slate-900 px-5 py-3 rounded-2xl text-[10px] font-black uppercase border border-slate-100 flex items-center gap-3 shadow-sm hover:border-indigo-200 transition-all">
              <i className="fa-solid fa-folder text-indigo-500 opacity-40"></i>
              {c.name}
              <button onClick={() => deleteCategory(c.id)} className="text-slate-300 hover:text-rose-500 ml-2 transition-colors"><i className="fa-solid fa-circle-xmark"></i></button>
            </span>
          ))}
          {cats.length === 0 && <p className="text-[10px] text-slate-300 font-bold px-2 italic">No database groups defined.</p>}
        </div>
      </div>

      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
        <button onClick={() => { setSubTab('add'); setFormData(initialFormState); }} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'add' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Add Entry</button>
        <button onClick={() => setSubTab('list')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'list' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Library View</button>
      </div>

      {(subTab === 'add' || subTab === 'edit') ? (
        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-6 animate-fade-in">
          <input type="file" id="img-up" className="hidden" onChange={handleImage} />
          <button onClick={() => document.getElementById('img-up')?.click()} className="w-full bg-slate-50 border-2 border-dashed border-slate-200 py-12 rounded-[2.5rem] text-[10px] font-black uppercase text-slate-400 flex flex-col items-center gap-3 overflow-hidden">
            {formData.image ? (
              <img src={formData.image} className="h-40 w-full object-cover rounded-2xl shadow-md" />
            ) : (
              <><i className="fa-solid fa-image text-3xl opacity-20 mb-2"></i><span>Attach Media</span></>
            )}
          </button>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-300 ml-4">Dish Title</label>
              <input type="text" placeholder="e.g. Garlic Butter Salmon" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-black text-sm italic outline-none border border-transparent focus:ring-4 ring-indigo-500/5 shadow-inner" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-300 ml-4">Description</label>
              <textarea placeholder="Describe ingredients and flavors..." value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="w-full bg-slate-50 p-6 rounded-3xl text-sm h-32 outline-none resize-none border border-transparent focus:ring-4 ring-indigo-500/5 shadow-inner" />
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-300 ml-4">Price (₱)</label>
                <input type="number" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-black text-sm outline-none shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-300 ml-4">Context Group</label>
                <select value={formData.cat} onChange={e => setFormData({...formData, cat: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-black text-[10px] uppercase outline-none shadow-inner cursor-pointer">
                  {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={loading} className="w-full mt-6 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all">
            {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : (subTab === 'edit' ? 'Save Context' : 'Commit to Database')}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in pb-20">
          {items.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-50 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <img src={item.image_url} className="w-16 h-16 rounded-2xl object-cover bg-slate-50 border border-slate-100" />
                <div>
                  <div className="font-black text-xs text-slate-800 uppercase italic tracking-tighter">{item.name}</div>
                  <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{item.cat_name}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(item)} className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center active:scale-90 transition-all"><i className="fa-solid fa-pen text-[10px]"></i></button>
                <button onClick={() => handleDelete(item.id)} className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center active:scale-90 transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="py-24 text-center text-slate-300 uppercase text-[9px] font-black tracking-[0.4em] italic border-2 border-dashed border-slate-50 rounded-[3rem] bg-white">
              Database is empty
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminMenu;
