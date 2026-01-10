
import React, { useState } from 'react';
import { MenuItem, Category } from '../types';
import AdminMenu from './admin/AdminMenu';

interface CreateMenuViewProps {
  onCancel: () => void;
  onComplete: (config: any) => void;
}

type WizardStep = 'business' | 'menu' | 'preview' | 'payment';

const CreateMenuView: React.FC<CreateMenuViewProps> = ({ onCancel, onComplete }) => {
  const [step, setStep] = useState<WizardStep>('business');
  
  // State for Step 1
  const [businessName, setBusinessName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [branchInput, setBranchInput] = useState('');
  const [branches, setBranches] = useState<{name: string, url: string}[]>([]);
  
  // State for Step 2
  const [categories, setCategories] = useState<Category[]>([{id: 1, name: 'Main Course'}]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (le) => setLogo(le.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const addBranch = () => {
    if (!branchInput || branches.length >= 7) return;
    const cleanBusiness = businessName.toLowerCase().replace(/\s+/g, '');
    const cleanBranch = branchInput.toLowerCase().replace(/\s+/g, '');
    const newBranch = {
      name: branchInput,
      url: `mymenu.ph/${cleanBusiness || 'business'}/${cleanBranch}`
    };
    setBranches([...branches, newBranch]);
    setBranchInput('');
  };

  const renderBusinessStep = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Business Name</label>
          <input 
            type="text" 
            placeholder="e.g. Steakhouse Prime" 
            value={businessName} 
            onChange={e => setBusinessName(e.target.value)}
            className="w-full p-5 bg-slate-50 rounded-[2rem] font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Brand Identity (Logo)</label>
          <div className="relative group">
            <input type="file" id="logo-up" className="hidden" onChange={handleLogoUpload} />
            <button 
              onClick={() => document.getElementById('logo-up')?.click()}
              className="w-full bg-slate-50 border-2 border-dashed border-slate-200 py-10 rounded-[2.5rem] flex flex-col items-center gap-3 overflow-hidden group-hover:border-indigo-400 transition-colors"
            >
              {logo ? (
                <img src={logo} className="h-24 w-24 object-contain rounded-2xl" alt="Logo" />
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up text-2xl text-slate-300"></i>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Recommended: 500x500px</p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">PNG or JPG, Max 2MB</p>
                  </div>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center px-4">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Branch Management</label>
            <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{branches.length}/7</span>
          </div>
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="Branch Location Name..." 
              value={branchInput} 
              onChange={e => setBranchInput(e.target.value)}
              className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 ring-indigo-500/10"
            />
            <button 
              onClick={addBranch}
              className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {branches.map((b, i) => (
              <div key={i} className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/20 animate-fade-in">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase text-indigo-600">{b.name}</span>
                  <button onClick={() => setBranches(branches.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-500"><i className="fa-solid fa-xmark text-[10px]"></i></button>
                </div>
                <p className="text-[9px] font-mono text-slate-400 truncate">{b.url}</p>
              </div>
            ))}
            {branches.length === 0 && (
              <p className="text-center py-6 text-[9px] font-black text-slate-300 uppercase tracking-widest border border-dashed border-slate-100 rounded-2xl">No branches added yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h3 className="text-[10px] font-black uppercase text-orange-500 tracking-[0.4em] mb-2">Live Rendering</h3>
        <p className="text-xs font-bold text-slate-400">Behold your digital footprint</p>
      </div>

      <div className="relative mx-auto w-64 h-[450px] bg-slate-800 border-8 border-slate-700/50 rounded-[3rem] shadow-2xl overflow-hidden">
        <div className="h-full w-full bg-white flex flex-col">
           <header className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
              <div className="w-8 h-8 bg-slate-100 rounded-lg overflow-hidden">
                {logo ? <img src={logo} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-indigo-500"></div>}
              </div>
              <span className="text-[8px] font-black uppercase tracking-tighter truncate max-w-[80px]">{businessName || 'MY BRAND'}</span>
              <i className="fa-solid fa-bars-staggered text-[10px] text-slate-300"></i>
           </header>
           <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
              <div className="h-24 w-full bg-slate-50 rounded-2xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="space-y-2">
                 <div className="h-2 w-1/2 bg-slate-100 rounded-full"></div>
                 <div className="h-1.5 w-1/3 bg-slate-50 rounded-full"></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 {[1,2,3,4].map(n => (
                   <div key={n} className="h-24 bg-slate-50 rounded-xl p-2 space-y-2">
                      <div className="h-12 w-full bg-white rounded-lg"></div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
                   </div>
                 ))}
              </div>
           </div>
           <footer className="h-10 bg-slate-50 border-t border-slate-100 flex items-center justify-around">
              <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
              <div className="w-4 h-4 rounded-full bg-slate-200"></div>
              <div className="w-4 h-4 rounded-full bg-slate-200"></div>
           </footer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
         <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-400">Total Branches:</span>
            <span className="text-slate-900">{branches.length}</span>
         </div>
         <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-400">Menu Items:</span>
            <span className="text-slate-900">{menuItems.length}</span>
         </div>
         <div className="flex justify-between items-center text-xs font-bold border-t border-slate-50 pt-4">
            <span className="text-slate-400">Status:</span>
            <span className="text-emerald-500 uppercase font-black text-[9px] tracking-widest">Ready to Launch</span>
         </div>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-8 animate-fade-in">
       <div className="grid grid-cols-1 gap-6">
          {/* Basic Plan */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 rounded-full transition-transform group-hover:scale-150 duration-700"></div>
             <header className="relative z-10 mb-8">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">Foundation</span>
                <h3 className="text-2xl font-black italic uppercase">Basic</h3>
                <div className="mt-4 flex items-baseline gap-1">
                   <span className="text-4xl font-black tracking-tighter">₱5,000</span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase">/ year</span>
                </div>
             </header>
             <ul className="space-y-4 mb-8 relative z-10">
                {[
                  "Dynamic QR Menu",
                  "Sharp Pro Admin Panel",
                  "1 Main Branch",
                  "Up to 25 Menu Items",
                  "Email Support"
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-xs font-bold text-slate-500">
                     <i className="fa-solid fa-circle-check text-indigo-500"></i>
                     {f}
                  </li>
                ))}
             </ul>
             <button onClick={() => onComplete({plan: 'basic', businessName})} className="w-full py-5 bg-slate-100 text-slate-900 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all shadow-xl active:scale-95">Select Basic</button>
          </div>

          {/* Premium Plan */}
          <div className="bg-slate-900 p-10 rounded-[4rem] shadow-2xl shadow-indigo-200 relative overflow-hidden group">
             <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px]"></div>
             <div className="absolute top-8 right-8 bg-orange-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg z-20">MOST POPULAR</div>
             <header className="relative z-10 mb-8">
                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-[0.3em]">Hypergrowth</span>
                <h3 className="text-2xl font-black italic uppercase text-white">Premium</h3>
                <div className="mt-4 flex items-baseline gap-1">
                   <span className="text-4xl font-black tracking-tighter text-white">₱10,000</span>
                   <span className="text-[10px] font-bold text-slate-500 uppercase">/ year</span>
                </div>
             </header>
             <ul className="space-y-4 mb-10 relative z-10">
                {[
                  "Unlimited QR Menu Sync",
                  "Up to 7 Multi-branches",
                  "50 Premium Menu Items",
                  "Interactive Table Ordering",
                  "Visual Analytics Suite",
                  "Priority VIP Support"
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-xs font-black text-white/80">
                     <i className="fa-solid fa-circle-check text-orange-500"></i>
                     {f}
                  </li>
                ))}
             </ul>
             <button onClick={() => onComplete({plan: 'premium', businessName})} className="w-full py-6 bg-orange-500 text-white rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl shadow-orange-500/20 active:scale-95 transition-all">Go Premium</button>
          </div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Header Styled like Analytics */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <button onClick={onCancel} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
              <i className="fa-solid fa-xmark text-lg"></i>
           </button>
           <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Onboarding Flow / <span className="text-slate-900">{step}</span></h2>
              <div className="flex gap-1 mt-1">
                 {(['business', 'menu', 'preview', 'payment'] as WizardStep[]).map((s, i) => (
                   <div key={s} className={`h-1 w-8 rounded-full transition-all ${step === s ? 'bg-indigo-600' : i < ['business', 'menu', 'preview', 'payment'].indexOf(step) ? 'bg-indigo-200' : 'bg-slate-100'}`}></div>
                 ))}
              </div>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => {
                const steps: WizardStep[] = ['business', 'menu', 'preview', 'payment'];
                const nextIdx = steps.indexOf(step) + 1;
                if (nextIdx < steps.length) setStep(steps[nextIdx]);
             }}
             className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
           >
              Next
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
        <div className="max-w-md mx-auto">
          <div className="mb-10 animate-fade-in-up">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none italic mb-2">Build Your <span className="text-orange-500">Ecosystem.</span></h1>
            <p className="text-sm font-bold text-slate-400 max-w-[280px]">Let's set up your digital presence in 4 simple steps.</p>
          </div>

          {step === 'business' && renderBusinessStep()}
          {step === 'menu' && (
            <div className="animate-fade-in">
              <AdminMenu 
                items={menuItems} 
                setItems={setMenuItems as any} 
                cats={categories} 
                setCats={setCategories as any} 
              />
            </div>
          )}
          {step === 'preview' && renderPreviewStep()}
          {step === 'payment' && renderPaymentStep()}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 max-w-xl mx-auto flex justify-between items-center z-40">
         <button 
           onClick={() => {
              const steps: WizardStep[] = ['business', 'menu', 'preview', 'payment'];
              const prevIdx = steps.indexOf(step) - 1;
              if (prevIdx >= 0) setStep(steps[prevIdx]);
              else onCancel();
           }}
           className="text-[10px] font-black uppercase text-slate-300 tracking-widest hover:text-slate-900 transition-colors"
         >
           {step === 'business' ? 'Cancel' : 'Back'}
         </button>
         <button 
           onClick={() => {
              const steps: WizardStep[] = ['business', 'menu', 'preview', 'payment'];
              const nextIdx = steps.indexOf(step) + 1;
              if (nextIdx < steps.length) setStep(steps[nextIdx]);
           }}
           className="text-[10px] font-black uppercase text-indigo-600 tracking-widest active:scale-95"
         >
           Skip Step →
         </button>
      </div>
    </div>
  );
};

export default CreateMenuView;
