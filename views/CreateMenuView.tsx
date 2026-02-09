
import React, { useState, useEffect, useMemo } from 'react';
import * as MenuService from '../services/menuService';
import IdentityStep from './create-stepper/IdentityStep';
import NodesStep from './create-stepper/NodesStep';
import InventoryStep from './create-stepper/InventoryStep';

type WizardStep = 'identity' | 'deployment' | 'inventory' | 'payment' | 'success';

const STEPS: { id: WizardStep; label: string; icon: string; desc: string }[] = [
  { id: 'identity', label: 'Brand', icon: 'fa-building', desc: 'Define your restaurant identity.' },
  { id: 'deployment', label: 'Nodes', icon: 'fa-qrcode', desc: 'Set up your digital table grid.' },
  { id: 'inventory', label: 'Catalog', icon: 'fa-utensils', desc: 'Add items to your menu.' },
  { id: 'payment', label: 'Billing', icon: 'fa-credit-card', desc: 'Activate your cloud license.' },
  { id: 'success', label: 'Ready', icon: 'fa-check-circle', desc: 'Your menu is ready for deployment.' }
];

const CreateMenuView: React.FC<{ onCancel: () => void; onComplete: () => void }> = ({ onCancel, onComplete }) => {
  const [step, setStep] = useState<WizardStep>('identity');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form Data
  const [brand, setBrand] = useState({
    name: '',
    email: ''
  });
  
  const [generatedQRs, setGeneratedQRs] = useState<{label: string, code: string}[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([
      { id: 1, name: 'Main Course' },
      { id: 2, name: 'Drinks' },
      { id: 3, name: 'Desserts' }
  ]);

  const curStepIdx = STEPS.findIndex(s => s.id === step);

  const handleNext = async () => {
    if (step === 'identity') {
      setLoading(true);
      setErrors({});
      try {
        const nameExists = await MenuService.checkBusinessNameExists(brand.name);
        const emailExists = await MenuService.checkEmailExists(brand.email);
        const newErrors: Record<string, string> = {};
        if (!brand.name.trim()) newErrors.name = "Restaurant name is required";
        else if (nameExists) newErrors.name = "This business name is already taken";
        if (!brand.email.trim() || !brand.email.includes('@')) newErrors.email = "A valid business email is required";
        else if (emailExists) newErrors.email = "This email is already registered";
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); setLoading(false); return; }
      } catch (e) {
        setErrors({ general: "Verification failed. Check your connection." });
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    
    if (step === 'deployment' && generatedQRs.length === 0) {
        alert("Please create at least one table node.");
        return;
    }

    if (step === 'inventory' && items.length === 0) {
        if (!confirm("Your catalog is empty. Guests won't see any food. Proceed anyway?")) return;
    }

    const nextIdx = curStepIdx + 1;
    if (nextIdx < STEPS.length) {
      setStep(STEPS[nextIdx].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSkip = () => {
    const nextIdx = curStepIdx + 1;
    if (nextIdx < STEPS.length) {
      setStep(STEPS[nextIdx].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (curStepIdx > 0) setStep(STEPS[curStepIdx - 1].id);
    else onCancel();
  };

  const downloadConfig = () => {
    const config = {
      restaurant: brand.name,
      email: brand.email,
      deployed_at: new Date().toISOString(),
      tables: generatedQRs,
      menu: items,
      categories: categories,
      billing: { amount: 1299, support: 'geloelolo@gmail.com' }
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `foodie_config_${brand.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    link.click();
  };

  const finalizeSetup = async () => {
    setLoading(true);
    try {
      const randomPass = Math.random().toString(36).slice(-10);
      const res = await MenuService.authSignUp(brand.email, randomPass, brand.name);
      localStorage.setItem('foodie_supabase_session', JSON.stringify(res));
      
      const restaurantId = res.restaurant.id;
      const menuRes = await MenuService.getMenuByRestaurantId(restaurantId);
      const menuId = menuRes.menu_id;

      for (const qr of generatedQRs) {
          await MenuService.upsertQRCode({ restaurant_id: restaurantId, label: qr.label, code: qr.code, type: 'menu' });
      }

      const catMap: Record<string, string> = {};
      for (const cat of categories) {
          const dbCat = await MenuService.upsertCategory({ name: cat.name, menu_id: menuId, order_index: 0 });
          catMap[cat.name] = dbCat.id;
      }

      for (const item of items) {
          const dbItem = await MenuService.upsertMenuItem({
              name: item.name,
              price: parseFloat(item.price),
              description: item.description,
              image_url: item.image_url,
              category_id: catMap[item.cat_name] || null,
              restaurant_id: restaurantId,
              is_available: true
          });
          if (item.optionGroups && item.optionGroups.length > 0) {
              await MenuService.saveItemOptions(dbItem.id, item.optionGroups);
          }
      }
      downloadConfig();
      onComplete();
    } catch (err: any) {
      alert(err.message || "Cloud deployment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col font-jakarta selection:bg-indigo-100">
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 px-6 py-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
           <button onClick={handleBack} className="text-[#007AFF] text-[17px] font-semibold flex items-center gap-1 transition-all active:opacity-50">
             <i className={`fa-solid ${curStepIdx === 0 ? 'fa-xmark' : 'fa-chevron-left'} text-sm`}></i>
             <span>{curStepIdx === 0 ? 'Exit' : 'Back'}</span>
           </button>
           <div className="flex flex-col items-center">
             <div className="flex gap-1.5 mb-1">
               {STEPS.map((s, i) => (
                 <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i === curStepIdx ? 'bg-indigo-600' : 'bg-slate-300'}`} />
               ))}
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Step {curStepIdx + 1} of 5</span>
           </div>
           <button onClick={step === 'success' ? finalizeSetup : handleSkip} className="text-[#007AFF] text-[17px] font-semibold transition-all active:opacity-50">
             {step === 'success' ? 'Done' : 'Skip'}
           </button>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-10 pb-48">
         {step === 'identity' && <IdentityStep brand={brand} setBrand={setBrand} errors={errors} verifying={loading} />}
         {step === 'deployment' && <NodesStep nodes={generatedQRs} setNodes={setGeneratedQRs} />}
         {step === 'inventory' && <InventoryStep items={items} setItems={setItems} categories={categories} setCategories={setCategories} />}

         {step === 'payment' && (
            <div className="space-y-12 animate-slide-up">
                <header className="space-y-2">
                   <h1 className="text-[34px] font-bold tracking-tight text-slate-900 leading-tight">Activation</h1>
                   <p className="text-[17px] text-slate-500 font-medium leading-relaxed">Secure your lifetime enterprise cloud license.</p>
                </header>
                <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 space-y-8 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-indigo-400">One-Time Activation</p>
                        <h3 className="text-7xl font-black tracking-tighter">₱1,299</h3>
                        <div className="pt-8 border-t border-white/10 space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-white/40">Enterprise Support</span>
                                <span className="text-indigo-400">geloelolo@gmail.com</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
         )}

         {step === 'success' && (
            <div className="space-y-10 animate-slide-up text-center py-10">
                <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-[3rem] flex items-center justify-center mx-auto text-5xl shadow-2xl shadow-emerald-100"><i className="fa-solid fa-check"></i></div>
                <div className="space-y-4">
                    <h3 className="text-[34px] font-bold text-slate-900 leading-tight">Deployment Ready</h3>
                    <p className="text-[17px] text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">Your digital restaurant environment has been compiled. Download your token config to proceed.</p>
                </div>
                <button onClick={downloadConfig} className="w-full py-6 bg-white border border-slate-200 rounded-[2rem] flex items-center justify-center gap-4 group hover:shadow-xl transition-all shadow-sm">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><i className="fa-solid fa-cloud-arrow-down"></i></div>
                    <span className="text-[13px] font-bold text-slate-900">Download config.json</span>
                </button>
            </div>
         )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-[110] bg-white/90 backdrop-blur-2xl border-t border-slate-200/50 p-6 md:p-8">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <button onClick={handleBack} className="px-6 py-4 text-[14px] font-bold text-slate-400 hover:text-slate-900 transition-colors">
            {curStepIdx === 0 ? 'Cancel' : 'Back'}
          </button>
          <button onClick={step === 'success' ? finalizeSetup : handleNext} disabled={loading} className={`flex-1 py-5 rounded-full font-bold text-[17px] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${step === 'success' ? 'bg-emerald-600 text-white' : 'bg-[#007AFF] text-white'}`}>
            {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <span>{step === 'success' ? 'Initialize Cloud' : 'Continue'}</span>}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default CreateMenuView;
