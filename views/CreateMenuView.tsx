
import React, { useState, useEffect, useMemo } from 'react';
import * as MenuService from '../services/menuService';
import IdentityStep from './create-stepper/IdentityStep';
import NodesStep from './create-stepper/NodesStep';
import InventoryStep from './create-stepper/InventoryStep';
import MenuFAQ from './create-stepper/menu/MenuFAQ';

type WizardStep = 'identity' | 'deployment' | 'inventory' | 'success' | 'payment';

const STEPS: { id: WizardStep; label: string; icon: string; desc: string }[] = [
  { id: 'identity', label: 'Brand', icon: 'fa-building', desc: 'Define your restaurant identity.' },
  { id: 'deployment', label: 'Nodes', icon: 'fa-qrcode', desc: 'Set up your digital table grid.' },
  { id: 'inventory', label: 'Catalog', icon: 'fa-utensils', desc: 'Add items to your menu.' },
  { id: 'success', label: 'Ready', icon: 'fa-cloud-arrow-down', desc: 'Save your configuration.' },
  { id: 'payment', label: 'Billing', icon: 'fa-credit-card', desc: 'Activate your cloud license.' }
];

const STORAGE_KEY = 'foodie_stepper_progress';

const successFaqs = [
  { q: "Why should I download the catalog?", a: "The catalog file is a complete digital blueprint of your restaurant. If you ever need to reset your account or move to a different server, you can instantly restore everything by importing this file." },
  { q: "What is in the file?", a: "It contains your brand information, table node tokens, and your entire menu structure including images, prices, and add-on logic." },
  { q: "Can I skip this?", a: "Yes, you can proceed without downloading, but we highly recommend keeping a copy as a secure offline backup of your work." }
];

const paymentFaqs = [
  { q: "Is the fee really one-time?", a: "Yes. The Platinum Lifetime license grants you perpetual access to the Merchant Console and AI Concierge for one location with no recurring monthly fees." },
  { q: "How long does activation take?", a: "Manual activations via GCash or Maya are typically processed within 1-2 hours of the email request during business hours." },
  { q: "Can I add more tables later?", a: "Yes. Your license supports unlimited table nodes. You can generate new QR codes at any time from your dashboard after activation." },
  { q: "Is there a refund policy?", a: "As this is a digital license providing immediate platform access, we generally do not offer refunds. Please ensure you have tested the demo environment before activating." }
];

