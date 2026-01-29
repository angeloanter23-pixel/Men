import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MenuItem, Category } from '../types';
import AdminMenu from './admin/AdminMenu';
import * as MenuService from '../services/menuService';

declare const QRious: any;

interface QRAsset { id: string; name: string; token: string; }

const QRPreviewCard: React.FC<{ asset: QRAsset; onDelete: (id: string) => void; }> = ({ asset, onDelete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const productionBase = "https://men-brown.vercel.app/";
  const finalUrl = `${productionBase}${asset.token}`;
  useEffect(() => { if (canvasRef.current && typeof QRious !== 'undefined') { new QRious({ element: canvasRef.current, size: 100, value: finalUrl, level: 'H', foreground: '#0f172a' }); } }, [finalUrl]);
  return (
    <div className="relative bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center animate-fade-in">
      <p className="text-[10px] font-black uppercase text-slate-800 truncate mb-1">{asset.name}</p>
      <div className="bg-slate-50 p-2 rounded-2xl border border-slate-50 mb-4"><canvas ref={canvasRef}></canvas></div>
      <button onClick={() => onDelete(asset.id)} className="w-full h-10 bg-slate-50 text-slate-300 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can text-xs"></i></button>
    </div>
  );
};

type WizardStep = 'info' | 'codes' | 'dishes' | 'design' | 'preview' | 'account' | 'artifact' | 'billing';

const STEPS_CONFIG: { id: WizardStep; label: string; sub: string; desc: string; }[] = [
  { id: 'info', label: 'Identity', sub: 'Step 01', desc: 'Enter the official name of your restaurant.' },
  { id: 'codes', label: 'Deployment', sub: 'Step 02', desc: 'Create unique codes for your tables.' },
  { id: 'dishes', label: 'Inventory', sub: 'Step 03', desc: 'Build your list of food and drinks.' },
  { id: 'design', label: 'Styling', sub: 'Step 04', desc: 'Pick a look that matches your restaurant brand.' },
  { id: 'preview', label: 'Verification', sub: 'Step 05', desc: 'See exactly how your menu looks.' },
  { id: 'account', label: 'Administration', sub: 'Step 06', desc: 'Enter your business email.' },
  { id: 'artifact', label: 'Preservation', sub: 'Step 07', desc: 'Download your menu artifact.' },
  { id: 'billing', label: 'Initialization', sub: 'Step 08', desc: 'Choose a plan and initialize.' }
];

const CreateMenuView: React.FC<{ onCancel: () => void; onComplete: (config: any) => void; }> = ({ onCancel, onComplete }) => {
  const [step, setStep] = useState<WizardStep>('info');
  const [businessName, setBusinessName] = useState('');
  const [isNameVerified, setIsNameVerified] = useState(false);
  const [qrAssets, setQrAssets] = useState<QRAsset[]>([]);
  const [qrMode, setQrMode] = useState<'single' | 'bulk'>('single');
  const [qrBaseName, setQrBaseName] = useState('Table ');
  const [qrBulkCount, setQrBulkCount] = useState(5);
  const [categories, setCategories] = useState<Category[]>([{ id: 1, name: 'Main Course' }, { id: 2, name: 'Beverages' }]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const handleGenerateQRs = () => {
    if (qrMode === 'single') { setQrAssets([{ id: Math.random().toString(36).substr(2,9), name: qrBaseName.trim() || 'Table', token: Math.random().toString(36).substr(2,6).toUpperCase() }, ...qrAssets]); }
    else { const newA = []; for(let i=1; i<=Math.min(qrBulkCount, 50); i++) { newA.push({ id: Math.random().toString(36).substr(2,9), name: `${qrBaseName}${i}`, token: Math.random().toString(36).substr(2,6).toUpperCase() }); } setQrAssets([...newA, ...qrAssets]); }
  };

  const downloadConfig = () => {
    const config = { business: { name: businessName, qrAssets }, menu: { categories, items: menuItems }, user: { email: userEmail } };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${businessName.replace(/\s+/g, '_')}_setup.json`; a.click(); setHasDownloaded(true);
  };

  const curData = STEPS_CONFIG.find(s => s.id === step)!;
  const idx = STEPS_CONFIG.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col font-jakarta">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-[100] border-b border-slate-100 shadow-sm px-6 py-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
           <button onClick={onCancel} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 transition-all hover:text-rose-500"><i className="fa-solid fa-xmark"></i></button>
           <div className="flex gap-2">{STEPS_CONFIG.map((s, i) => (<div key={s.id} className={`h-1.5 rounded-full transition-all duration-500 ${step === s.id ? 'bg-indigo-600 w-10' : i < idx ? 'bg-indigo-200 w-4' : 'bg-slate-100 w-2'}`} />))}</div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 no-scrollbar pb-40">
        <div className="max-w-md mx-auto">
          <div className="mb-12 px-2 animate-fade-in">
             <div className="flex items-center gap-3 mb-4"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{curData.sub}</p></div>
             <h2 className="text-4xl font-black italic tracking-tighter uppercase text-slate-900 mb-4">{curData.label.split(' ')[0]} <span className="text-indigo-600">{curData.label.split(' ').slice(1).join(' ')}</span></h2>
             <p className="text-sm text-slate-500 font-medium leading-relaxed italic">{curData.desc}</p>
          </div>

          <div className="transition-all duration-500">
            {step === 'info' && (
              <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl space-y-6">
                <input type="text" placeholder="e.g. Sharp Bistro" value={businessName} onChange={e => {setBusinessName(e.target.value); setIsNameVerified(false);}} className={`w-full p-7 bg-slate-50 rounded-3xl font-black text-xl outline-none border-2 transition-all ${isNameVerified ? 'border-emerald-400' : 'border-transparent'}`} />
                <button onClick={async () => { const ex = await MenuService.checkBusinessNameExists(businessName); if(!ex) setIsNameVerified(true); else alert("Name Taken."); }} className={`w-full py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] transition-all ${isNameVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white shadow-xl'}`}>{isNameVerified ? 'Verified ✓' : 'Check Availability'}</button>
              </div>
            )}
            {step === 'codes' && (
              <div className="space-y-8">
                <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl space-y-6">
                   <div className="bg-slate-100 p-2 rounded-3xl flex border border-slate-100"><button onClick={() => setQrMode('single')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${qrMode === 'single' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Single</button><button onClick={() => setQrMode('bulk')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${qrMode === 'bulk' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Bulk</button></div>
                   <input type="text" value={qrBaseName} onChange={e => setQrBaseName(e.target.value)} placeholder="Table Name" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-sm outline-none" />
                   {qrMode === 'bulk' && <input type="number" value={qrBulkCount} onChange={e => setQrBulkCount(Number(e.target.value))} className="w-full p-6 bg-slate-50 rounded-3xl font-black text-sm outline-none" />}
                   <button onClick={handleGenerateQRs} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl">Initialize Tokens</button>
                </div>
                <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto no-scrollbar">{qrAssets.map(a => (<QRPreviewCard key={a.id} asset={a} onDelete={id => setQrAssets(qrAssets.filter(q => q.id !== id))} />))}</div>
              </div>
            )}
            {step === 'dishes' && <AdminMenu items={menuItems} setItems={setMenuItems as any} cats={categories} setCats={setCategories as any} isWizard={true} />}
            {step === 'design' && ( <div className="space-y-4">{['Modern', 'Elegant', 'Clean', 'Minimal'].map(t => ( <button key={t} className="w-full p-8 bg-white rounded-[3rem] border border-slate-100 flex items-center justify-between group shadow-sm hover:shadow-xl transition-all"><span className="font-black uppercase italic tracking-tighter text-slate-800">{t} Look</span><i className="fa-solid fa-chevron-right text-slate-100 group-hover:text-indigo-600"></i></button> ))}</div> )}
            {step === 'account' && ( <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl space-y-6"><input type="email" placeholder="owner@business.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="w-full bg-slate-50 p-7 rounded-3xl font-black text-lg outline-none italic" /></div> )}
            {step === 'artifact' && ( <div className="bg-white p-14 rounded-[4rem] border border-slate-100 shadow-2xl text-center space-y-8"><p className="text-sm text-slate-400 font-medium italic">Preserve your ecosystem configuration to finalize cloud sync.</p><button onClick={downloadConfig} className={`w-full py-7 rounded-[3rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl transition-all ${hasDownloaded ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white animate-pulse'}`}>{hasDownloaded ? 'Artifact Saved ✓' : 'Save Backup Artifact'}</button></div> )}
            {step === 'billing' && ( <div className="space-y-6"><div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl border-4 border-indigo-600/30"><p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-4">Enterprise Full Plan</p><h3 className="text-5xl font-black italic tracking-tighter">₱6,000</h3><p className="text-xs text-slate-400 mt-6 font-medium italic">Initialize your digital deployment today.</p></div><button onClick={() => onComplete({})} className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl shadow-indigo-100 active:scale-95 transition-all">Finish Initialization</button></div> )}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-8 max-w-xl mx-auto flex items-center justify-between bg-white/80 backdrop-blur-xl border-t border-slate-50 z-50">
        <button onClick={() => { if(idx>0) setStep(STEPS_CONFIG[idx-1].id); else onCancel(); }} className="text-[11px] font-black uppercase text-slate-300 hover:text-slate-900 italic"><i className="fa-solid fa-arrow-left mr-2"></i> Back</button>
        {step !== 'billing' && ( <button onClick={() => setStep(STEPS_CONFIG[idx+1].id)} disabled={ (step==='info' && !isNameVerified) || (step==='artifact' && !hasDownloaded) } className="px-12 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl disabled:opacity-20 active:scale-95 transition-all">Next Module</button> )}
      </footer>
    </div>
  );
};

export default CreateMenuView;