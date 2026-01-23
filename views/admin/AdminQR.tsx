
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
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (asset: QRAsset) => void;
  onUpdate: (id: string, label: string, code: string) => void;
}> = ({ asset, isSelected, onSelect, onDelete, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localLabel, setLocalLabel] = useState(asset.label);
  const [isCopied, setIsCopied] = useState(false);

  // Production URL Pattern
  const productionBase = "https://men-m53q.vercel.app/";
  const finalUrl = `${productionBase}${asset.code}`;

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
    if (localLabel !== asset.label) {
        onUpdate(asset.id, localLabel, asset.code);
    }
  };

  return (
    <div className={`bg-white p-8 rounded-[3rem] border transition-all duration-500 relative overflow-hidden group animate-fade-in ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-2xl' : 'border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl'}`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[4rem] -translate-y-4 translate-x-4 group-hover:bg-indigo-50 transition-colors"></div>
      
      {/* Checkbox Overlay */}
      <div className="absolute top-6 left-6 z-20">
        <button 
          onClick={() => onSelect(asset.id)}
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-transparent hover:border-indigo-300'}`}
        >
          <i className="fa-solid fa-check text-[10px]"></i>
        </button>
      </div>

      <div className="flex items-start justify-between mb-8 relative z-10 pl-10">
        <div className="flex-1 pr-4">
          <input 
            type="text" 
            value={localLabel} 
            onBlur={handleSyncUpdate}
            onChange={(e) => setLocalLabel(e.target.value)}
            className="text-xl font-black uppercase italic tracking-tighter text-indigo-600 bg-transparent border-b-2 border-transparent hover:border-indigo-100 focus:border-indigo-600 outline-none transition-all w-full mb-1" 
            placeholder="Label..." 
          />
          <div className="flex items-center text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1 group/token">
            <span className="opacity-40 mr-2">TOKEN:</span>
            <div className="bg-slate-100/50 px-3 py-1 rounded-lg text-slate-400 border border-slate-100 flex items-center gap-2 cursor-not-allowed">
              <span className="font-mono">{asset.code}</span>
              <i className="fa-solid fa-lock text-[8px] opacity-30"></i>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={handleDownload} className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm"><i className="fa-solid fa-download text-xs"></i></button>
            <button onClick={() => onDelete(asset)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><i className="fa-solid fa-trash-can text-xs"></i></button>
        </div>
      </div>

      <div className="flex flex-col items-center py-10 bg-slate-50/50 rounded-[2.5rem] mb-8 border border-slate-100 shadow-inner group-hover:bg-white transition-all">
        <div className="bg-white p-4 rounded-3xl shadow-lg shadow-slate-200/50">
          <canvas ref={canvasRef}></canvas>
        </div>
        <div className="mt-6 w-full px-8 text-center">
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Direct Link</p>
           <p className="text-[8px] font-bold text-slate-400 break-all opacity-60 leading-tight">
             {finalUrl}
           </p>
        </div>
      </div>

      <button 
        onClick={handleCopy}
        className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative z-10 ${isCopied ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-200'}`}
      >
        {isCopied ? 'LINK COPIED' : 'Copy Menu Link'}
      </button>
    </div>
  );
};

const AdminQR: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gen' | 'saved'>('gen');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [baseName, setBaseName] = useState('Table ');
  const [bulkCount, setBulkCount] = useState(5);
  const [savedQrs, setSavedQrs] = useState<QRAsset[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Deletion state
  const [qrToDelete, setQrToDelete] = useState<QRAsset[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === savedQrs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(savedQrs.map(q => q.id));
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
    if (!restaurantId || restaurantId === "undefined") return alert("Please log in again.");
    
    setLoading(true);
    try {
      if (mode === 'single') {
        await MenuService.upsertQRCode({
          restaurant_id: restaurantId,
          label: baseName,
          code: generateToken(),
          type: 'menu'
        });
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
      alert("Error creating code. Every code must be unique.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteQr = async () => {
    if (!qrToDelete || qrToDelete.length === 0) return;
    setIsDeleting(true);
    try {
      for (const asset of qrToDelete) {
        await MenuService.deleteQRCode(asset.id);
      }
      const deletedIds = qrToDelete.map(a => a.id);
      setSavedQrs(prev => prev.filter(item => !deletedIds.includes(item.id)));
      setSelectedIds(prev => prev.filter(id => !deletedIds.includes(id)));
      setQrToDelete(null);
    } catch (err) {
      alert("Failed to delete QR code(s).");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateQr = async (id: string, label: string, code: string) => {
    try {
      await MenuService.upsertQRCode({ id, label, code, restaurant_id: restaurantId });
      setSavedQrs(prev => prev.map(q => q.id === id ? { ...q, label, code } : q));
    } catch (err) {
      console.error("Failed to update", err);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in relative overflow-x-hidden font-['Plus_Jakarta_Sans'] bg-slate-50/30">
      
      {/* Sub-Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-[45] px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex overflow-x-auto no-scrollbar gap-2">
          <button 
            onClick={() => setActiveTab('gen')}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'gen' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            Generator
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'saved' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            Saved Codes ({savedQrs.length})
          </button>
        </div>

        {activeTab === 'saved' && savedQrs.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <button 
                onClick={handleSelectAll}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedIds.length === savedQrs.length ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 text-transparent hover:border-indigo-400'}`}
               >
                 <i className="fa-solid fa-check text-[8px]"></i>
               </button>
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select All</span>
            </div>
            {selectedIds.length > 0 && (
              <button 
                onClick={() => setQrToDelete(savedQrs.filter(q => selectedIds.includes(q.id)))}
                className="bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 flex items-center gap-2 animate-scale"
              >
                <i className="fa-solid fa-trash-can"></i>
                Delete ({selectedIds.length})
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar pb-32">
        {/* Header */}
        <div className="mb-10 animate-fade-in-up">
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">
            {activeTab === 'gen' ? 'Create QR Codes' : 'Saved QR Codes'}
          </h3>
          <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
            {activeTab === 'gen' 
              ? 'Create new QR codes for your tables. Each code is unique and randomly generated to link directly to your menu.' 
              : 'Review and manage your active menu links. You can download these QR codes to print for your tables.'}
          </p>
        </div>

        {activeTab === 'gen' ? (
          <section className="space-y-10 max-w-2xl">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-10">
              <div className="bg-slate-50 p-1.5 rounded-2xl flex border border-slate-100 shadow-inner">
                <button onClick={() => setMode('single')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'single' ? 'bg-white text-indigo-600 shadow-md border border-slate-50' : 'text-slate-400'}`}>Single Code</button>
                <button onClick={() => setMode('bulk')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'bulk' ? 'bg-white text-indigo-600 shadow-md border border-slate-50' : 'text-slate-400'}`}>Bulk Create</button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Table Name (e.g. Table 1)</label>
                  <input type="text" value={baseName} onChange={(e) => setBaseName(e.target.value)} placeholder="Enter label..." className="w-full px-6 py-5 bg-slate-50 rounded-2xl border-none outline-none font-black text-sm italic focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" />
                </div>
                
                {mode === 'bulk' && (
                  <div className="animate-fade-in space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">How many codes?</label>
                    <input type="number" value={bulkCount} onChange={(e) => setBulkCount(Number(e.target.value))} min="1" max="50" className="w-full px-6 py-5 bg-slate-50 rounded-2xl border-none outline-none font-black text-sm italic focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" />
                  </div>
                )}
                
                <button disabled={loading} onClick={handleGenerate} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-600 disabled:opacity-50">
                  {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Create QR Code'}
                </button>
              </div>
            </div>
            
            {/* Note Card */}
            <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700"></div>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300 mb-2">Helpful Tip</p>
               <h4 className="text-xl font-black italic tracking-tighter mb-4 uppercase">Unique Access</h4>
               <p className="text-[11px] font-medium opacity-80 leading-relaxed">
                 Every QR code you create is unique. This means each table will have its own special link. Use "Bulk Create" to quickly make codes for many tables at once.
               </p>
               <i className="fa-solid fa-circle-info absolute bottom-6 right-8 text-4xl opacity-10"></i>
            </div>
          </section>
        ) : (
          <section className="space-y-8 animate-fade-in">
            {savedQrs.length === 0 ? (
              <div className="py-32 text-center border-4 border-dashed border-slate-100 rounded-[4rem] bg-white/50">
                <i className="fa-solid fa-folder-open text-4xl text-slate-100 mb-6"></i>
                <p className="text-slate-300 text-[11px] font-black uppercase tracking-[0.5em] italic">No codes saved yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                {savedQrs.map(asset => (
                  <QRBlock 
                    key={asset.id} 
                    asset={asset} 
                    isSelected={selectedIds.includes(asset.id)}
                    onSelect={handleSelectOne}
                    onDelete={(a) => setQrToDelete([a])} 
                    onUpdate={updateQr} 
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {qrToDelete && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setQrToDelete(null)}>
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center space-y-8 animate-scale" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <i className="fa-solid fa-qrcode text-3xl"></i>
            </div>
            <div>
              <h4 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">
                {qrToDelete.length > 1 ? `Delete ${qrToDelete.length} Nodes?` : 'Delete Access Node?'}
              </h4>
              <p className="text-sm text-slate-400 font-medium mt-4 leading-relaxed px-2">
                {qrToDelete.length > 1 
                  ? `You are about to permanently deactivate ${qrToDelete.length} access tokens. This action is final.`
                  : <>Removing <span className="text-slate-900 font-bold uppercase italic tracking-tight">"{qrToDelete[0].label}"</span> will permanently deactivate its unique access token. Customers scanning this physical QR will see an error.</>
                }
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <button 
                onClick={confirmDeleteQr}
                disabled={isDeleting}
                className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? <i className="fa-solid fa-spinner animate-spin"></i> : `Yes, Delete ${qrToDelete.length > 1 ? 'Codes' : 'Code'}`}
              </button>
              <button 
                onClick={() => setQrToDelete(null)}
                className="w-full py-4 text-[10px] font-black uppercase text-slate-300 hover:text-slate-600 tracking-widest transition-colors"
              >
                Discard Action
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-scale { animation: scale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

export default AdminQR;
