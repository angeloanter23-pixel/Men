import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Category, ItemOptionGroup } from '../../types';
import * as MenuService from '../../services/menuService';

// Modular Components
import SingleFoodList from './menu/SingleFoodList';
import DishGroupsList from './menu/DishGroupsList';
import CategoryList from './sections/SectionsList';
import DishModal from './menu/DishModal';
import MenuFAQ from './menu/MenuFAQ';

interface AdminMenuProps {
  items: MenuItem[];
  setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  cats: Category[];
  setCats: React.Dispatch<React.SetStateAction<Category[]>>;
  menuId: number | string | null;
  restaurantId?: string;
  onOpenFAQ?: () => void;
}

const AdminMenu: React.FC<AdminMenuProps> = ({ items, setItems, cats, setCats, menuId, restaurantId, onOpenFAQ }) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'items' | 'variations'>('categories');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showFaq, setShowFaq] = useState(false);
  const [dbFetchError, setDbFetchError] = useState<any>(null);

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showDishModal, setShowDishModal] = useState(false);
  
  // Unified Delete State
  const [entryToDelete, setEntryToDelete] = useState<{ id: string | number; name: string; type: 'item' | 'category' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const initialFormState = { 
    name: '', desc: '', ingredients: '', price: '', cat: '', 
    people: '1 Person', mins: '15', image: '', 
    imageFile: null as File | null,
    isPopular: false, isAvailable: true, pay_as_you_order: false, parent_id: null as string | number | null,
    has_variations: false,
    optionGroups: [] as ItemOptionGroup[]
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000); 
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => { setToast({ message, type }); };

  const handleDiagnosticRefresh = async () => {
    if (!restaurantId) return;
    setLoading(true);
    setDbFetchError(null);
    try {
        const res = await MenuService.getMenuByRestaurantId(restaurantId);
        setItems(res.items || []);
        setCats(res.categories || []);
        
        if ((res as any).db_error || (res as any).error) {
            const err = (res as any).db_error || { message: (res as any).error };
            setDbFetchError(err);
            // Also store globally for modal access
            (window as any)._last_menu_db_error = err;
            showToast("Database Link Error", "error");
        } else {
            (window as any)._last_menu_db_error = null;
            showToast("Data refreshed from database", "success");
        }
    } catch (e: any) {
        showToast("Synchronization failed", "error");
    } finally {
        setLoading(false);
    }
  };

  const handleSaveItem = async () => {
    if (loading || !formData.name.trim() || !restaurantId) return;
    
    setLoading(true);
    try {
      const targetCategory = cats.find(c => c.name === formData.cat);
      
      let finalImageUrl = formData.image || 'https://picsum.photos/seed/dish/400/400';
      
      if (formData.imageFile) {
        finalImageUrl = await MenuService.uploadMenuItemImage(restaurantId, formData.imageFile);
      }

      const itemPayload: any = {
        name: formData.name.trim(), 
        price: Number(formData.price) || 0, 
        description: formData.desc,
        ingredients: formData.ingredients ? String(formData.ingredients).split(',').map((i: string) => ({ label: i.trim() })) : [], 
        image_url: finalImageUrl,
        category_id: targetCategory ? targetCategory.id : null, 
        pax: formData.has_variations ? 'Various' : formData.people, 
        serving_time: formData.has_variations ? 'Various' : formData.mins + " mins",
        is_popular: formData.isPopular, 
        is_available: formData.has_variations ? true : formData.isAvailable,
        pay_as_you_order: !!formData.pay_as_you_order,
        parent_id: formData.parent_id,
        has_variations: formData.has_variations,
        has_options: formData.has_variations ? false : (formData.optionGroups.length > 0),
        restaurant_id: restaurantId 
      };

      if (editingItem) itemPayload.id = editingItem.id;
      const dbItem = await MenuService.upsertMenuItem(itemPayload);
      
      if (!formData.has_variations) {
        await MenuService.saveItemOptions(dbItem.id, formData.optionGroups);
      }

      // Update local state
      const updatedItem = { ...dbItem, cat_name: formData.cat || 'Uncategorized', option_groups: formData.optionGroups };
      if (editingItem) {
        setItems(prev => prev.map(i => String(i.id) === String(editingItem.id) ? updatedItem : i));
      } else {
        setItems(prev => [updatedItem, ...prev]);
      }

      setShowDishModal(false);
      setEditingItem(null);
      showToast("Menu saved", "success");
    } catch (err: any) {
      showToast("Error: " + err.message, "error");
    } finally { setLoading(false); }
  };

  const executePurge = async (mode: 'default' | 'cascade' | 'orphan' = 'default') => {
    if (!entryToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
        if (entryToDelete?.type === 'item') {
            await MenuService.deleteMenuItem(entryToDelete.id.toString());
            setItems(prev => prev.filter(i => String(i.id) !== String(entryToDelete.id)));
        } else {
            if (mode === 'orphan') {
                const itemsToUpdate = items.filter(i => String(i.category_id) === String(entryToDelete.id));
                for (const item of itemsToUpdate) {
                    const { cat_name, option_groups, ...cleanItem } = item as any;
                    await MenuService.upsertMenuItem({ ...cleanItem, category_id: null });
                }
                setItems(prev => prev.map(i => String(i.category_id) === String(entryToDelete.id) ? { ...i, category_id: null, cat_name: 'Uncategorized' } : i));
            } else if (mode === 'cascade') {
                const itemsToDelete = items.filter(i => String(i.category_id) === String(entryToDelete.id));
                for (const item of itemsToDelete) {
                    await MenuService.deleteMenuItem(item.id.toString());
                }
                setItems(prev => prev.filter(i => String(i.category_id) !== String(entryToDelete.id)));
            }
            await MenuService.deleteCategory(entryToDelete.id);
            setCats(prev => prev.filter(c => String(c.id) !== String(entryToDelete.id)));
        }
        setEntryToDelete(null);
        showToast("Entry removed", "success");
    } catch (err: any) {
        setDeleteError("Cannot delete entry.");
    } finally {
        setIsDeleting(false);
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    const ingString = !item.has_variations && Array.isArray(item.ingredients) 
      ? item.ingredients.map(i => typeof i === 'string' ? i : (i.label || i.name)).join(', ')
      : '';

    setFormData({ 
      name: item.name, desc: item.description, ingredients: ingString, 
      price: item.price.toString(), cat: item.cat_name === 'Uncategorized' ? '' : item.cat_name, 
      people: item.pax || '1 Person', mins: (item.serving_time || '').replace(/\D/g, '') || '15', image: item.image_url, 
      imageFile: null,
      isPopular: !!item.is_popular, 
      isAvailable: item.is_available !== undefined ? !!item.is_available : true,
      pay_as_you_order: !!item.pay_as_you_order, 
      parent_id: item.parent_id || null,
      has_variations: !!item.has_variations,
      optionGroups: item.option_groups || []
    });
    setShowDishModal(true);
  };

  const handleSaveCategory = async (id: string | number | null, name: string, icon: string) => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const res = await MenuService.upsertCategory({ 
        id: id || undefined, 
        name, 
        icon,
        menu_id: menuId,
        order_index: id ? undefined : cats.length 
      }, restaurantId);
      
      if (id) {
        setCats(prev => prev.map(c => String(c.id) === String(id) ? res : c));
        // Update items cat_name if changed
        setItems(prev => prev.map(item => String(item.category_id) === String(id) ? { ...item, cat_name: name } : item));
      } else {
        setCats(prev => [...prev, res]);
      }
      
      showToast("Category updated", "success");
    } catch (e: any) { 
        showToast("Update failed", "error"); 
    }
    finally { setLoading(false); }
  };

  const groupedItems = useMemo(() => {
    const standalone = items.filter(i => !i.parent_id && !i.has_variations);
    const headers = items.filter(i => !!i.has_variations);
    const map: Record<string, MenuItem[]> = {};
    items.filter(i => !!i.parent_id).forEach(c => {
        const pid = String(c.parent_id);
        if (!map[pid]) map[pid] = [];
        map[pid].push(c);
    });
    return { standalone, headers, variationMap: map };
  }, [items]);

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-jakarta pb-40 relative">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] animate-fade-in w-full max-w-sm px-6">
           <div className={`p-4 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-2xl border ${toast?.type === 'success' ? 'bg-slate-900/90 text-white border-white/10' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest flex-1 text-center">{toast?.message}</p>
           </div>
        </div>
      )}

      {dbFetchError && (
        <div className="max-w-2xl mx-auto px-6 pt-6">
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-rose-800 space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-database text-rose-500"></i>
                    <h4 className="font-black uppercase text-[10px] tracking-widest">Database Sync Failure</h4>
                </div>
                <button onClick={() => setDbFetchError(null)} className="text-rose-300 hover:text-rose-500"><i className="fa-solid fa-xmark"></i></button>
             </div>
             <p className="text-[12px] font-bold leading-relaxed">The server could not retrieve your menu data.</p>
             <div className="bg-white/50 p-4 rounded-xl font-mono text-[9px] break-all border border-rose-100 shadow-inner max-h-40 overflow-y-auto no-scrollbar">
                <span className="text-rose-600 font-bold">RAW ERROR:</span> {dbFetchError instanceof Error ? JSON.stringify({ message: dbFetchError.message, stack: dbFetchError.stack }, null, 2) : JSON.stringify(dbFetchError, Object.getOwnPropertyNames(dbFetchError), 2)}
             </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 pt-12 space-y-10">
        <header className="px-2 text-center">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-none uppercase">Menu Editor</h1>
          <p className="text-slate-500 text-[15px] font-medium mt-3 leading-relaxed">
            Manage categories and menu items.
            <button onClick={() => setShowFaq(true)} className="ml-1.5 text-[#007AFF] font-bold hover:underline">Help</button>
          </p>
        </header>

        {/* REARRANGED TABS */}
        <div className="bg-[#E8E8ED] p-1.5 rounded-2xl flex border border-slate-200/50 shadow-inner overflow-x-auto no-scrollbar gap-1">
          {(['categories', 'items', 'variations'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[110px] py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
              {tab === 'categories' ? 'Categories' : tab === 'items' ? 'Single Food' : 'Groups'}
            </button>
          ))}
        </div>

        {activeTab === 'categories' && (
          <CategoryList 
            cats={cats} 
            onAdd={(name, icon) => handleSaveCategory(null, name, icon)} 
            onDelete={(id) => {
                const cat = cats.find(c => c.id === id);
                if (cat) setEntryToDelete({ id, name: cat.name, type: 'category' });
            }} 
            onEdit={(cat) => handleSaveCategory(cat.id, cat.name, cat.icon || 'fa-tag')} 
            onDiagnosticRefresh={handleDiagnosticRefresh}
            loading={loading} 
          />
        )}

        {activeTab === 'items' && (
          <SingleFoodList 
            items={groupedItems.standalone} 
            onEdit={startEdit} 
            onDelete={(item) => setEntryToDelete({ id: item.id, name: item.name, type: 'item' })} 
            onAddNew={() => { setEditingItem(null); setFormData(initialFormState); setShowDishModal(true); }}
            onDiagnosticRefresh={handleDiagnosticRefresh}
            loading={loading}
          />
        )}

        {activeTab === 'variations' && (
          <DishGroupsList 
            headers={groupedItems.headers} 
            variationMap={groupedItems.variationMap} 
            onEditHeader={startEdit}
            onEditVariant={startEdit}
            onAddVariant={(pid, cat) => { setEditingItem(null); setFormData({ ...initialFormState, parent_id: pid, cat: cat }); setShowDishModal(true); }}
            onDelete={(item) => setEntryToDelete({ id: item.id, name: item.name, type: 'item' })}
            onAddNewGroup={() => { setEditingItem(null); setFormData({ ...initialFormState, has_variations: true }); setShowDishModal(true); }}
          />
        )}
      </div>

      {showDishModal && (
        <DishModal 
          editingItem={editingItem} 
          formData={formData} 
          setFormData={setFormData} 
          cats={cats} 
          loading={loading} 
          onClose={() => setShowDishModal(false)} 
          onSave={handleSaveItem} 
        />
      )}

      {/* UNIFIED DELETE CONFIRMATION MODAL */}
      {entryToDelete && (
        <div className="fixed inset-0 z-[5000] flex items-end justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in font-jakarta">
            <div className="relative w-full max-w-lg space-y-3 animate-slide-up flex flex-col">
                <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center text-center space-y-8">
                    <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner border transition-all ${deleteError ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        <i className={`fa-solid ${isDeleting ? 'fa-spinner animate-spin' : deleteError ? 'fa-triangle-exclamation' : 'fa-trash-can'}`}></i>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold uppercase tracking-tighter text-slate-900 leading-none">Confirm Deletion</h3>
                      <p className="text-slate-500 text-[14px] font-medium leading-relaxed px-4">
                        Permanently remove "{entryToDelete?.name}"?
                      </p>
                    </div>

                    <div className="w-full flex flex-col gap-3">
                        {entryToDelete?.type === 'category' ? (
                            <>
                                <button 
                                    onClick={() => executePurge('orphan')} 
                                    className="w-full py-5 bg-slate-900 text-white rounded-full font-bold uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    Keep items as Uncategorized
                                </button>
                                <button 
                                    onClick={() => executePurge('cascade')} 
                                    className="w-full py-5 bg-rose-600 text-white rounded-full font-bold uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    Delete items in category
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => executePurge()} 
                                className="w-full py-5 bg-rose-600 text-white rounded-full font-bold uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                Delete Permanently
                            </button>
                        )}
                        <button 
                            onClick={() => setEntryToDelete(null)} 
                            className="w-full py-5 bg-slate-50 text-slate-400 rounded-full font-bold uppercase text-[11px] tracking-widest active:scale-95 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminMenu;