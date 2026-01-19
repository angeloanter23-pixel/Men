
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
  const [subTab, setSubTab] = useState<'add' | 'list' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Enterprise Session Data
  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const menuId = session?.defaultMenuId;
  const restaurantId = session?.restaurant?.id;

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
    if (!formData.name || !formData.price) return alert("Please fill in the Name and Price.");
    
    // Ensure we have a menu context for non-wizard mode
    if (!isWizard && !menuId) {
      return alert("CRITICAL: No menu context found for this restaurant. Please re-login to re-sync your account.");
    }

    setLoading(true);
    try {
      const targetCategory = cats.find(c => c.name === formData.cat);
      if (!targetCategory) throw new Error("Please select or create a category first.");

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
        // DIRECT SUPABASE UPSERT
        const dbItem = await MenuService.upsertMenuItem(itemPayload);
        savedItem = {
           ...dbItem,
           cat_name: targetCategory.name
        };
      } else {
        // Wizard mode temporary state
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
      alert("Dish sync successful.");
    } catch (err: any) {
      alert("Sync Error: " + err.message);
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
    if (!confirm("Are you sure you want to delete this dish from your digital library?")) return;
    setLoading(true);
    try {
      if (!isWizard) {
        await MenuService.deleteMenuItem(id.toString());
      }
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      alert("Deletion failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    if (!isWizard && !menuId) return alert("Menu context missing.");

    setLoading(true);
    try {
      const exists = cats.find(c => c.name.toLowerCase() === newCatName.toLowerCase());
      if (exists) throw new Error("This group already exists in your library.");
      
      let newCat: Category;
      if (!isWizard) {
        // DIRECT SUPABASE SAVE
        newCat = await MenuService.upsertCategory({
           name: newCatName.trim(),
           menu_id: menuId,
           order_index: cats.length
        });
      } else {
        newCat = { id: Date.now(), name: newCatName.trim() };
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
    if (!confirm('This will purge the category identity. Items within it will lose their group association. Continue?')) return;
    setLoading(true);
    try {
      if (!isWizard) {
        await MenuService.deleteCategory(id.toString());
      }
      setCats(prev => prev.filter(cat => cat.id !== id));
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Library Groups</h3>
          {!isAddingCat && (
            <button onClick={() => setIsAddingCat(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-lg shadow-indigo-100 active:scale-95 transition-all">Create Category</button>
          )}
        </div>

        {isAddingCat && (
          <form onSubmit={handleAddCategorySubmit} className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-fade-in">
             <input 
               autoFocus
               disabled={loading}
               type="text" 
               value={newCatName} 
               onChange={e => setNewCatName(e.target.value)}
               placeholder="Category Name (e.g. Desserts)" 
               className="flex-1 bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all"
             />
             <button type="submit" disabled={loading} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase">
               {loading ? '...' : 'Deploy'}
             </button>
             <button type="button" onClick={() => setIsAddingCat(false)} className="text-slate-400 text-sm px-2"><i className="fa-solid fa-xmark"></i></button>
          </form>
        )}

        <div className="flex flex-wrap gap-2 px-2">
          {cats.map(c => (
            <span key={c.id} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-indigo-100/50 flex items-center gap-3">
              {c.name}
              <button onClick={() => deleteCategory(c.id)} className="text-indigo-200 hover:text-rose-400"><i className="fa-solid fa-circle-xmark"></i></button>
            </span>
          ))}
          {cats.length === 0 && <p className="text-[10px] text-slate-300 font-bold px-2 italic">No categories defined in your cloud database.</p>}
        </div>
      </div>

      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
        <button onClick={() => { setSubTab('add'); setFormData(initialFormState); }} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'add' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Create Dish</button>
        <button onClick={() => setSubTab('list')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'list' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Vault ({items.length})</button>
        {subTab === 'edit' && <button className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 animate-pulse italic">Modifying Entity</button>}
      </div>

      {(subTab === 'add' || subTab === 'edit') ? (
        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-6 animate-fade-in">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{subTab === 'edit' ? 'Update Dish Details' : 'Manual Dish Entry'}</h4>
            {subTab === 'edit' && <button onClick={() => setSubTab('list')} className="text-rose-500 font-black text-[9px] uppercase hover:underline">Cancel Sync</button>}
          </div>
          
          <input type="file" id="img-up" className="hidden" onChange={handleImage} />
          <button onClick={() => document.getElementById('img-up')?.click()} className="w-full bg-slate-50 border-2 border-dashed border-slate-200 py-12 rounded-[2.5rem] text-[10px] font-black uppercase text-slate-400 flex flex-col items-center gap-3 overflow-hidden hover:border-indigo-300 transition-colors">
            {formData.image ? (
              <img src={formData.image} className="h-40 w-full object-cover rounded-2xl shadow-md" />
            ) : (
              <><i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-200 mb-2"></i><span>Upload Presentation Image</span></>
            )}
          </button>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-300 ml-4">Dish Title</label>
              <input 
                type="text" 
                placeholder="e.g. Signature Ribeye" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full bg-slate-50 p-5 rounded-2xl font-black text-sm outline-none focus:ring-4 ring-indigo-500/5 transition-all border border-transparent focus:border-indigo-100 shadow-inner" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-300 ml-4">Composition & Description</label>
              <textarea 
                placeholder="List ingredients and flavor profile..." 
                value={formData.desc} 
                onChange={e => setFormData({...formData, desc: e.target.value})} 
                className="w-full bg-slate-50 p-6 rounded-3xl text-sm h-32 outline-none resize-none focus:ring-4 ring-indigo-500/5 transition-all border border-transparent focus:border-indigo-100 shadow-inner" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-300 ml-4">Unit Price (₱)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value})} 
                  className="w-full bg-slate-50 p-5 rounded-2xl font-black text-sm outline-none focus:ring-4 ring-indigo-500/5 border border-transparent focus:border-indigo-100 shadow-inner" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-300 ml-4">Target Group</label>
                <select 
                  value={formData.cat} 
                  onChange={e => setFormData({...formData, cat: e.target.value})} 
                  className="w-full bg-slate-50 p-5 rounded-2xl font-black text-[10px] uppercase outline-none border border-transparent cursor-pointer shadow-inner"
                >
                  {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-300 ml-4">Serving Pax</label>
                <input 
                    type="text" 
                    placeholder="e.g. 1-2" 
                    value={formData.people} 
                    onChange={e => setFormData({...formData, people: e.target.value})} 
                    className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-xs outline-none shadow-inner border border-transparent focus:border-indigo-100" 
                  />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-300 ml-4">Prep Time (Mins)</label>
                <input 
                  type="number" 
                  placeholder="15" 
                  value={formData.mins} 
                  onChange={e => setFormData({...formData, mins: e.target.value})} 
                  className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-xs outline-none shadow-inner border border-transparent focus:border-indigo-100" 
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={loading}
            className={`w-full mt-6 py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all ${subTab === 'edit' ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-slate-900 text-white shadow-slate-200'}`}
          >
            {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : (subTab === 'edit' ? 'Deploy Updates' : 'Sync to Cloud Database')}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {items.length === 0 ? (
            <div className="py-24 text-center text-slate-300 font-bold uppercase text-[9px] tracking-[0.3em] border-2 border-dashed border-slate-100 rounded-[3rem] bg-white">
              <i className="fa-solid fa-database text-3xl mb-4 opacity-10"></i><br />
              Cloud Database is empty
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-50 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                    <img src={item.image_url} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-black text-xs text-slate-800 tracking-tight uppercase italic">{item.name}</div>
                    <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{item.cat_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right mr-2">
                    <div className="text-xs font-black text-slate-900 italic tracking-tighter">₱{item.price}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(item)} disabled={loading} className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all active:scale-90"><i className="fa-solid fa-pen text-[10px]"></i></button>
                    <button onClick={() => handleDelete(item.id)} disabled={loading} className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
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
