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

    const handleCopy = () => { navigator.clipboard.writeText(finalUrl); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); };
    const handleDownload = () => {
        if (canvasRef.current) {
            const link = document.createElement('a');
            link.href = canvasRef.current.toDataURL("image/png");
            link.download = `${restaurantName.replace(/\s+/g, '_')}_${asset.label.replace(/\s+/g, '_')}_QR.png`;
            link.click();
        }
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-2xl animate-fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl relative animate-scale flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 md:p-14 overflow-y-auto no-scrollbar">
                    <header className="flex justify-between items-start mb-12">
                        <div><h3 className="text-3xl font-black uppercase italic tracking-tighter">Share <span className="text-indigo-600">Access</span></h3></div>
                        <button onClick={onClose} className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all shadow-sm"><i className="fa-solid fa-xmark"></i></button>
                    </header>
                    <div className="flex flex-col items-center mb-12">
                        <div className="bg-white p-10 rounded-[4rem] shadow-2xl border border-slate-50 relative z-10">
                            <canvas ref={canvasRef} className="w-full aspect-square max-w-[200px]"></canvas>
                        </div>
                        <div className="mt-8 text-center space-y-2">
                            <p className="text-3xl font-black uppercase text-slate-900 leading-none italic">{restaurantName}</p>
                            <p className="text-lg font-black text-slate-400 uppercase tracking-widest">{asset.label}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button onClick={handleCopy} className={`py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 border ${isCopied ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-900 text-white hover:bg-indigo-600 border-slate-800'}`}>{isCopied ? 'Linked' : 'Copy Token'}</button>
                        <button onClick={handleDownload} className="bg-slate-100 text-slate-600 py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-slate-200 border border-slate-200">Export PNG</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const QRBlock: React.FC<{ asset: QRAsset; onDelete: (asset: QRAsset) => void; onShare: (asset: QRAsset) => void; }> = ({ asset, onDelete, onShare }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const productionBase = "https://men-brown.vercel.app/";
  const finalUrl = `${productionBase}${asset.code}`;

  useEffect(() => {
    if (canvasRef.current && typeof QRious !== 'undefined') {
      new QRious({ element: canvasRef.current, size: 300, value: finalUrl, level: 'H', foreground: '#000000', background: '#ffffff', padding: 8 });
    }
  }, [finalUrl]);

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all relative group animate-fade-in">
      <div className="flex items-start justify-between mb-8 relative z-10">
        <h4 className="text-2xl font-black uppercase tracking-tighter text-indigo-600 italic truncate">{asset.label}</h4>
        <div className="flex gap-2">
            <button onClick={() => onShare(asset)} className="w-10 h-10 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 transition-all flex items-center justify-center shadow-lg"><i className="fa-solid fa-expand text-xs"></i></button>
            <button onClick={() => onDelete(asset)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><i className="fa-solid fa-trash-can text-xs"></i></button>
        </div>
      </div>
      <div className="flex flex-col items-center py-8 bg-slate-50/50 rounded-[3rem] border border-slate-100 shadow-inner group-hover:bg-white transition-all cursor-pointer" onClick={() => onShare(asset)}>
        <div className="bg-white p-4 rounded-3xl shadow-2xl transition-transform group-hover:scale-105"><canvas ref={canvasRef} className="w-36 h-36"></canvas></div>
        <p className="mt-6 text-[8px] font-mono font-bold text-slate-400 opacity-60 uppercase">{asset.code}</p>
      </div>
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
  const [qrToShare, setQrToShare] = useState<QRAsset | null>(null);

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

  useEffect(() => { if (restaurantId) fetchQRCodes(); }, [restaurantId]);
  
  const fetchQRCodes = async () => {
    setLoading(true);
    try { 
      const data = await MenuService.getQRCodes(restaurantId); 
      setSavedQrs(data); 
    }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!baseName.trim() || loading) return;
    setLoading(true);
    try {
      if (mode === 'single') { 
        await MenuService.upsertQRCode({ 
          restaurant_id: restaurantId, 
          label: baseName, 
          code: Math.random().toString(36).substr(2, 6).toUpperCase(), 
          type: 'menu' 
        }); 
      } else { 
        for (let i = 1; i <= Math.min(bulkCount, 50); i++) { 
          await MenuService.upsertQRCode({ 
            restaurant_id: restaurantId, 
            label: `${baseName}${i}`, 
            code: Math.random().toString(36).substr(2, 6).toUpperCase(), 
            type: 'menu' 
          }); 
        } 
      }
      await fetchQRCodes(); 
      setActiveTab('saved');
    } catch (err) { 
      alert("Generation failed. Check network."); 
    } finally { setLoading(false); }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Purge this QR node?')) return;
    setLoading(true);
    try {
      await MenuService.deleteQRCode(assetId);
      await fetchQRCodes();
    } catch (e) {
      alert("Delete failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in font-jakarta bg-slate-50/50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-[45] px-6 py-5 flex items-center justify-between shadow-sm">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('gen')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'gen' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border border-slate-100 text-slate-400'}`}>Generator</button>
          <button onClick={() => setActiveTab('saved')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border border-slate-100 text-slate-400'}`}>Archive ({savedQrs.length})</button>
        </div>
        <button onClick={fetchQRCodes} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-colors">
          <i className={`fa-solid fa-rotate ${loading ? 'animate-spin' : ''}`}></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-12 pb-40 no-scrollbar">
        {activeTab === 'gen' ? (
          <section className="space-y-12 max-w-2xl mx-auto">
            <div className="bg-white p-8 md:p-14 rounded-[4rem] border border-slate-100 shadow-2xl space-y-10 relative overflow-hidden group">
              <div className="bg-slate-100 p-2 rounded-[2rem] flex border border-slate-100 shadow-inner">
                <button onClick={() => setMode('single')} className={`flex-1 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'single' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Single Token</button>
                <button onClick={() => setMode('bulk')} className={`flex-1 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'bulk' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Bulk Deployment</button>
              </div>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Designation Label</label>
                  <input type="text" value={baseName} onChange={(e) => setBaseName(e.target.value)} className="w-full px-7 py-6 bg-slate-50 rounded-3xl outline-none font-black text-sm italic shadow-inner" placeholder="e.g. Zone A-" />
                </div>
                {mode === 'bulk' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Total Sequence Count</label>
                    <input type="number" min="1" max="50" value={bulkCount} onChange={(e) => setBulkCount(Number(e.target.value))} className="w-full px-7 py-6 bg-slate-50 rounded-3xl outline-none font-black text-sm shadow-inner" />
                  </div>
                )}
                <button 
                  disabled={loading || !baseName.trim()} 
                  onClick={handleGenerate} 
                  className="w-full bg-slate-900 text-white py-7 rounded-[3rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-600 disabled:opacity-30"
                >
                  {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Deploy Nodes'}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedQrs.map(asset => ( 
              <QRBlock 
                key={asset.id} 
                asset={asset} 
                onDelete={(a) => handleDelete(a.id)} 
                onShare={(a) => setQrToShare(a)} 
              /> 
            ))}
            {savedQrs.length === 0 && !loading && ( 
              <div className="col-span-full py-40 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-100 text-4xl mb-6 shadow-sm border border-slate-50">
                  <i className="fa-solid fa-box-archive"></i>
                </div>
                <p className="text-slate-300 font-black uppercase tracking-[0.5em] italic">No active nodes deployed</p>
              </div> 
            )}
          </div>
        )}
      </div>
      {qrToShare && <ShareModal asset={qrToShare} restaurantName={session?.restaurant?.name || 'Restaurant'} onClose={() => setQrToShare(null)} />}
    </div>
  );
};

export default AdminQR;