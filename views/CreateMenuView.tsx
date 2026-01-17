
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MenuItem, Category } from '../types';
import AdminMenu from './admin/AdminMenu';

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
  businessName: string;
  isSelected: boolean;
  selectionMode: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const QRPreviewCard: React.FC<QRPreviewCardProps> = ({ 
  asset, businessName, isSelected, selectionMode, onSelect, onDelete 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<number | null>(null);
  const finalUrl = `mymenu.ph/${businessName.toLowerCase().replace(/\s+/g, '')}/${asset.name.toLowerCase().replace(/\s+/g, '')}?k=${asset.token}`;

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

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.href = canvasRef.current.toDataURL("image/png");
      link.download = `${asset.name}-QR.png`;
      link.click();
    }
  };

  const handleLongPressStart = () => {
    timerRef.current = window.setTimeout(() => {
      onSelect(asset.id);
    }, 600);
  };

  const handleLongPressEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div 
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onClick={() => selectionMode && onSelect(asset.id)}
      className={`relative bg-white p-4 rounded-3xl border transition-all flex flex-col items-center group ${isSelected ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-100 shadow-sm hover:border-indigo-200'}`}
    >
      {selectionMode && (
        <div className="absolute top-3 left-3 w-5 h-5 rounded-full border-2 border-indigo-200 flex items-center justify-center bg-white">
          {isSelected && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-scale"></div>}
        </div>
      )}
      
      <div className="w-full text-center mb-2">
        <p className="text-[9px] font-black uppercase text-slate-800 truncate">{asset.name}</p>
        <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">ID: {asset.token}</p>
      </div>

      <div className="bg-slate-50 p-2 rounded-2xl border border-slate-50 group-hover:bg-white transition-colors mb-3">
        <canvas ref={canvasRef}></canvas>
      </div>

      <div className="flex gap-2 w-full">
        <button 
          onClick={handleDownload}
          className="flex-1 bg-slate-50 text-slate-400 py-2 rounded-xl text-[8px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all border border-slate-100"
        >
          <i className="fa-solid fa-download"></i>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(asset.id); }}
          className="w-8 h-8 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-slate-100"
        >
          <i className="fa-solid fa-trash-can text-[10px]"></i>
        </button>
      </div>
    </div>
  );
};

interface CreateMenuViewProps {
  onCancel: () => void;
  onComplete: (config: any) => void;
}

type WizardStep = 'info' | 'branches' | 'codes' | 'dishes' | 'design' | 'preview' | 'finish';

interface Theme {
  id: string;
  name: string;
  primary: string;
  bg: string;
  text: string;
}

const THEMES: Theme[] = [
  { id: 'classic', name: 'Sharp Orange', primary: 'bg-orange-500', bg: 'bg-[#fcfdfe]', text: 'text-orange-600' },
  { id: 'midnight', name: 'Deep Indigo', primary: 'bg-indigo-600', bg: 'bg-[#f8fafc]', text: 'text-indigo-600' },
  { id: 'forest', name: 'Sage Green', primary: 'bg-emerald-600', bg: 'bg-[#f7faf9]', text: 'text-emerald-700' },
  { id: 'velvet', name: 'Ruby Wine', primary: 'bg-rose-600', bg: 'bg-[#fffafd]', text: 'text-rose-600' },
  { id: 'noir', name: 'Minimalist', primary: 'bg-slate-900', bg: 'bg-white', text: 'text-slate-900' }
];