const CreateMenuView: React.FC<{ onCancel: () => void; onComplete: () => void }> = ({ onCancel, onComplete }) => {
  const [step, setStep] = useState<WizardStep>('identity');
  const [showFaq, setShowFaq] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payMethod, setPayMethod] = useState<'gcash' | 'maya' | 'card'>('gcash');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Form Data
  const [brand, setBrand] = useState({ name: '', email: '' });
  const [generatedQRs, setGeneratedQRs] = useState<{label: string, code: string}[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([
      { id: 1, name: 'Main Course' },
      { id: 2, name: 'Drinks' },
      { id: 3, name: 'Desserts' }
  ]);

  // Load progress on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.brand) setBrand(data.brand);
        if (data.nodes) setGeneratedQRs(data.nodes);
        if (data.items) setItems(data.items);
        if (data.categories) setCategories(data.categories);
        if (data.lastStep) setStep(data.lastStep);
      } catch (e) { console.error("Failed to load progress"); }
    }
  }, []);

  // Save progress on change
  useEffect(() => {
    const data = { brand, nodes: generatedQRs, items, categories, lastStep: step };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [brand, generatedQRs, items, categories, step]);

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

    const nextIdx = curStepIdx + 1;
    if (nextIdx < STEPS.length) {
      setStep(STEPS[nextIdx].id);
      setShowFaq(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (showFaq) { setShowFaq(false); return; }
    if (curStepIdx > 0) setStep(STEPS[curStepIdx - 1].id);
    else onCancel();
  };

  const skipStep = () => {
      if (step === 'payment') return;
      const nextIdx = Math.min(curStepIdx + 1, STEPS.length - 1);
      setStep(STEPS[nextIdx].id);
      setShowFaq(false);
  };

  const downloadConfig = () => {
    const config = {
      establishment_name: brand.name,
      owner_contact: brand.email,
      export_date: new Date().toISOString(),
      table_grid: generatedQRs.map(q => ({ label: q.label, token: q.code })),
      menu_catalog: items.map(i => ({
          display_name: i.name,
          base_price: i.price,
          description_text: i.description,
          image_source: i.image_url,
          section_label: i.cat_name,
          trending_pick: !!i.is_popular,
          in_stock: !!i.is_available,
          serving_capacity: i.pax,
          wait_estimate: i.serving_time,
          is_variant_group: !!i.has_variations,
          custom_choices: i.optionGroups || []
      })),
      menu_sections: categories.map(c => ({ name: c.name })),
      sys_info: { version: '4.5.2', engine: 'Foodie Premium SPA' }
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `foodie_backup_${brand.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    link.click();
  };

  const handlePaymentAction = () => {
      if (!agreedToTerms) return;
      
      const methodLabel = payMethod.toUpperCase();
      const subject = encodeURIComponent(`License Activation [${methodLabel}]: ${brand.name}`);
      const body = encodeURIComponent(`I wish to activate my digital menu license via ${methodLabel}.\n\nEstablishment: ${brand.name}\nAdmin Email: ${brand.email}\nPlan: Platinum Lifetime (₱1,299)\n\nPlease provide payment details for ${methodLabel}.`);
      
      window.location.href = `mailto:geloelolo@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col font-jakarta selection:bg-indigo-100 relative">
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 px-6 py-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
           <button onClick={onCancel} className="text-[#007AFF] text-[17px] font-semibold flex items-center gap-1 transition-all active:opacity-50">
             <i className="fa-solid fa-chevron-left text-sm"></i>
             <span>Exit</span>
           </button>
           <div className="flex flex-col items-center">
             <div className="flex gap-1.5 mb-1">
               {STEPS.map((s, i) => (
                 <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i === curStepIdx ? 'bg-indigo-600' : 'bg-slate-300'}`} />
               ))}
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Step {curStepIdx + 1} of 5</span>
           </div>
           {step !== 'payment' ? (
             <button onClick={skipStep} className="text-slate-300 text-[13px] font-bold hover:text-slate-900 transition-colors uppercase tracking-widest">Skip</button>
           ) : (
             <div className="w-10"></div>
           )}
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-10 pb-48">
         {step === 'identity' && <IdentityStep brand={brand} setBrand={setBrand} errors={errors} verifying={loading} />}
         {step === 'deployment' && <NodesStep nodes={generatedQRs} setNodes={setGeneratedQRs} />}
         {step === 'inventory' && <InventoryStep items={items} setItems={setItems} categories={categories} setCategories={setCategories} />}

         {step === 'success' && (
            showFaq ? (
              <MenuFAQ 
                onBack={() => setShowFaq(false)} 
                title="Blueprint Support" 
                items={successFaqs}
              />
            ) : (
              <div className="space-y-12 animate-slide-up py-10">
                <header className="space-y-3 text-center">
                  <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Save Progress</h1>
                  <p className="text-[13px] font-medium text-slate-400 leading-relaxed px-4">
                    Download your blueprint file to keep it safe.
                    <button onClick={() => setShowFaq(true)} className="ml-1.5 text-[#007AFF] font-bold hover:underline">FAQs</button>
                  </p>
                </header>

                <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col gap-6">
                    <div className="text-left space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Archive Summary</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="bg-slate-50 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 border border-slate-100">{items.length} Items</span>
                            <span className="bg-slate-50 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 border border-slate-100">{generatedQRs.length} Tables</span>
                        </div>
                    </div>
                    <button onClick={downloadConfig} className="w-full py-5 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-4 group hover:bg-black transition-all shadow-lg active:scale-95">
                        <i className="fa-solid fa-file-export"></i>
                        <span className="text-[13px] font-black uppercase tracking-widest">Download Catalog</span>
                    </button>
                </div>
              </div>
            )
         )}

         {step === 'payment' && (
            showFaq ? (
              <MenuFAQ 
                onBack={() => setShowFaq(false)} 
                title="License Support" 
                items={paymentFaqs}
              />
            ) : (
              <div className="space-y-12 animate-slide-up">
                <header className="space-y-3 text-center">
                  <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Activation</h1>
                  <p className="text-[13px] font-medium text-slate-400 leading-relaxed px-4">
                    Unlock your license to activate all features.
                    <button onClick={() => setShowFaq(true)} className="ml-1.5 text-[#007AFF] font-bold hover:underline">FAQs</button>
                  </p>
                </header>

                <div className="bg-[#0f172a] p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50/20 rounded-full blur-[80px]"></div>
                    <div className="relative z-10 space-y-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Platinum <br/> Unlimited</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-400 mt-2">Lifetime License</p>
                            </div>
                            <div className="text-right">
                                <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/5 inline-block">
                                    <span className="text-3xl font-black tracking-tighter">₱1,299</span>
                                </div>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">One-time fee</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[8px]"><i className="fa-solid fa-check"></i></div>
                                <span className="text-xs font-medium text-slate-400">Unlimited Table QR Nodes</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[8px]"><i className="fa-solid fa-check"></i></div>
                                <span className="text-xs font-medium text-slate-400">AI Concierge & Analytics Hub</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-4">Select Gateway</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <button 
                            onClick={() => setPayMethod('gcash')}
                            className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${payMethod === 'gcash' ? 'bg-white border-blue-500 shadow-xl' : 'bg-slate-100 border-transparent text-slate-400'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${payMethod === 'gcash' ? 'bg-[#007AFF] text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-300'}`}>G</div>
                                <div>
                                    <p className={`text-sm font-black uppercase ${payMethod === 'gcash' ? 'text-slate-900' : 'text-slate-400'}`}>GCash Wallet</p>
                                    <p className="text-[10px] font-bold opacity-60">Verified via Gmail</p>
                                </div>
                            </div>
                            {payMethod === 'gcash' && <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]"><i className="fa-solid fa-check"></i></div>}
                        </button>

                        <button 
                            onClick={() => setPayMethod('maya')}
                            className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${payMethod === 'maya' ? 'bg-white border-emerald-500 shadow-xl' : 'bg-slate-100 border-transparent text-slate-400'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${payMethod === 'maya' ? 'bg-[#00FF5E] text-slate-900 shadow-lg shadow-emerald-200' : 'bg-white text-slate-300'}`}>M</div>
                                <div>
                                    <p className={`text-sm font-black uppercase ${payMethod === 'maya' ? 'text-slate-900' : 'text-slate-400'}`}>Maya App</p>
                                    <p className="text-[10px] font-bold opacity-60">Verified via Gmail</p>
                                </div>
                            </div>
                            {payMethod === 'maya' && <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]"><i className="fa-solid fa-check"></i></div>}
                        </button>

                        <button 
                            onClick={() => setPayMethod('card')}
                            className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${payMethod === 'card' ? 'bg-white border-indigo-600 shadow-xl' : 'bg-slate-100 border-transparent text-slate-400'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${payMethod === 'card' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white text-slate-300'}`}><i className="fa-solid fa-credit-card"></i></div>
                                <div>
                                    <p className={`text-sm font-black uppercase ${payMethod === 'card' ? 'text-slate-900' : 'text-slate-400'}`}>Credit / Debit</p>
                                    <p className="text-[10px] font-bold opacity-60">Manual Request</p>
                                </div>
                            </div>
                            {payMethod === 'card' && <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]"><i className="fa-solid fa-check"></i></div>}
                        </button>
                    </div>
                </div>

                <div className="px-4 py-8 bg-white rounded-3xl border border-slate-200 flex items-start gap-4">
                    <div onClick={() => setAgreedToTerms(!agreedToTerms)} className={`w-6 h-6 rounded-lg border-2 shrink-0 transition-all flex items-center justify-center cursor-pointer ${agreedToTerms ? 'bg-indigo-600 border-indigo-600 shadow-md' : 'bg-white border-slate-300'}`}>
                        {agreedToTerms && <i className="fa-solid fa-check text-white text-[10px]"></i>}
                    </div>
                    <div>
                        <p className="text-[13px] font-medium text-slate-600 leading-tight">I agree to the <span className="text-indigo-600 font-bold hover:underline cursor-pointer">Terms of Service</span> and authorize the activation of my cloud merchant license.</p>
                    </div>
                </div>
              </div>
            )
         )}
      </main>

      <footer className="sticky bottom-0 left-0 right-0 z-[110] bg-white/90 backdrop-blur-2xl border-t border-slate-200/50 p-6 md:p-8">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <button onClick={handleBack} className="px-6 py-4 text-[14px] font-bold text-slate-400 hover:text-slate-900 transition-colors">
            {(curStepIdx === 0 || showFaq) ? (showFaq ? 'Close' : 'Cancel') : 'Back'}
          </button>
          <button 
            onClick={step === 'payment' ? handlePaymentAction : handleNext} 
            disabled={loading || (step === 'payment' && !agreedToTerms) || showFaq || (step === 'identity' && (!brand.name.trim() || !brand.email.trim()))} 
            className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-[13px] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed ${step === 'payment' ? 'bg-slate-900 text-white' : 'bg-[#007AFF] text-white'}`}
          >
            {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <span>{step === 'payment' ? 'Request Activation' : 'Continue'}</span>}
          </button>
        </div>
      </footer>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};

export default CreateMenuView;
