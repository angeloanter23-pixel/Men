
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
  const [activeTab, setActiveTab] = useState<'items' | 'variations' | 'categories'>('items');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showFaq, setShowFaq] = useState(false);

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showDishModal, setShowDishModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  const initialFormState = { 
    name: '', desc: '', ingredients: '', price: '', cat: '', 
    people: '1 Person', mins: '15', image: '', 
    isPopular: false, isAvailable: true, parent_id: null as string | number | null,
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

  const handleSaveItem = async () => {
    if (loading || !formData.name.trim() || !restaurantId) return;
    
    setLoading(true);
    try {
      const targetCategory = cats.find(c => c.name === formData.cat);
      const ingredientsArray = formData.has_variations ? [] : formData.ingredients
        .split(',')
        .map(i => i.trim())
        .filter(Boolean)
        .map(i => ({ label: i }));

      const itemPayload: any = {
        name: formData.name.trim(), 
        price: Number(formData.price) || 0, 
        description: formData.desc,
        ingredients: ingredientsArray, 
        image_url: formData.image || 'https://picsum.photos/seed/dish/400/400',
        category_id: targetCategory ? targetCategory.id : null, 
        pax: formData.has_variations ? 'Various' : formData.people, 
        serving_time: formData.has_variations ? 'Various' : formData.mins + " mins",
        is_popular: formData.isPopular, 
        is_available: formData.has_variations ? true : formData.isAvailable,
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

      const savedItem = { 
        ...dbItem, 
        cat_name: targetCategory ? targetCategory.name : 'Uncategorized',
        option_groups: formData.has_variations ? [] : formData.optionGroups
      };
      
      if (editingItem) setItems(prev => prev.map(it => it.id === editingItem.id ? savedItem : it));
      else setItems(prev => [savedItem, ...prev]);
      
      showToast("Inventory Updated", 'success');
      setShowDishModal(false);
      setEditingItem(null);
    } catch (err: any) {
      showToast("Error: " + err.message, "error");
    } finally { setLoading(false); }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    const ingString = !item.has_variations && Array.isArray(item.ingredients) 
      ? item.ingredients.map(i => typeof i === 'string' ? i : (i.label || i.name)).join(', ')
      : '';

    setFormData({ 
      name: item.name, desc: item.description, ingredients: ingString, 
      price: item.price.toString(), cat: item.cat_name === 'Uncategorized' ? '' : item.cat_name, 
      people: item.pax || '1 Person', mins: (item.serving_time || '').replace(/\D/g, ''), image: item.image_url, 
      isPopular: !!item.is_popular, isAvailable: item.is_available !== undefined ? !!item.is_available : true,
      parent_id: item.parent_id || null,
      has_variations: !!item.has_variations,
      optionGroups: item.option_groups || []
    });
    setShowDishModal(true);
  };

  const handleSaveCategory = async (id: string | number | null, name: string) => {
    if (!menuId) return;
    setLoading(true);
    try {
      const res = await MenuService.upsertCategory({ 
        id: id || undefined, 
        name, 
        menu_id: menuId, 
        order_index: id ? undefined : cats.length 
      });
      if (id) setCats(cats.map(c => c.id === id ? res : c));
      else setCats([...cats, res]);
      showToast("Inventory Synchronized", "success");
    } catch (e) { showToast("Sync Error", "error"); }
    finally { setLoading(false); }
  };

  const handleDeleteCategory = async (id: string | number) => {
    if (!confirm('Delete this category?')) return;
    try {
      await MenuService.deleteCategory(id);
      setCats(cats.filter(c => c.id !== id));
      showToast("Category Purged", "success");
    } catch (e) { showToast("Error deleting category", "error"); }
  };

  const groupedItems = useMemo(() => {
    const standalone = items.filter(i => !i.parent_id && !i.has_variations);
    const headers = items.filter(i => i.has_variations);
    const map: Record<string, MenuItem[]> = {};
    items.filter(i => i.parent_id).forEach(c => {
        const pid = String(c.parent_id);
        if (!map[pid]) map[pid] = [];
        map[pid].push(c);
    });
    return { standalone, headers, variationMap: map };
  }, [items]);

  const menuFaqs = [
    { q: "What is the difference between a Dish and a Group?", a: "A Single Dish is an item with one set price, like 'Espresso'. A Dish Group is a container for items that come in different sizes or formats, like 'French Fries' which contains 'Regular', 'Large', and 'Bucket' as individual variants." },
    { q: "How do I add variants to a group?", a: "Go to the 'Dish Groups' tab and click the '+' button on any group header. This will open the editor where you can add a sub-item like 'Small' or 'Medium' with its own specific price." },
    { q: "Can I rearrange the categories on my menu?", a: "Yes. Categories appear in the order they were created. You can delete and re-add them if you wish to change the sequence." },
    { q: "What does 'Show on Menu' do?", a: "Toggling this off immediately hides the item from your customers. This is perfect for items that are temporarily out of stock or seasonal dishes." }
  ];

  if (showFaq) {
    return (
      <div className="animate-fade-in">
        <MenuFAQ 
            onBack={() => setShowFaq(false)} 
            title="Catalog Support" 
            subtitle="Get expert help with organizing your digital menu and inventory categories."
            items={menuFaqs}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-jakarta pb-40">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] animate-fade-in w-full max-w-sm px-6">
           <div className={`p-4 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-2xl border ${toast.type === 'success' ? 'bg-slate-900/90 text-white border-white/10' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
              <p className="text-[11px] font-black uppercase tracking-widest flex-1 text-center">{toast.message}</p>
           </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 pt-12 space-y-10">
        <header className="px-2 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Dish Editor</h1>
          <p className="text-slate-500 text-[17px] font-medium mt-3 leading-relaxed">
            Modify your digital inventory and categories. 
            <button onClick={() => setShowFaq(true)} className="ml-1.5 text-[#007AFF] font-bold hover:underline">FAQs</button>
          </p>
        </header>

        <div className="bg-[#E8E8ED] p-1.5 rounded-2xl flex border border-slate-200/50 shadow-inner overflow-x-auto no-scrollbar gap-1">
          {(['items', 'variations', 'categories'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[110px] py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
              {tab === 'items' ? 'Single Food' : tab === 'variations' ? 'Dish Groups' : 'Categories'}
            </button>
          ))}
        </div>

        {activeTab === 'items' && (
          <SingleFoodList 
            items={groupedItems.standalone} 
            onEdit={startEdit} 
            onDelete={setItemToDelete} 
            onAddNew={() => { setEditingItem(null); setFormData(initialFormState); setShowDishModal(true); }} 
          />
        )}

        {activeTab === 'variations' && (
          <DishGroupsList 
            headers={groupedItems.headers} 
            variationMap={groupedItems.variationMap} 
            onEditHeader={startEdit}
            onEditVariant={startEdit}
            onAddVariant={(pid, cat) => { setEditingItem(null); setFormData({ ...initialFormState, parent_id: pid, cat: cat }); setShowDishModal(true); }}
            onDelete={setItemToDelete}
            onAddNewGroup={() => { setEditingItem(null); setFormData({ ...initialFormState, has_variations: true }); setShowDishModal(true); }}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryList 
            cats={cats} 
            onSave={handleSaveCategory} 
            onDelete={handleDeleteCategory} 
            loading={loading} 
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

      {itemToDelete && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl animate-fade-in font-jakarta">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-10 shadow-2xl space-y-8 animate-scale text-center">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center mx-auto text-3xl shadow-inner border border-rose-100/50"><i className="fa-solid fa-trash-can"></i></div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">Remove Entry?</h3>
                  <p className="text-slate-500 text-xs font-bold leading-relaxed px-4">Permanently delete "{itemToDelete.name}" from your menu.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 w-full">
                    <button onClick={async () => {
                      setLoading(true);
                      await MenuService.deleteMenuItem(itemToDelete.id.toString());
                      setItems(prev => prev.filter(it => it.id !== itemToDelete.id));
                      setItemToDelete(null); 
                      setLoading(false);
                      showToast("Entry Removed", "success");
                    }} className="w-full py-5 bg-rose-600 text-white rounded-full font-black uppercase text-[10px] tracking-[0.4em] shadow-xl shadow-rose-100 active:scale-95 transition-all">Execute Purge</button>
                    <button onClick={() => setItemToDelete(null)} className="w-full py-5 bg-slate-50 text-slate-400 rounded-full font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Cancel</button>
                </div>
            </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        @keyframes scale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale { animation: scale 0.3s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminMenu;