const FONTS = [
  { id: 'font-jakarta', name: 'Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif" },
  { id: 'font-playfair', name: 'Playfair Serif', family: "'Playfair Display', serif" },
  { id: 'font-montserrat', name: 'Montserrat', family: "'Montserrat', sans-serif" },
  { id: 'font-outfit', name: 'Outfit Soft', family: "'Outfit', sans-serif" }
];

const CreateMenuView: React.FC<CreateMenuViewProps> = ({ onCancel, onComplete }) => {
  const [step, setStep] = useState<WizardStep>('info');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for Step 1: Info
  const [businessName, setBusinessName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  
  // State for Step 2: Branches
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchSubView, setBranchSubView] = useState<'list' | 'create'>('list');
  const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);
  
  // State for Step 3: QR Codes
  const [qrAssets, setQrAssets] = useState<QRAsset[]>([]);
  const [qrMode, setQrMode] = useState<'single' | 'bulk'>('single');
  const [qrBaseName, setQrBaseName] = useState('Table ');
  const [qrBulkCount, setQrBulkCount] = useState(5);
  const [selectedQrIds, setSelectedQrIds] = useState<Set<string>>(new Set());

  // State for Step 4: Dishes
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: 'Main Course' },
    { id: 2, name: 'Beverages' }
  ]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // State for Step 5: Design
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);

  // State for Step 7: Finish
  const [userEmail, setUserEmail] = useState('');
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (le) => setLogo(le.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target?.result as string);
        
        // Populate Step 1: Info
        if (config.business) {
          setBusinessName(config.business.name || '');
          setLogo(config.business.logo || null);
          setBranches(config.business.branches || []);
          setQrAssets(config.business.qrAssets || []);
        }

        // Populate Step 4: Menu
        if (config.menu) {
          setCategories(config.menu.categories || []);
          setMenuItems(config.menu.items || []);
        }

        // Populate Step 5: Design
        if (config.design) {
          const matchedTheme = THEMES.find(t => t.id === config.design.theme);
          if (matchedTheme) setSelectedTheme(matchedTheme);
          
          const matchedFont = FONTS.find(f => f.id === config.design.font);
          if (matchedFont) setSelectedFont(matchedFont);
        }

        alert("Configuration loaded successfully.");
      } catch (err) {
        alert("Failed to parse configuration JSON.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const generateToken = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateQRs = () => {
    const qty = qrMode === 'single' ? 1 : Math.min(qrBulkCount, 50);
    const newAssets: QRAsset[] = [];
    for (let i = 1; i <= qty; i++) {
      newAssets.push({
        id: Math.random().toString(36).substr(2, 9),
        name: qrMode === 'single' ? qrBaseName : `${qrBaseName}${i}`,
        token: generateToken()
      });
    }
    setQrAssets(prev => [...newAssets, ...prev]);
  };

  const toggleQrSelection = (id: string) => {
    setSelectedQrIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteSelectedQrs = () => {
    setQrAssets(prev => prev.filter(asset => !selectedQrIds.has(asset.id)));
    setSelectedQrIds(new Set());
  };

  const saveBranch = () => {
    if (!editingBranch?.name) return alert("Branch name is required.");
    if (branches.length >= 5 && !editingBranch.id) return alert("Branch limit of 5 reached for this plan.");

    if (editingBranch.id) {
      setBranches(prev => prev.map(b => b.id === editingBranch.id ? editingBranch as Branch : b));
    } else {
      const newBranch: Branch = {
        id: Math.random().toString(36).substr(2, 9),
        name: editingBranch.name,
        image_url: editingBranch.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400',
        subdomain: editingBranch.subdomain || editingBranch.name.toLowerCase().replace(/\s+/g, '-')
      };
      setBranches(prev => [...prev, newBranch]);
    }
    setEditingBranch(null);
    setBranchSubView('list');
  };

  const fullConfigObj = useMemo(() => {
    return {
      business: { name: businessName, logo, branches, qrAssets },
      menu: { categories, items: menuItems },
      design: { theme: selectedTheme.id, font: selectedFont.id },
      user: { email: userEmail }
    };
  }, [businessName, logo, branches, qrAssets, categories, menuItems, selectedTheme, selectedFont, userEmail]);

  const configJson = useMemo(() => JSON.stringify(fullConfigObj, null, 2), [fullConfigObj]);

  const downloadConfig = () => {
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName.replace(/\s+/g, '_')}_config.json`;
    a.click();
    setHasDownloaded(true);
  };

  const renderInfoStep = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="space-y-1">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Name</label>
            <span className="text-[8px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">add branch limit to 5</span>
          </div>
          <input 
            type="text" 
            placeholder="e.g. Steakhouse Prime" 
            value={businessName} 
            onChange={e => setBusinessName(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 ring-indigo-500/10 transition-all border border-transparent"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Brand Logo</label>
          <div className="relative group">
            <input type="file" id="logo-up" className="hidden" onChange={handleLogoUpload} />
            <button 
              onClick={() => document.getElementById('logo-up')?.click()}
              className="w-full bg-slate-50 border border-dashed border-slate-200 py-8 rounded-2xl flex flex-col items-center gap-2 group-hover:border-indigo-400 transition-colors"
            >
              {logo ? (
                <img src={logo} className="h-16 w-16 object-contain rounded-xl shadow-sm" alt="Logo" />
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up text-xl text-slate-300"></i>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Click to upload</p>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBranchesStep = () => (
    <div className="space-y-8 animate-fade-in">
      {/* 2 Nav Sub-Navigation */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <button 
          onClick={() => setBranchSubView('list')} 
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${branchSubView === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
        >
          Branch List
        </button>
        <button 
          onClick={() => { setEditingBranch({}); setBranchSubView('create'); }} 
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${branchSubView === 'create' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
        >
          Create Branch
        </button>
      </div>

      {branchSubView === 'create' ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Branch Name</label>
            <input 
              type="text" 
              value={editingBranch?.name || ''} 
              onChange={e => setEditingBranch({...editingBranch, name: e.target.value})}
              placeholder="e.g. Makati Branch" 
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border border-transparent focus:ring-2 ring-indigo-500/10 transition-all" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Image URL</label>
            <input 
              type="text" 
              value={editingBranch?.image_url || ''} 
              onChange={e => setEditingBranch({...editingBranch, image_url: e.target.value})}
              placeholder="https://images.unsplash..." 
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border border-transparent focus:ring-2 ring-indigo-500/10 transition-all" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Subdomain / Slug</label>
            <input 
              type="text" 
              value={editingBranch?.subdomain || ''} 
              onChange={e => setEditingBranch({...editingBranch, subdomain: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
              placeholder="e.g. branch-name" 
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border border-transparent focus:ring-2 ring-indigo-500/10 transition-all" 
            />
          </div>
          <button 
            onClick={saveBranch} 
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95"
          >
            {editingBranch?.id ? 'Update Branch' : 'Commit Branch'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Live Territories ({branches.length}/5)</h4>
          </div>
          {branches.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white">
              <i className="fa-solid fa-map-location-dot text-3xl text-slate-100 mb-3"></i>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">No branches deployed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {branches.map(branch => (
                <div key={branch.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm group">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 shrink-0">
                    <img src={branch.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={branch.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-black text-xs text-slate-800 uppercase truncate">{branch.name}</h5>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{branch.subdomain}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingBranch(branch); setBranchSubView('create'); }} className="p-3 text-indigo-400 hover:bg-indigo-50 rounded-xl transition-all"><i className="fa-solid fa-pen"></i></button>
                    <button onClick={() => setBranches(prev => prev.filter(b => b.id !== branch.id))} className="p-3 text-rose-400 hover:bg-rose-50 rounded-xl transition-all"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderQRStep = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="text-center">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Entry Codes</p>
          <h4 className="text-xl font-black text-slate-900 uppercase italic">QR Generator</h4>
        </div>

        <div className="bg-slate-50 p-1 rounded-xl flex border border-slate-100">
          <button onClick={() => setQrMode('single')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${qrMode === 'single' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Single</button>
          <button onClick={() => setQrMode('bulk')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${qrMode === 'bulk' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Bulk</button>
        </div>

        <div className="space-y-4">
          <input type="text" value={qrBaseName} onChange={(e) => setQrBaseName(e.target.value)} placeholder="Label (e.g. Table)" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border border-transparent focus:ring-2 ring-indigo-500/10 transition-all" />
          {qrMode === 'bulk' && <input type="number" value={qrBulkCount} onChange={(e) => setQrBulkCount(Number(e.target.value))} min="1" max="50" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border border-transparent" />}
          <button onClick={handleGenerateQRs} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95">Generate Now</button>
        </div>
      </div>

      {qrAssets.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center px-2">
            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Active Access Points</h5>
            {selectedQrIds.size > 0 ? (
              <button onClick={deleteSelectedQrs} className="text-rose-500 text-[10px] font-black uppercase animate-pulse">Purge Selected ({selectedQrIds.size})</button>
            ) : (
              <p className="text-[8px] font-bold text-slate-300 uppercase">Long press to select</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto no-scrollbar pb-10">
            {qrAssets.map((asset) => (
              <QRPreviewCard 
                key={asset.id} 
                asset={asset} 
                businessName={businessName || 'foodie'} 
                isSelected={selectedQrIds.has(asset.id)}
                selectionMode={selectedQrIds.size > 0}
                onSelect={toggleQrSelection}
                onDelete={(id) => setQrAssets(prev => prev.filter(a => a.id !== id))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderDesignStep = () => (
    <div className="space-y-10 animate-fade-in">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
        <div className="space-y-6">
          <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 italic">Select Premium Theme</h5>
          <div className="grid grid-cols-1 gap-3">
            {THEMES.map(theme => (
              <button 
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedTheme.id === theme.id ? 'bg-slate-50 border-indigo-500 ring-2 ring-indigo-50' : 'bg-white border-slate-100'}`}
              >
                <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-full ${theme.primary} border-4 border-white shadow-sm`}></div>
                   <span className="text-xs font-black text-slate-800 uppercase italic tracking-tighter">{theme.name}</span>
                </div>
                {selectedTheme.id === theme.id && <i className="fa-solid fa-circle-check text-indigo-500"></i>}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 italic">Select Typography</h5>
          <div className="grid grid-cols-2 gap-3">
            {FONTS.map(font => (
              <button 
                key={font.id}
                onClick={() => setSelectedFont(font)}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all ${selectedFont.id === font.id ? 'bg-indigo-50 border-indigo-500' : 'bg-slate-50 border-slate-100'}`}
                style={{ fontFamily: font.family }}
              >
                <span className="text-lg mb-1">Aa</span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{font.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6 animate-fade-in flex flex-col items-center">
      <div className="text-center">
        <h3 className="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-1">Mobile Render</h3>
        <p className="text-xs font-bold text-slate-400 mb-6 italic">Live Menu Simulation</p>
      </div>
      <div className="relative w-[260px] h-[520px] bg-slate-800 border-[8px] border-slate-900 rounded-[3rem] shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-b-xl z-50"></div>
        <div className={`h-full w-full ${selectedTheme.bg} flex flex-col ${selectedFont.id}`}>
           <header className="px-5 pt-8 pb-4 flex items-center justify-between border-b border-black/5">
              <span className={`text-[12px] font-black uppercase italic tracking-tighter ${selectedTheme.text}`}>{businessName || 'FOODIE.'}</span>
              <div className="w-8 h-8 flex items-center justify-center bg-black/5 rounded-xl"><i className="fa-solid fa-cart-shopping text-[11px] opacity-40"></i></div>
           </header>
           <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-6 space-y-6">
              <h4 className="text-xl font-black text-slate-900 leading-none">Choose your <br /><span className={`${selectedTheme.text.replace('text-', 'text-opacity-80 text-')}`}>{categories[0]?.name || 'Dish'}</span></h4>
              
              <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                {categories.map((c, i) => (
                  <div key={c.id} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest whitespace-nowrap border ${i === 0 ? `${selectedTheme.primary} text-white border-transparent shadow-sm` : 'bg-white text-slate-400 border-black/5'}`}>{c.name}</div>
                ))}
              </div>

              <div className="space-y-4 pb-12">
                {(menuItems.length > 0 ? menuItems : [1,2,3]).map((it: any) => (
                  <div key={typeof it === 'number' ? it : it.id} className="bg-white p-3 rounded-3xl border border-black/5 flex gap-4 shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden shrink-0">
                      {it.image_url ? <img src={it.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100"></div>}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-black text-slate-800 truncate pr-2">{it.name || 'Sample Item'}</span><span className={`text-[10px] font-black ${selectedTheme.text}`}>₱{it.price || '0.00'}</span></div>
                      <div className="h-1 w-full bg-black/5 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
           </div>
           <footer className="h-14 bg-white/80 backdrop-blur-md border-t border-black/5 flex items-center justify-around px-8">
              <i className={`fa-solid fa-house text-[12px] ${selectedTheme.text}`}></i>
              <i className="fa-solid fa-users text-slate-200 text-[12px]"></i>
              <i className="fa-solid fa-receipt text-slate-200 text-[12px]"></i>
           </footer>
        </div>
      </div>
    </div>
  );

  const renderFinishStep = () => (
    <div className="space-y-8 animate-fade-in">
       <div className="bg-slate-900 p-8 rounded-[3rem] shadow-xl overflow-hidden relative">
          <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4 italic">Step 1: Security & Identity</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-indigo-300 ml-2">Main Email (Signup & Recovery)</label>
              <input 
                type="email" 
                placeholder="Required for account activation..."
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white text-sm font-bold outline-none focus:ring-4 ring-indigo-500/20"
              />
            </div>
            <p className="text-[8px] text-slate-500 uppercase tracking-widest italic">Note: This will be your primary identity for enterprise sign-in and recovery. Do not lose access to this email.</p>
          </div>
       </div>

       <div className="bg-white p-8 rounded-[3rem] border-4 border-orange-500/10 shadow-sm space-y-6 relative overflow-hidden">
          {!hasDownloaded && (
            <div className="absolute top-4 right-8 w-4 h-4 bg-orange-500 rounded-full animate-ping"></div>
          )}
          <h4 className="text-[10px] font-black uppercase text-orange-500 tracking-widest italic">Step 2: Mandatory Backup</h4>
          <p className="text-xs font-bold text-slate-500 leading-relaxed">You MUST download your configuration progress now. If you lose this file, your current menu setup cannot be recovered during the verification process.</p>
          <button 
            onClick={downloadConfig} 
            className={`w-full py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 ${hasDownloaded ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white animate-pulse'}`}
          >
            {hasDownloaded ? <><i className="fa-solid fa-check-circle mr-2"></i> Progress Secured</> : 'Download & Secure Progress (JSON)'}
          </button>
       </div>

       <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[3rem] shadow-sm space-y-6">
          <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest italic">Step 3: Verification</h4>
          <p className="text-xs font-bold text-slate-600 leading-relaxed">Final Activation Directive:</p>
          <div className="bg-white p-6 rounded-2xl border border-indigo-200">
             <p className="text-[11px] font-black text-slate-800 uppercase italic mb-3">Next Action Required:</p>
             <p className="text-xs font-medium text-slate-500 mb-6">Forward your downloaded configuration or message us directly at <span className="text-indigo-600 font-bold">geloelolo@gmail.com</span> to activate your enterprise plan and deploy to live servers.</p>
             <a 
              href={`mailto:geloelolo@gmail.com?subject=Enterprise Menu Activation: ${businessName}&body=Hi, I would like to activate my menu for ${businessName}. My registered email is ${userEmail}. [Attached Config Required]`}
              className="w-full inline-flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
             >
               <i className="fa-solid fa-envelope"></i> Message via Gmail
             </a>
          </div>
       </div>

       <div className="pt-6">
          <button 
            disabled={!hasDownloaded || !userEmail}
            onClick={() => onComplete(fullConfigObj)} 
            className={`w-full py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all ${(!hasDownloaded || !userEmail) ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50' : 'bg-slate-900 text-white hover:bg-black active:scale-95'}`}
          >
            Activate Plan & Finalize
          </button>
       </div>
    </div>
  );

  const stepsList: WizardStep[] = ['info', 'branches', 'codes', 'dishes', 'design', 'preview', 'finish'];
  const currentIndex = stepsList.indexOf(step);

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col font-['Plus_Jakarta_Sans']">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
           <button onClick={onCancel} className="p-2 text-slate-300 hover:text-rose-500"><i className="fa-solid fa-xmark"></i></button>
           <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-900">{step}</h2>
              <div className="flex gap-1 mt-1">
                 {stepsList.map((s, i) => (
                   <div key={s} className={`h-1 w-4 rounded-full transition-all duration-300 ${step === s ? 'bg-indigo-600 w-6' : i < currentIndex ? 'bg-indigo-200' : 'bg-slate-100'}`}></div>
                 ))}
              </div>
           </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Import JSON Icon */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={handleImportJson} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            title="Load JSON Config"
            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <i className="fa-solid fa-file-import"></i>
          </button>
          <button onClick={() => { const nextIdx = currentIndex + 1; if (nextIdx < stepsList.length) setStep(stepsList[nextIdx]); }} className={`text-[10px] font-black uppercase text-indigo-600 ${step === 'finish' ? 'opacity-0' : 'opacity-100'}`}>Next Step</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
        <div className="max-w-md mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none italic mb-2">Initialize your <br /><span className="text-orange-500">Menu Space.</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Onboarding Flow</p>
          </div>

          {step === 'info' && renderInfoStep()}
          {step === 'branches' && renderBranchesStep()}
          {step === 'codes' && renderQRStep()}
          {step === 'dishes' && <div className="animate-fade-in scale-95 origin-top"><AdminMenu items={menuItems} setItems={setMenuItems as any} cats={categories} setCats={setCategories as any} isWizard={true} /></div>}
          {step === 'design' && renderDesignStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'finish' && renderFinishStep()}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 max-w-xl mx-auto flex justify-between items-center z-40">
         <button onClick={() => { const prevIdx = currentIndex - 1; if (prevIdx >= 0) setStep(stepsList[prevIdx]); else onCancel(); }} className="text-[10px] font-black uppercase text-slate-300 hover:text-slate-900">Back</button>
         <button onClick={() => { const nextIdx = currentIndex + 1; if (nextIdx < stepsList.length) setStep(stepsList[nextIdx]); }} className="text-[10px] font-black uppercase text-indigo-600">{step === 'finish' ? '' : 'Skip Step →'}</button>
      </div>
      <style>{`
        @keyframes scale { 0% { transform: scale(0.5); } 100% { transform: scale(1); } }
        .animate-scale { animation: scale 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

export default CreateMenuView;
