
import React, { useState, useEffect, useRef } from 'react';
import * as MenuService from '../../services/menuService';

// Declare QRious globally as it's loaded from CDN
declare const QRious: any;

interface QRAsset {
  id: string;
  label: string;
  code: string;
  restaurant_id: string;
}

const QRBlock: React.FC<{ 
  asset: QRAsset; 
  onDelete: (id: string) => void;
  onUpdate: (id: string, label: string, code: string) => void;
}> = ({ asset, onDelete, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localLabel, setLocalLabel] = useState(asset.label);
  const [localCode, setLocalCode] = useState(asset.code);
  const [isCopied, setIsCopied] = useState(false);

  const businessName = localStorage.getItem('foodie_business_name') || 'foodie';
  
  // Real URL Generation based on current hosting environment
  const currentOrigin = window.location.origin;
  const currentPath = window.location.pathname;
  const slugify = (text: string) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
  
  const finalUrl = `${currentOrigin}${currentPath}#/${slugify(businessName)}/${slugify(localLabel)}?k=${localCode}`;

  useEffect(() => {
    if (canvasRef.current && typeof QRious !== 'undefined') {
      new QRious({
        element: canvasRef.current,
        size: 180,
        value: finalUrl,
        level: 'H',
        foreground: '#0f172a'
      });
    }
  }, [finalUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(finalUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.href = canvasRef.current.toDataURL("image/png");
      link.download = `${localLabel}-QR.png`;
      link.click();
    }
  };

  const handleSyncUpdate = () => {
    if (localLabel !== asset.label || localCode !== asset.code) {
        onUpdate(asset.id, localLabel, localCode);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-500 relative overflow-hidden group animate-fade-in">
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[4rem] -translate-y-4 translate-x-4 group-hover:bg-indigo-50 transition-colors"></div>
      
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className="flex-1 pr-4">
          <input 
            type="text" 
            value={localLabel} 
            onBlur={handleSyncUpdate}
            onChange={(e) => setLocalLabel(e.target.value)}
            className="text-xl font-black uppercase italic tracking-tighter text-indigo-600 bg-transparent border-b-2 border-transparent hover:border-indigo-100 focus:border-indigo-600 outline-none transition-all w-full mb-1" 
            placeholder="Label..." 
          />
          <div className="flex items-center text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">
            <span className="opacity-40 mr-2">TOKEN:</span>
            <input 
              type="text" 
              value={localCode} 
              onBlur={handleSyncUpdate}
              onChange={(e) => setLocalCode(e.target.value)}
              className="bg-slate-50 px-3 py-1 rounded-lg text-slate-900 border border-slate-100 outline-none focus:ring-2 ring-indigo-500/10 w-24" 
              placeholder="Key" 
            />
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={handleDownload} className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm"><i className="fa-solid fa-download text-sm"></i></button>
            <button onClick={() => onDelete(asset.id)} className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><i className="fa-solid fa-trash-can text-sm"></i></button>
        </div>
      </div>

      <div className="flex flex-col items-center py-10 bg-slate-50/50 rounded-[2.5rem] mb-8 border border-slate-100 shadow-inner group-hover:bg-white transition-all">
        <div className="bg-white p-4 rounded-3xl shadow-lg shadow-slate-200/50">
          <canvas ref={canvasRef}></canvas>
        </div>
        <div className="mt-6 w-full px-8">
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1 text-center">Real Production URL</p>
           <p className="text-[8px] font-bold text-slate-400 break-all text-center opacity-60 leading-tight">
             {finalUrl}
           </p>
        </div>
      </div>

      <button 
        onClick={handleCopy}
        className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative z-10 ${isCopied ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-200'}`}
      >
        {isCopied ? 'URL SECURED TO CLIPBOARD' : 'Copy Digital Link'}
      </button>
    </div>
  );
};

const AdminQR: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gen' | 'saved'>('gen');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [baseName, setBaseName] = useState('Table ');
  const [manualToken, setManualToken] = useState('');
  const [bulkCount, setBulkCount] = useState(5);
  const [savedQrs, setSavedQrs] = useState<QRAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

  useEffect(() => {
    if (restaurantId && restaurantId !== "undefined") {
      fetchQRCodes();
    }
  }, [restaurantId]);

  const fetchQRCodes = async () => {
    if (!restaurantId || restaurantId === "undefined") return;
    setLoading(true);
    try {
      const data = await MenuService.getQRCodes(restaurantId);
      setSavedQrs(data);
    } catch (err) {
      console.error("Failed to fetch QR codes", err);
    } finally {
      setLoading(false);
    }
  };

  const generateToken = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerate = async () => {
    if (!restaurantId || restaurantId === "undefined") return alert("System context missing. Please re-login.");
    
    setLoading(true);
    try {
      if (mode === 'single') {
        await MenuService.upsertQRCode({
          restaurant_id: restaurantId,
          label: baseName,
          code: manualToken || generateToken(),
          type: 'menu'
        });
        setManualToken('');
      } else {
        const qty = Math.min(bulkCount, 50);
        for (let i = 1; i <= qty; i++) {
          await MenuService.upsertQRCode({
            restaurant_id: restaurantId,
            label: `${baseName}${i}`,
            code: generateToken(),
            type: 'menu'
          });
        }
      }
      await fetchQRCodes();
      setActiveTab('saved');
    } catch (err) {
      alert("Deployment failed. Token codes must be unique.");
    } finally {
      setLoading(false);
    }
  };

  const deleteQr = async (id: string) => {
    if (confirm('Permanently purge this entry code from the vault?')) {
      try {
        await MenuService.deleteQRCode(id);
        setSavedQrs(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        alert("Delete operation failed.");
      }
    }
  };

  const updateQr = async (id: string, label: string, code: string) => {
    try {
      await MenuService.upsertQRCode({ id, label, code, restaurant_id: restaurantId });
      setSavedQrs(prev => prev.map(q => q.id === id ? { ...q, label, code } : q));
    } catch (err) {
      console.error("Update sync failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/30 pb-32 animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40 mb-10 shadow-sm">
        <div className="max-w-xl mx-auto flex justify-around">
          <button onClick={() => setActiveTab('gen')} className={`py-6 text-[10px] font-black uppercase tracking-[0.4em] transition-all relative ${activeTab === 'gen' ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-600'}`}>Deploy Node{activeTab === 'gen' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></div>}</button>
          <button onClick={() => setActiveTab('saved')} className={`py-6 text-[10px] font-black uppercase tracking-[0.4em] transition-all relative ${activeTab === 'saved' ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-600'}`}>Saved Vault ({savedQrs.length}){activeTab === 'saved' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></div>}</button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6">
        {activeTab === 'gen' ? (
          <section className="space-y-10">
            <header className="text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl animate-float"><i className="fa-solid fa-qrcode text-3xl"></i></div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-900">SHARP<span className="text-indigo-600">QR</span> TERMINAL</h1>
            </header>
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl space-y-10">
              <div className="bg-slate-50 p-1.5 rounded-2xl flex border border-slate-100">
                <button onClick={() => setMode('single')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'single' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Manual Entry</button>
                <button onClick={() => setMode('bulk')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'bulk' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Bulk Deploy</button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4 italic">Node Label (e.g. Table 04)</label>
                  <input type="text" value={baseName} onChange={(e) => setBaseName(e.target.value)} placeholder="Enter label..." className="w-full px-6 py-5 bg-slate-50 rounded-2xl border-none outline-none font-black text-sm italic focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" />
                </div>
                {mode === 'single' ? (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4 italic">Custom Token (Optional)</label>
                    <input type="text" value={manualToken} onChange={(e) => setManualToken(e.target.value)} placeholder="Auto-generated if empty" className="w-full px-6 py-5 bg-slate-50 rounded-2xl border-none outline-none font-black text-sm italic focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" />
                  </div>
                ) : (
                  <div className="animate-fade-in space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4 italic">Deployment Count</label>
                    <input type="number" value={bulkCount} onChange={(e) => setBulkCount(Number(e.target.value))} min="1" max="50" className="w-full px-6 py-5 bg-slate-50 rounded-2xl border-none outline-none font-black text-sm italic focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" />
                  </div>
                )}
                <button disabled={loading} onClick={handleGenerate} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-600 disabled:opacity-50">{loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Deploy to Cloud Vault'}</button>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-6 animate-fade-in">
            {savedQrs.length === 0 ? (
              <div className="py-32 text-center border-4 border-dashed border-slate-100 rounded-[4rem] bg-white/50"><i className="fa-solid fa-folder-open text-4xl text-slate-100 mb-6"></i><p className="text-slate-300 text-[11px] font-black uppercase tracking-[0.5em] italic">Vault is empty</p></div>
            ) : (
              <div className="grid grid-cols-1 gap-6 pb-20">{savedQrs.map(asset => <QRBlock key={asset.id} asset={asset} onDelete={deleteQr} onUpdate={updateQr} />)}</div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminQR;
