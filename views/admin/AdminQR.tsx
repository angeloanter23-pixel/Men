import React, { useState, useEffect, useRef } from 'react';
import * as MenuService from '../../services/menuService';

declare const QRious: any;

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
        if (canvasRef.current && typeof QRious !== 'undefined') {
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
            <div className="relative bg-white w-full max-w-lg rounded-t-[3rem] p-10 pt-4 shadow-2xl space-y-8 animate-slide-up flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 shrink-0" />
                
                <header className="flex justify-between items-center px-2">
                    <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
                    <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 leading-none">Share Asset</h3>
                    <div className="w-5" />
                </header>
                
                <div className="bg-slate-50 p-8 rounded-[3.5rem] shadow-inner border border-slate-100 mx-auto w-full flex flex-col items-center gap-6">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
                        <canvas ref={canvasRef} className="w-48 h-48"></canvas>
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{asset.label}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{restaurantName}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2 pb-6 px-2">
                    <button onClick={handleCopy} className={`py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3 ${isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                        {isCopied ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-link"></i>}
                        {isCopied ? 'Link Copied' : 'Copy Digital Link'}
                    </button>
                    <button onClick={handleDownload} className="py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">Download PNG Artifact</button>
                </div>
            </div>
        </div>
    );
};

const AdminQR: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gen' | 'saved'>('gen');
  const [baseName, setBaseName] = useState('Table ');
  
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

  const isDuplicate = savedQrs.some(q => q.label.toLowerCase().trim() === baseName.toLowerCase().trim());

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-jakarta pb-40">
      <div className="max-w-2xl mx-auto px-6 pt-12 space-y-10">
        
        {/* Page Header */}
        <header className="px-2 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">QR Codes</h1>
            <p className="text-slate-500 text-sm font-medium mt-2">Generate and manage table tokens.</p>
          </div>
          <button onClick={fetchQRCodes} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-300 hover:text-indigo-600 shadow-sm border border-slate-200">
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i>
          </button>
        </header>

        {/* Tab Switcher */}
        <div className="bg-slate-200/50 p-1 rounded-2xl flex border border-slate-200">
          <button onClick={() => setActiveTab('gen')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'gen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Create New</button>
          <button onClick={() => setActiveTab('saved')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Archive ({savedQrs.length})</button>
        </div>

        {activeTab === 'gen' ? (
          <section className="space-y-4 animate-fade-in">
            <h3 className="px-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">Deployment</h3>
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/50 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-sm">
                    <i className="fa-solid fa-tag text-[14px]"></i>
                  </div>
                  <span className="text-[15px] font-semibold text-slate-800 tracking-tight">Assign Label</span>
                </div>
                
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={baseName} 
                    onChange={(e) => setBaseName(e.target.value)} 
                    className={`w-full bg-slate-50 border px-6 py-4 rounded-2xl font-bold text-sm text-slate-900 outline-none transition-all shadow-inner ${isDuplicate ? 'border-rose-200 ring-4 ring-rose-50' : 'border-slate-200 focus:bg-white'}`}
                    placeholder="e.g. Table 10"
                  />
                  {isDuplicate && <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest ml-1">This label is already in use</p>}
                </div>
              </div>

              <button 
                disabled={loading || !baseName.trim() || isDuplicate} 
                onClick={handleGenerate} 
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-bolt"></i>}
                <span>Deploy Node</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/50 flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <i className="fa-solid fa-shield-halved text-xs"></i>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase tracking-tight">
                  Tokens are unique and persistent. Deleting a node will invalidate all physical prints for that specific location.
                </p>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-4 animate-fade-in">
            <h3 className="px-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">Active Nodes</h3>
            {savedQrs.length > 0 ? savedQrs.map((asset) => (
              <div key={asset.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/50 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-500 border border-slate-100 shadow-sm">
                    <i className="fa-solid fa-qrcode"></i>
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-slate-800 uppercase italic tracking-tight leading-none mb-1.5">{asset.label}</h4>
                    <p className="text-[9px] font-mono font-black text-slate-300 uppercase tracking-widest">ID: {asset.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQrToShare(asset)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center"><i className="fa-solid fa-expand text-sm"></i></button>
                  <button onClick={() => setQrToDelete(asset)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center"><i className="fa-solid fa-trash-can text-sm"></i></button>
                </div>
              </div>
            )) : (
              <div className="bg-white rounded-3xl p-20 shadow-sm border border-slate-200/50 text-center space-y-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto text-xl"><i className="fa-solid fa-box-archive"></i></div>
                <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest italic leading-none">No active table nodes</p>
              </div>
            )}
          </div>
        )}

        <footer className="text-center pt-8 opacity-40">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">QR Engine v2.4 Node</p>
        </footer>
      </div>

      {/* SHARE MODAL (APPLE BOTTOM SHEET) */}
      {qrToShare && <ShareModal asset={qrToShare} restaurantName={session?.restaurant?.name || 'Restaurant'} onClose={() => setQrToShare(null)} />}

      {/* DELETE CONFIRMATION (APPLE ACTION SHEET) */}
      {qrToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center animate-fade-in font-jakarta">
            <div onClick={() => setQrToDelete(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" />
            <div className="relative w-full max-w-lg px-4 pb-8 space-y-3 animate-slide-up flex flex-col">
                <div className="bg-white/95 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden shadow-2xl flex flex-col">
                    <div className="px-6 py-6 text-center border-b border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 leading-none">Access Control</p>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">Permanently delete node "{qrToDelete.label}"?</h3>
                    </div>
                    <button 
                        onClick={async () => {
                            setLoading(true);
                            await MenuService.deleteQRCode(qrToDelete.id);
                            await fetchQRCodes();
                            setQrToDelete(null);
                            setLoading(false);
                        }}
                        className="w-full py-5 text-rose-500 font-bold text-lg border-b border-slate-100 hover:bg-slate-50 transition-colors active:bg-slate-100"
                    >
                        Execute Purge
                    </button>
                </div>
                <button 
                    onClick={() => setQrToDelete(null)} 
                    className="w-full bg-white/95 backdrop-blur-2xl py-5 rounded-[1.5rem] font-bold text-indigo-600 text-lg shadow-xl active:scale-95 transition-all"
                >
                    Cancel
                </button>
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