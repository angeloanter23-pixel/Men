import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MenuItem, Category } from '../types';
import AdminMenu from './admin/AdminMenu';
import * as MenuService from '../services/menuService';

// Declare QRious globally as it's loaded from CDN
declare const QRious: any;

interface Branch {
  id: string;
  name: string;
  image_url: string;
  subdomain: string;
}

interface QRAsset {
  id: string;
  name: string;
  token: string;
}

interface QRPreviewCardProps {
  asset: QRAsset;
  isSelected: boolean;
  onDelete: (id: string) => void;
}

const QRPreviewCard: React.FC<QRPreviewCardProps> = ({ asset, isSelected, onDelete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finalUrl = `men-m53q.vercel.app/${asset.token}`;

  useEffect(() => {
    if (canvasRef.current && typeof QRious !== 'undefined') {
      new QRious({
        element: canvasRef.current,
        size: 100,
        value: finalUrl,
        level: 'H',
        foreground: '#0f172a'
      });
    }
  }, [finalUrl]);

  return (
    <div className={`relative bg-white p-4 rounded-3xl border transition-all flex flex-col items-center group ${isSelected ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-100 shadow-sm'}`}>
      <div className="w-full text-center mb-2">
        <p className="text-[9px] font-black uppercase text-slate-800 truncate">{asset.name}</p>
        <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">ID: {asset.token}</p>
      </div>
      <div className="bg-slate-50 p-2 rounded-2xl border border-slate-50 group-hover:bg-white transition-colors mb-3">
        <canvas ref={canvasRef}></canvas>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDelete(asset.id); }} className="w-full h-8 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-slate-100">
        <i className="fa-solid fa-trash-can text-[10px]"></i>
      </button>
    </div>
  );
};

interface CreateMenuViewProps {
  onCancel: () => void;
  onComplete: (config: any) => void;
}

type WizardStep = 'info' | 'branches' | 'codes' | 'dishes' | 'design' | 'preview' | 'account' | 'artifact' | 'billing';

const STEPS_CONFIG: { id: WizardStep; label: string; sub: string; desc: string; note: string }[] = [
  { 
    id: 'info', 
    label: 'Business Name', 
    sub: 'Step 01', 
    desc: 'Enter the official name of your restaurant. This name will appear on your menu and your QR codes.',
    note: 'Your business name will be checked against our database to make sure it is unique.'
  },
  { 
    id: 'branches', 
    label: 'Branch Locations', 
    sub: 'Step 02', 
    desc: 'Add the physical locations of your business. You can manage multiple branches from one account.',
    note: 'Adding branches helps you track sales and manage menus for different locations.'
  },
  { 
    id: 'codes', 
    label: 'QR Codes', 
    sub: 'Step 03', 
    desc: 'Create unique codes for your tables. Customers scan these to see your menu instantly on their phones.',
    note: 'We recommend creating a different code for every table in your restaurant.'
  },
  { 
    id: 'dishes', 
    label: 'Menu Library', 
    sub: 'Step 04', 
    desc: 'Build your list of food and drinks. Group them into categories like Main Course or Desserts.',
    note: 'Clear photos and simple descriptions help your customers choose their food faster.'
  },
  { 
    id: 'design', 
    label: 'Menu Style', 
    sub: 'Step 05', 
    desc: 'Pick a look that matches your restaurant brand. Our themes work perfectly on all mobile phones.',
    note: 'Choose colors and fonts that make your food look its absolute best.'
  },
  { 
    id: 'preview', 
    label: 'Menu Preview', 
    sub: 'Step 06', 
    desc: 'See exactly how your menu looks on a real phone screen before you finish the setup.',
    note: 'Try clicking through categories to see how the layout works for your customers.'
  },
  { 
    id: 'account', 
    label: 'Admin Email', 
    sub: 'Step 07', 
    desc: 'Enter your business email. You will use this to log in to your dashboard and manage orders.',
    note: 'Make sure to use an email address that you check often for important updates.'
  },
  { 
    id: 'artifact', 
    label: 'Save Backup', 
    sub: 'Step 08', 
    desc: 'Download your menu settings as a file. This is your permanent backup in case you need to restore your data.',
    note: 'You must save this file to your computer to move to the final step.'
  },
  { 
    id: 'billing', 
    label: 'System Pricing', 
    sub: 'Step 09', 
    desc: 'Choose a plan that fits your business. After picking a plan, we will help you schedule a setup appointment.',
    note: 'Click the finish button to open Gmail and send us your appointment request.'
  }
];

const THEMES = [
  { id: 'classic', name: 'Sharp Orange', primary: 'bg-orange-500', bg: 'bg-[#fcfdfe]', text: 'text-orange-600' },
  { id: 'midnight', name: 'Deep Indigo', primary: 'bg-indigo-600', bg: 'bg-[#f8fafc]', text: 'text-indigo-600' },
  { id: 'forest', name: 'Sage Green', primary: 'bg-emerald-600', bg: 'bg-[#f7faf9]', text: 'text-emerald-700' },
  { id: 'noir', name: 'Minimalist', primary: 'bg-slate-900', bg: 'bg-white', text: 'text-slate-900' }
];

const CreateMenuView: React.FC<CreateMenuViewProps> = ({ onCancel, onComplete }) => {
  const [step, setStep] = useState<WizardStep>('info');
  const [businessName, setBusinessName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [isNameVerified, setIsNameVerified] = useState(false);
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchSubView, setBranchSubView] = useState<'list' | 'create'>('list');
  const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);
  
  // QR Generation State
  const [qrAssets, setQrAssets] = useState<QRAsset[]>([]);
  const [qrMode, setQrMode] = useState<'single' | 'bulk'>('single');
  const [qrBaseName, setQrBaseName] = useState('Table ');
  const [qrBulkCount, setQrBulkCount] = useState(5);

  const [categories, setCategories] = useState<Category[]>([{ id: 1, name: 'Main Course' }, { id: 2, name: 'Beverages' }]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [userEmail, setUserEmail] = useState('');
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'6' | '12'>('12');

  const handleNameChange = (val: string) => { 
    setBusinessName(val); 
    setIsNameVerified(false); 
    setNameError(null); 
  };

  const checkNameAvailability = async () => {
    if (!businessName.trim()) { setNameError("Please enter a name first."); return; }
    setIsCheckingName(true);
    setNameError(null);
    try {
      const exists = await MenuService.checkBusinessNameExists(businessName);
      if (exists) { 
        setNameError("This restaurant name already exists."); 
        setIsNameVerified(false); 
      }
      else { 
        setIsNameVerified(true); 
        setNameError(null); 
      }
    } catch (err: any) { 
      setNameError("Database check failed."); 
    }
    finally { setIsCheckingName(false); }
  };

  const handleGenerateQRs = () => {
    if (qrMode === 'single') {
        const name = qrBaseName.trim() || 'Table';
        if (qrAssets.some(a => a.name.toLowerCase() === name.toLowerCase())) {
            alert("A code with this name already exists in your list.");
            return;
        }
        setQrAssets(prev => [{
            id: Math.random().toString(36).substr(2, 9),
            name: name,
            token: Math.random().toString(36).substr(2, 6).toUpperCase()
        }, ...prev]);
    } else {
        const qty = Math.min(qrBulkCount, 50);
        const newAssets: QRAsset[] = [];
        for (let i = 1; i <= qty; i++) {
            const name = `${qrBaseName}${i}`;
            // Skip if duplicate exists to prevent token fragmentation
            if (qrAssets.some(a => a.name.toLowerCase() === name.toLowerCase())) continue;
            
            newAssets.push({
                id: Math.random().toString(36).substr(2, 9),
                name: name,
                token: Math.random().toString(36).substr(2, 6).toUpperCase()
            });
        }
        setQrAssets(prev => [...newAssets, ...prev]);
    }
  };

  const downloadConfig = () => {
    const config = { 
      business: { name: businessName, logo, branches, qrAssets }, 
      menu: { categories, items: menuItems }, 
      user: { email: userEmail },
      design: { themeId: selectedTheme.id }
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${businessName.replace(/\s+/g, '_')}_setup.json`; a.click();
    setHasDownloaded(true);
  };

  const launchGmail = () => {
    const to = "deploy@sharpqr.com";
    const subject = `Deployment Appointment: ${businessName}`;
    const planText = selectedPlan === '6' ? '6 Months (₱3,500)' : '12 Months (₱6,000)';
    const body = `Hello SharpQR Team,\n\nI want to schedule an appointment to deploy my digital menu.\n\nBusiness Name: ${businessName}\nAdmin Email: ${userEmail}\nSelected Plan: ${planText}\n\nI have saved my configuration file and I'm ready to proceed.\n\nThank you.`;
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    
    onComplete({ 
      business: { name: businessName, logo, branches, qrAssets }, 
      menu: { categories, items: menuItems }, 
      user: { email: userEmail },
      plan: selectedPlan 
    });
  };

  const renderProtocolHeader = (config: typeof STEPS_CONFIG[0]) => (
    <div className="mb-10 animate-fade-in px-2">
       <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">{config.sub}</p>
       </div>
       <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-900 mb-4">
         {config.label.split(' ')[0]} <span className="text-indigo-600">{config.label.split(' ').slice(1).join(' ')}</span>
       </h2>
       <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
         {config.desc}
       </p>
    </div>
  );

  const renderNoteCard = (icon: string, text: string) => (
    <div className="mt-12 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 animate-fade-in">
       <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0"><i className={`fa-solid ${icon} text-xs`}></i></div>
       <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{text}</p>
    </div>
  );

  const currentStepData = STEPS_CONFIG.find(s => s.id === step)!;
  const stepsList: WizardStep[] = STEPS_CONFIG.map(s => s.id);
  const currentIndex = stepsList.indexOf(step);
  const isNextDisabled = (step === 'info' && !isNameVerified) || (step === 'account' && !userEmail.includes('@')) || (step === 'artifact' && !hasDownloaded) || (step === 'billing' && !agreedToTerms);

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col font-['Plus_Jakarta_Sans'] overflow-x-hidden">
      <header className="bg-white/80 backdrop-blur-2xl sticky top-0 z-[100] border-b border-slate-100 shadow-sm px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
           <button onClick={onCancel} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all"><i className="fa-solid fa-xmark"></i></button>
           <div className="flex gap-1.5 overflow-x-auto no-scrollbar max-w-[150px]">
             {STEPS_CONFIG.map((s, i) => (
               <div key={s.id} className={`h-1 rounded-full transition-all duration-500 shrink-0 ${step === s.id ? 'bg-indigo-600 w-8' : i < currentIndex ? 'bg-indigo-200 w-4' : 'bg-slate-100 w-2'}`} />
             ))}
           </div>
           <div className="w-10"></div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 no-scrollbar pb-40">
        <div className="max-w-md mx-auto">
          {renderProtocolHeader(currentStepData)}

          <div className="transition-all duration-500">
            {step === 'info' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Restaurant Name</label>
                    {isCheckingName && <i className="fa-solid fa-spinner animate-spin text-indigo-400 text-xs"></i>}
                  </div>
                  <input type="text" placeholder="e.g. Starbucks" value={businessName} onChange={e => handleNameChange(e.target.value)} className={`w-full p-6 bg-slate-50 rounded-2xl font-black text-lg outline-none border-2 transition-all ${isNameVerified ? 'border-emerald-400' : 'border-transparent'}`} />
                  <button onClick={checkNameAvailability} disabled={isCheckingName || !businessName.trim()} className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${isNameVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white'}`}>
                    {isNameVerified ? 'Name Available ✓' : 'Check Availability'}
                  </button>
                  {nameError && <p className="text-[10px] font-black text-rose-500 px-4 uppercase">{nameError}</p>}
                </div>
                {renderNoteCard("fa-building", currentStepData.note)}
              </div>
            )}

            {step === 'branches' && (
              <div className="space-y-6">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button onClick={() => setBranchSubView('list')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${branchSubView === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>My List</button>
                  <button onClick={() => { setEditingBranch({}); setBranchSubView('create'); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${branchSubView === 'create' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Add New</button>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl min-h-[200px] flex flex-col justify-center">
                  {branchSubView === 'create' ? (
                    <div className="space-y-4 animate-fade-in">
                       <input type="text" placeholder="Store name..." value={editingBranch?.name || ''} onChange={e => setEditingBranch({...editingBranch, name: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none" />
                       <button onClick={() => { if(editingBranch?.name) setBranches([...branches, {id: Math.random().toString(), name: editingBranch.name, image_url: '', subdomain: ''}]); setBranchSubView('list'); }} className="w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase">Save Location</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                       {branches.map(b => <div key={b.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center font-black uppercase text-xs"><span>{b.name}</span><button onClick={() => setBranches(branches.filter(it => it.id !== b.id))} className="text-rose-400">✕</button></div>)}
                       {branches.length === 0 && <p className="text-center text-slate-300 font-bold text-xs italic">No branches added yet.</p>}
                    </div>
                  )}
                </div>
                {renderNoteCard("fa-sitemap", currentStepData.note)}
              </div>
            )}

            {step === 'codes' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button onClick={() => setQrMode('single')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${qrMode === 'single' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Single</button>
                    <button onClick={() => setQrMode('bulk')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${qrMode === 'bulk' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Bulk</button>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
                   {qrMode === 'single' ? (
                     <div className="space-y-4 animate-fade-in">
                        <div className="space-y-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest">Table Label</label>
                            <input type="text" value={qrBaseName} onChange={e => setQrBaseName(e.target.value)} placeholder="e.g. Table 1" className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs outline-none" />
                        </div>
                     </div>
                   ) : (
                     <div className="grid grid-cols-2 gap-4 animate-fade-in">
                        <div className="space-y-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest">Prefix</label>
                            <input type="text" value={qrBaseName} onChange={e => setQrBaseName(e.target.value)} placeholder="Table" className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest">Total Qty</label>
                            <input type="number" value={qrBulkCount} onChange={e => setQrBulkCount(Number(e.target.value))} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs outline-none" />
                        </div>
                     </div>
                   )}
                   <button onClick={handleGenerateQRs} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all">
                       {qrMode === 'single' ? 'Create Single Code' : 'Generate Sequence'}
                   </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto no-scrollbar pb-10">
                   {qrAssets.map(a => <QRPreviewCard key={a.id} asset={a} isSelected={false} onDelete={id => setQrAssets(qrAssets.filter(q => q.id !== id))} />)}
                   {qrAssets.length === 0 && (
                     <div className="col-span-2 py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">No codes generated yet.</p>
                     </div>
                   )}
                </div>
                {renderNoteCard("fa-qrcode", currentStepData.note)}
              </div>
            )}

            {step === 'dishes' && (
              <div className="animate-fade-in">
                <AdminMenu items={menuItems} setItems={setMenuItems as any} cats={categories} setCats={setCategories as any} isWizard={true} />
                {renderNoteCard("fa-utensils", currentStepData.note)}
              </div>
            )}

            {step === 'design' && (
              <div className="space-y-4">
                 {THEMES.map(theme => (
                   <button key={theme.id} onClick={() => setSelectedTheme(theme)} className={`w-full p-6 flex items-center justify-between rounded-[2rem] border transition-all ${selectedTheme.id === theme.id ? 'bg-slate-50 border-indigo-600 shadow-md' : 'bg-white border-slate-100'}`}>
                      <div className="flex items-center gap-4"><div className={`w-8 h-8 rounded-full ${theme.primary} shadow-lg shadow-indigo-100`}></div><span className="font-black text-slate-800 uppercase italic text-sm">{theme.name}</span></div>
                      {selectedTheme.id === theme.id && <i className="fa-solid fa-circle-check text-indigo-600"></i>}
                   </button>
                 ))}
                 {renderNoteCard("fa-palette", currentStepData.note)}
              </div>
            )}

            {step === 'preview' && (
              <div className="flex flex-col items-center">
                 <div className="w-[280px] h-[580px] bg-slate-950 rounded-[4rem] border-[12px] border-slate-900 shadow-2xl relative overflow-hidden flex flex-col scale-105">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-b-2xl z-20"></div>
                    
                    <div className={`flex-1 ${selectedTheme.bg} flex flex-col`}>
                       <header className="pt-10 px-6 pb-4 bg-white/80 backdrop-blur-md border-b border-slate-100 shrink-0">
                          <div className="flex justify-between items-center mb-6">
                            <i className="fa-solid fa-align-left text-slate-300 text-xs"></i>
                            <h1 className={`text-sm font-black uppercase italic tracking-tight ${selectedTheme.text}`}>{businessName || 'MY MENU'}</h1>
                            <i className="fa-solid fa-cart-shopping text-slate-300 text-xs"></i>
                          </div>
                          <div className="relative mb-4">
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[10px]"><i className="fa-solid fa-magnifying-glass"></i></div>
                             <div className="w-full h-8 bg-slate-50 rounded-xl border border-slate-100 text-[8px] flex items-center pl-8 text-slate-300 font-bold uppercase">Search food...</div>
                          </div>
                          <div className="flex gap-2 overflow-x-auto no-scrollbar">
                             <span className={`px-4 py-1.5 rounded-full ${selectedTheme.primary} text-white text-[7px] font-black uppercase shadow-lg shadow-indigo-50`}>All Items</span>
                             {categories.slice(0, 2).map(c => <span key={c.id} className="px-4 py-1.5 rounded-full bg-white border border-slate-50 text-slate-300 text-[7px] font-black uppercase shadow-sm whitespace-nowrap">{c.name}</span>)}
                          </div>
                       </header>

                       <div className="flex-1 p-5 space-y-4 overflow-y-auto no-scrollbar">
                          <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Special<br/><span className="text-orange-500">Choice.</span></h2>
                          <div className="grid grid-cols-1 gap-3">
                             {(menuItems.length > 0 ? menuItems.slice(0, 4) : [{id: 1, name: 'Premium Dish', price: 350}, {id: 2, name: 'Special Meal', price: 520}]).map((item: any) => (
                               <div key={item.id} className="bg-white p-3 rounded-2xl border border-slate-50 flex gap-4 shadow-sm animate-fade-in">
                                  <div className="w-14 h-14 bg-slate-50 rounded-xl shrink-0 overflow-hidden">
                                     {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><i className="fa-solid fa-image"></i></div>}
                                  </div>
                                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                                     <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-black text-[10px] uppercase truncate text-slate-800 mb-1 leading-none pr-2">{item.name}</h4>
                                        <span className="text-[10px] font-black text-indigo-600">₱{item.price}</span>
                                     </div>
                                     <div className="h-1.5 w-full bg-slate-50 rounded-full"></div>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="h-14 bg-white border-t border-slate-50 flex justify-around items-center px-6">
                          <i className="fa-solid fa-house text-indigo-600 text-sm"></i>
                          <i className="fa-solid fa-heart text-slate-200 text-sm"></i>
                          <i className="fa-solid fa-receipt text-slate-200 text-sm"></i>
                       </div>
                    </div>
                 </div>
                 {renderNoteCard("fa-mobile-screen", currentStepData.note)}
              </div>
            )}

            {step === 'account' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Master Email</label>
                  <input type="email" placeholder="owner@restaurant.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="w-full bg-slate-50 p-6 rounded-2xl font-bold text-sm outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" />
                </div>
                {renderNoteCard("fa-user-lock", currentStepData.note)}
              </div>
            )}

            {step === 'artifact' && (
              <div className="space-y-6">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl text-center space-y-8">
                   <p className="text-xs text-slate-500 font-medium leading-relaxed">Save your menu setup file. This is your backup. You need this file to restore your settings later.</p>
                   <button onClick={downloadConfig} className={`w-full py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all ${hasDownloaded ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white animate-pulse'}`}>
                      {hasDownloaded ? 'Backup Saved ✓' : 'Save Backup File'}
                   </button>
                </div>
                {renderNoteCard("fa-floppy-disk", currentStepData.note)}
              </div>
            )}

            {step === 'billing' && (
              <div className="space-y-8 animate-fade-in">
                 <div className="grid grid-cols-1 gap-5">
                    <button 
                      onClick={() => setSelectedPlan('6')}
                      className={`p-8 rounded-[3rem] text-left transition-all border-2 relative overflow-hidden group ${selectedPlan === '6' ? 'bg-slate-900 border-indigo-500 text-white shadow-2xl scale-105' : 'bg-white border-slate-100 text-slate-900 shadow-sm'}`}
                    >
                       <div className="relative z-10">
                          <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${selectedPlan === '6' ? 'text-indigo-400' : 'text-slate-400'}`}>6 Months Plan</p>
                          <h3 className="text-3xl font-black italic">₱3,500</h3>
                          <div className="mt-4 space-y-1">
                             <p className={`text-[10px] font-bold ${selectedPlan === '6' ? 'text-slate-400' : 'text-slate-500'}`}>153 business owner choose this</p>
                             <p className={`text-[9px] font-black uppercase tracking-widest ${selectedPlan === '6' ? 'text-indigo-300' : 'text-indigo-600'}`}>Renew 1k every year</p>
                          </div>
                       </div>
                       {selectedPlan === '6' && <i className="fa-solid fa-circle-check absolute top-8 right-8 text-indigo-500 text-xl"></i>}
                    </button>

                    <button 
                      onClick={() => setSelectedPlan('12')}
                      className={`p-8 rounded-[3rem] text-left transition-all border-2 relative overflow-hidden group ${selectedPlan === '12' ? 'bg-slate-900 border-indigo-500 text-white shadow-2xl scale-105' : 'bg-white border-slate-100 text-slate-900 shadow-sm'}`}
                    >
                       <div className="absolute top-4 right-8 bg-indigo-600 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg">Recommended</div>
                       <div className="relative z-10">
                          <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${selectedPlan === '12' ? 'text-indigo-400' : 'text-slate-400'}`}>12 Months Plan</p>
                          <h3 className="text-3xl font-black italic">₱6,000</h3>
                          <div className="mt-4 space-y-1">
                             <p className={`text-[10px] font-bold ${selectedPlan === '12' ? 'text-slate-400' : 'text-slate-500'}`}>778 business owner choose this</p>
                             <p className={`text-[9px] font-black uppercase tracking-widest ${selectedPlan === '12' ? 'text-indigo-300' : 'text-indigo-600'}`}>Renew 1k a year</p>
                          </div>
                       </div>
                       {selectedPlan === '12' && <i className="fa-solid fa-circle-check absolute top-8 right-8 text-indigo-500 text-xl"></i>}
                    </button>
                 </div>

                 <label className="flex items-center gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm cursor-pointer hover:border-indigo-200 transition-colors">
                    <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="w-5 h-5 rounded accent-indigo-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-600 leading-tight">I agree to the terms and conditions for my restaurant setup.</span>
                 </label>

                 <div className="space-y-4">
                    <button onClick={launchGmail} disabled={!agreedToTerms} className={`w-full py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl transition-all ${agreedToTerms ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
                       Finish and Open Gmail
                    </button>
                    <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest italic opacity-50">Note: This will open Gmail to book your appointment.</p>
                 </div>
                 {renderNoteCard("fa-credit-card", currentStepData.note)}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-8 max-w-xl mx-auto flex items-center justify-between bg-white/90 backdrop-blur-md border-t border-slate-50 z-50">
        <button onClick={() => { const prev = currentIndex - 1; if (prev >= 0) setStep(stepsList[prev]); else onCancel(); }} className="text-[10px] font-black uppercase text-slate-300 hover:text-slate-900 transition-colors italic">
          <i className="fa-solid fa-arrow-left mr-2"></i> Back
        </button>
        {step !== 'billing' && (
          <button onClick={() => setStep(stepsList[currentIndex + 1])} disabled={isNextDisabled} className={`px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all flex items-center gap-3 ${isNextDisabled ? 'bg-slate-50 text-slate-200' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
            Next Step <i className="fa-solid fa-arrow-right text-[8px]"></i>
          </button>
        )}
      </footer>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes scale { 0% { transform: scale(0.9); } 100% { transform: scale(1); } }
        .animate-scale { animation: scale(0.2s) ease-out forwards; }
      `}</style>
    </div>
  );
};

export default CreateMenuView;
