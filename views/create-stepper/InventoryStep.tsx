
import React, { useState, useMemo } from 'react';
import { MenuItem, Category, ItemOptionGroup } from '../../types';

// Use local modular components copied from admin panel
import SingleFoodList from './menu/SingleFoodList';
import DishGroupsList from './menu/DishGroupsList';
import CategoryList from './sections/SectionsList';
import DishModal from './menu/DishModal';
import MenuFAQ from './menu/MenuFAQ';

interface InventoryStepProps {
  items: MenuItem[];
  setItems: (items: MenuItem[]) => void;
  categories: Category[];
  setCategories: (cats: Category[]) => void;
}

type SubTab = 'items' | 'variations' | 'categories';

const InventoryStep: React.FC<InventoryStepProps> = ({ items, setItems, categories, setCategories }) => {
  const [activeTab, setActiveTab] = useState<SubTab>('items');
  const [showFaq, setShowFaq] = useState(false);
  const [loading] = useState(false);
  
  const initialFormState = { 
    name: '', desc: '', ingredients: '', price: '', cat: '', 
    people: '1 Person', mins: '15', image: '', 
    isPopular: false, isAvailable: true, parent_id: null as string | number | null,
    has_variations: false,
    optionGroups: [] as ItemOptionGroup[]
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showDishModal, setShowDishModal] = useState(false);

  const handleSaveItem = () => {
    if (!formData.name.trim()) return;
    
    const newItem: MenuItem = {
      id: editingItem ? editingItem.id : Date.now(),
      name: formData.name.trim(),
      price: Number(formData.price) || 0,
      description: formData.desc,
      cat_name: formData.cat || 'Uncategorized',
      category_id: categories.find(c => c.name === formData.cat)?.id || null,
      image_url: formData.image || 'https://picsum.photos/seed/dish/600/600',
      is_popular: formData.isPopular,
      is_available: formData.isAvailable,
      ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(Boolean),
      pax: formData.people,
      serving_time: formData.mins + " mins",
      parent_id: formData.parent_id,
      has_variations: formData.has_variations,
      option_groups: formData.optionGroups
    };

    if (editingItem) {
      setItems(items.map(it => it.id === editingItem.id ? newItem : it));
    } else {
      setItems([newItem, ...items]);
    }
    
    setShowDishModal(false);
    setEditingItem(null);
    setFormData(initialFormState);
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    const ingString = Array.isArray(item.ingredients) 
      ? item.ingredients.map(i => typeof i === 'string' ? i : (i.label || i.name)).join(', ')
      : '';

    setFormData({ 
      name: item.name, 
      desc: item.description, 
      ingredients: ingString, 
      price: item.price.toString(), 
      cat: item.cat_name || '', 
      people: item.pax || '1 Person', 
      mins: (item.serving_time || '').replace(/\D/g, '') || '15', 
      image: item.image_url, 
      isPopular: !!item.is_popular, 
      isAvailable: item.is_available !== undefined ? !!item.is_available : true,
      parent_id: item.parent_id || null,
      has_variations: !!item.has_variations,
      optionGroups: item.option_groups || []
    });
    setShowDishModal(true);
  };

  const handleSaveCategory = (id: string | number | null, name: string, icon: string) => {
    if (id) {
        setCategories(categories.map(c => c.id === id ? { ...c, name: name.trim(), icon: icon.trim() } : c));
    } else {
        setCategories([...categories, { id: Date.now(), name: name.trim(), icon: icon.trim() }]);
    }
  };

  const handleDeleteCategory = (id: string | number) => {
    setCategories(categories.filter(c => c.id !== id));
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

  const catalogCreationFaqs = [
    { q: "Dish vs Group Header?", a: "A Single Dish is a standard item. a Group Header is used when an item has many versions (like Pizza sizes or Soda flavors)." },
    { q: "How to add variants?", a: "Go to 'Dish Groups' and click the '+' icon on your main item. You can then add specific sizes or flavors as sub-items." },
    { q: "Can I edit categories later?", a: "Yes. You can manage your menu structure anytime from the Admin Panel once your account is activated." },
    { q: "Required Add-ons?", a: "In the 'Add-ons' tab for any dish, toggle the 'Required' switch. This forces guests to make a selection before ordering." }
  ];

  if (showFaq) {
    return (
      <MenuFAQ 
        onBack={() => setShowFaq(false)} 
        title="Catalog Support" 
        items={catalogCreationFaqs}
      />
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-32">
      <header className="space-y-6 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Menu Catalog</h1>
          <p className="text-[13px] font-medium text-slate-400 leading-relaxed px-4">
            Build your menu and categories.
            <button onClick={() => setShowFaq(true)} className="ml-1 text-[#007AFF] font-bold hover:underline">FAQs</button>
          </p>
        </div>
        
        <div className="bg-[#E8E8ED] p-1.5 rounded-xl flex border border-slate-200/50 shadow-inner overflow-x-auto no-scrollbar gap-1 max-w-sm mx-auto">
          {(['items', 'variations', 'categories'] as const).map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`flex-1 min-w-[110px] py-3.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              {tab === 'items' ? 'Single Food' : tab === 'variations' ? 'Dish Groups' : 'Categories'}
            </button>
          ))}
        </div>
      </header>

      <main>
        {activeTab === 'items' && (
          <SingleFoodList 
            items={groupedItems.standalone} 
            onEdit={startEdit} 
            onDelete={(item) => setItems(items.filter(i => i.id !== item.id))} 
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
            onDelete={(item) => setItems(items.filter(i => i.id !== item.id))}
            onAddNewGroup={() => { setEditingItem(null); setFormData({ ...initialFormState, has_variations: true }); setShowDishModal(true); }}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryList 
            cats={categories} 
            onSave={handleSaveCategory} 
            onDelete={handleDeleteCategory} 
            loading={loading} 
          />
        )}
      </main>

      {showDishModal && (
        <DishModal 
          editingItem={editingItem} 
          formData={formData} 
          setFormData={setFormData} 
          cats={categories} 
          loading={loading} 
          onClose={() => setShowDishModal(false)} 
          onSave={handleSaveItem} 
        />
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default InventoryStep;
