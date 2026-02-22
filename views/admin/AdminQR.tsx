import React, { useState, useEffect, useRef } from 'react';
import * as MenuService from '../../services/menuService';
import MenuFAQ from './menu/MenuFAQ';

interface QRAsset {
  id: string;
  label: string;
  code: string;
  restaurant_id: string;
}

const ShareModal: React.FC<{ 
    asset: QRAsset; 
    restaurantName: string;
    onClose: () => void;
}> = ({ asset, restaurantName, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCopied, setIsCopied] = useState(false);
    const productionBase = "https://men-brown.vercel.app/";
    const finalUrl = `${productionBase}${asset.code}`;

    useEffect(() => {
        const QRious = (window as any).QRious;
        if (canvasRef.current && QRious) {
            new QRious({ element: canvasRef.current, size: 512, value: finalUrl, level: 'H', foreground: '#000000', background: '#ffffff', padding: 12 });
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
            link.download = `${restaurantName.replace(/\s+/g, '_')}_${asset.label.replace(/\s+/g, '_')}_QR.png`;
            link.click();
        }
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-end justify-center animate-fade-in font-jakarta" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" />
            <div className="relative bg-white w-full max-w-lg rounded-t-2xl p-6 pt-2 shadow-2xl space-y-6 animate-slide-up flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2 shrink-0" />
                
                <header className="flex justify-between items-center">
                    <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors"><i className="fa-solid fa-xmark text-lg"></i></button>
                    <h3 className="text-sm font-bold text-slate-900">Share asset</h3>
                    <div className="w-5" />
                </header>
                
                <div className="bg-slate-50 p-6 rounded-2xl shadow-inner border border-slate-100 mx-auto w-full flex flex-col items-center gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
                        <canvas ref={canvasRef} className="w-40 h-40"></canvas>
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-xl font-bold text-slate-800 tracking-tight leading-none">{asset.label}</p>
                        <p className="text-[10px] font-medium text-slate-400">{restaurantName}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2 pb-4">
                    <button onClick={handleCopy} className={`py-4 rounded-xl font-bold text-[12px] tracking-tight transition-all shadow-md flex items-center justify-center gap-2 ${isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                        {isCopied ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-link"></i>}
                        {isCopied ? 'Link copied' : 'Copy link'}
                    </button>
                    <button onClick={handleDownload} className="py-4 rounded-xl font-bold text-[12px] tracking-tight bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">Download image</button>
                </div>
            </div>
        </div>
    );
};

const AdminQR: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gen' | 'bulk' | 'saved'>('gen');
  const [baseName, setBaseName] = useState('Table ');
  const [bulkPrefix, setBulkPrefix] = useState('Table ');
  const [bulkStart, setBulkStart] = useState(1);
  const [bulkEnd, setBulkEnd] = useState(10);
  const [showFaq, setShowFaq] = useState(false);
  
  const [savedQrs, setSavedQrs] = useState<QRAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrToShare, setQrToShare] = useState<QRAsset | null>(null);
  const [qrToDelete, setQrToDelete] = useState<QRAsset | null>(null);

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

  useEffect(() => { if (restaurantId) fetchQRCodes(); }, [restaurantId]);
  
  const fetchQRCodes = async () => {
    if (!restaurantId) return [];
    setLoading(true);
    try { 
      const data = await MenuService.getQRCodes(restaurantId); 
      setSavedQrs(data); 
      return data;
    }
    catch (err) { console.error(err); return []; } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!baseName.trim() || loading || !restaurantId) return;
    setLoading(true);
    try {
      const currentNodes = await fetchQRCodes();
      const label = baseName.trim();
      const exists = currentNodes.some(q => q.label.toLowerCase().trim() === label.toLowerCase());
      if (exists) {
          alert(`The label "${label}" is already used.`);
          setLoading(false);
          return;
      }
      await MenuService.upsertQRCode({ 
        restaurant_id: restaurantId, 
        label: label, 
        code: Math.random().toString(36).substr(2, 6).toUpperCase(), 
        type: 'menu' 
      }); 
      await fetchQRCodes(); 
      setActiveTab('saved');
      setBaseName('Table ');
    } catch (err: any) { 
      alert("Fail: " + (err.message || "Error")); 
    } finally { setLoading(false); }
  };

  const handleBulkGenerate = async () => {
    if (loading || !restaurantId) return;
    if (bulkEnd < bulkStart) return alert("End number must be greater than start.");
    if (bulkEnd - bulkStart > 50) return alert("Maximum 50 codes at once.");

    setLoading(true);
    try {
        const payload = [];
        for (let i = bulkStart; i <= bulkEnd; i++) {
            payload.push({
                restaurant_id: restaurantId,
                label: `${bulkPrefix}${i}`,
                code: Math.random().toString(36).substr(2, 6).toUpperCase(),
                type: 'menu'
            });
        }
        await MenuService.bulkUpsertQRCodes(payload);
        await fetchQRCodes();
        setActiveTab('saved');
    } catch (e: any) {
        alert("Bulk creation failed: " + e.message);
    } finally {
        setLoading(false);
    }
  };

  const isDuplicate = savedQrs.some(q => q.label.toLowerCase().trim() === baseName.toLowerCase().trim());

  const qrFaqs = [
    { q: "What is a Table Node?", a: "A node is a persistent digital entry point mapped to a physical location in your venue. Deleting a node will invalidate any printed QR codes associated with it." },
    { q: "How does Bulk Generation work?", a: "It allows you to create multiple tables at once. For example, setting Prefix to 'Table ', Start to 1, and End to 10 will create 'Table 1' through 'Table 10'." },
    { q: "Can I print these?", a: "Yes. In the Archive tab, click the Expand icon on any node to download it as a PNG artifact for printing." }
  ];

  if (showFaq) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <MenuFAQ 
            onBack={() => setShowFaq(false)} 
            title="Nodes Support" 
            subtitle="Deployment Guide"
            items={qrFaqs}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-jakarta pb-40">
      <div className="max-w-2xl mx-auto px-2 pt-12 space-y-8">
        
        {/* Page Header */}
        <header className="px-2 text-center relative">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">QR and Tables</h1>
            <p className="text-slate-500 text-[17px] font-medium leading-relaxed">
              Manage digital table access and physical assets.
              <button onClick={() => setShowFaq(true)} className="ml-1.5 text-[#007AFF] font-bold hover:underline">FAQs</button>
            </p>
          </div>
          <button onClick={fetchQRCodes} className="absolute top-0 right-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 hover:text-indigo-600 shadow-sm border border-slate-200/60 active:rotate-180 transition-all">
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i>
          </button>
        </header>

        {/* Tab Switcher */}
        <div className="bg-slate-200/50 p-1 rounded-xl flex border border-slate-200 shadow-inner overflow-x-auto no-scrollbar gap-1">
          <button onClick={() => setActiveTab('gen')} className={`flex-1 min-w-[90px] py-2.5 rounded-lg text-[10px] font-bold tracking-tight transition-all ${activeTab === 'gen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Single</button>
          <button onClick={() => setActiveTab('bulk')} className={`flex-1 min-w-[90px] py-2.5 rounded-lg text-[10px] font-bold tracking-tight transition-all ${activeTab === 'bulk' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Bulk tool</button>
          <button onClick={() => setActiveTab('saved')} className={`flex-1 min-w-[90px] py-2.5 rounded-lg text-[10px] font-bold tracking-tight transition-all ${activeTab === 'saved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Archive ({savedQrs.length})</button>
        </div>

        {activeTab === 'gen' ? (
          <section className="space-y-3 animate-fade-in">
            <h3 className="px-4 text-[11px] font-bold text-slate-400 tracking-tight">Manual setup</h3>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-sm">
                    <i className="fa-solid fa-tag text-[12px]"></i>
                  </div>
                  <span className="text-[14px] font-bold text-slate-800 tracking-tight">Assign label</span>
                </div>
                
                <div className="space-y-1.5">
                  <input 
                    type="text" 
                    value={baseName} 
                    onChange={(e) => setBaseName(e.target.value)} 
                    className={`w-full bg-slate-50 border px-5 py-3.5 rounded-xl font-bold text-sm text-slate-900 outline-none transition-all shadow-inner ${isDuplicate ? 'border-rose-200 ring-4 ring-rose-50' : 'border-slate-200 focus:bg-white'}`}
                    placeholder="e.g. Table 10"
                  />
                  {isDuplicate && <p className="text-rose-500 text-[9px] font-bold tracking-tight ml-1">This label is already in use</p>}
                </div>
              </div>

              <button 
                disabled={loading || !baseName.trim() || isDuplicate} 
                onClick={handleGenerate} 
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-[12px] tracking-tight shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-bolt text-xs"></i>}
                <span>Deploy node</span>
              </button>
            </div>
          </section>
        ) : activeTab === 'bulk' ? (
          <section className="space-y-3 animate-fade-in">
            <h3 className="px-4 text-[11px] font-bold text-slate-400 tracking-tight">Bulk generator</h3>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50 space-y-6">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 tracking-tight ml-1">Prefix</label>
                        <input type="text" value={bulkPrefix} onChange={e => setBulkPrefix(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-sm" placeholder="e.g. Table " />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 tracking-tight ml-1">Start number</label>
                            <input type="number" value={bulkStart} onChange={e => setBulkStart(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 tracking-tight ml-1">End number</label>
                            <input type="number" value={bulkEnd} onChange={e => setBulkEnd(parseInt(e.target.value) || 10)} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-sm" />
                        </div>
                    </div>
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shrink-0"><i className="fa-solid fa-wand-magic-sparkles text-xs"></i></div>
                        <p className="text-[11px] text-indigo-900 font-bold leading-tight">Creates {bulkEnd - bulkStart + 1} nodes instantly.</p>
                    </div>
                </div>

                <button 
                    disabled={loading} 
                    onClick={handleBulkGenerate} 
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-[12px] tracking-tight shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-plus-circle text-xs"></i>}
                    <span>Generate bulk nodes</span>
                </button>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-3 animate-fade-in">
            <h3 className="px-4 text-[11px] font-bold text-slate-400 tracking-tight">Active nodes</h3>
            {savedQrs.length > 0 ? savedQrs.map((asset) => (
              <div key={asset.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/50 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-500 border border-slate-100 shadow-sm">
                    <i className="fa-solid fa-qrcode text-sm"></i>
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-slate-800 tracking-tight leading-none mb-1">{asset.label}</h4>
                    <p className="text-[9px] font-mono font-bold text-slate-300">ID: {asset.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setQrToShare(asset)} className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center"><i className="fa-solid fa-expand text-xs"></i></button>
                  <button onClick={() => setQrToDelete(asset)} className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center"><i className="fa-solid fa-trash-can text-xs"></i></button>
                </div>
              </div>
            )) : (
              <div className="bg-white rounded-2xl p-16 shadow-sm border border-slate-200/50 text-center space-y-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200 mx-auto text-lg"><i className="fa-solid fa-box-archive"></i></div>
                <p className="text-[10px] font-bold text-slate-300 tracking-tight italic">No active table nodes</p>
              </div>
            )}
          </div>
        )}

        <footer className="text-center pt-6 opacity-30">
           <p className="text-[9px] font-bold text-slate-400 tracking-[0.3em]">QR Engine v2.4 Node</p>
        </footer>
      </div>

      {/* SHARE MODAL (APPLE BOTTOM SHEET) */}
      {qrToShare && <ShareModal asset={qrToShare} restaurantName={session?.restaurant?.name || 'Restaurant'} onClose={() => setQrToShare(null)} />}

      {/* DELETE CONFIRMATION (APPLE ACTION SHEET) */}
      {qrToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center animate-fade-in font-jakarta">
            <div onClick={() => setQrToDelete(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <div className="relative bg-white w-full max-w-lg rounded-t-2xl p-6 pb-10 shadow-2xl animate-slide-up space-y-6">
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mx-auto text-xl">
                    <i className="fa-solid fa-trash-can"></i>
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-xl font-bold tracking-tight">Delete node?</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">Permanently delete node <span className="font-bold text-slate-900">"{qrToDelete.label}"</span>? This action cannot be undone.</p>
                </div>
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={async () => {
                            setLoading(true);
                            await MenuService.deleteQRCode(qrToDelete.id);
                            await fetchQRCodes();
                            setQrToDelete(null);
                            setLoading(false);
                        }}
                        className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold text-[12px] tracking-widest shadow-xl shadow-rose-200 active:scale-95 transition-all"
                    >
                        {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Confirm delete'}
                    </button>
                    <button 
                        onClick={() => setQrToDelete(null)}
                        className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-bold text-[12px] tracking-widest active:scale-95 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}

      <style>{`
        @keyframes scale { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale { animation: scale 0.3s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};

export default AdminQR;