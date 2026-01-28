
import React, { useState, useEffect, useRef } from 'react';
import * as MenuService from '../../services/menuService';

// Declare QRious globally as it's loaded from CDN
declare const QRious: any;

interface QRAsset {
  id: string;
  label: string;
  code: string;
  restaurant_id: string;
  branch_id?: string;
  branches?: { name: string };
}

const ShareModal: React.FC<{ 
    asset: QRAsset; 
    restaurantName: string;
    onClose: () => void;
    branchName?: string;
}> = ({ asset, restaurantName, onClose, branchName }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCopied, setIsCopied] = useState(false);
    const productionBase = "https://men-brown.vercel.app/";
    const finalUrl = `${productionBase}${asset.code}`;

    useEffect(() => {
        if (canvasRef.current && typeof QRious !== 'undefined') {
            new QRious({
                element: canvasRef.current,
                size: 260,
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
            link.download = `${restaurantName}-${branchName}-${asset.label}.png`;
            link.click();
        }
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-2xl animate-fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-lg rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative animate-scale" onClick={e => e.stopPropagation()}>
                <div className="h-2 bg-brand-primary w-full"></div>
                <div className="p-8 md:p-12 space-y-10">
                    <header className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">QR Ready</p>
                            </div>
                            <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-tight">Share <span className="text-brand-primary">Code</span></h3>
                        </div>
                        <button onClick={onClose} className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all border border-slate-100 shadow-sm active:scale-90"><i className="fa-solid fa-xmark text-xl"></i></button>
                    </header>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-brand-primary/5 rounded-[3.5rem] blur-2xl transition-all duration-700"></div>
                            <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl border border-slate-50 relative z-10 flex flex-col items-center">
                                <canvas ref={canvasRef} className="rounded-2xl"></canvas>
                                <div className="mt-6 flex items-center gap-3">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Digital Access Key</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Business</p>
                                <h4 className="text-2xl font-black uppercase text-slate-900 leading-none">{restaurantName}</h4>
                                <p className="text-xs font-bold text-brand-primary uppercase tracking-tighter opacity-80">{branchName || 'Main'}</p>
                            </div>
                            <div className="h-px bg-slate-100 w-full"></div>
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Table Name</p>
                                <p className="text-sm font-black text-slate-800 uppercase leading-none">{asset.label}</p>
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button onClick={handleCopy} className={`py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 border ${isCopied ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-900 text-white hover:bg-brand-primary'}`}>
                            <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-link'}`}></i>
                            {isCopied ? 'Copied' : 'Copy Link'}
                        </button>
                        <button onClick={handleDownload} className="bg-slate-100 text-slate-600 py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-indigo-600 hover:text-white shadow-inner">
                            <i className="fa-solid fa-download"></i> Save Image
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const QRBlock: React.FC<{ 
  asset: QRAsset; 
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (asset: QRAsset) => void;
  onUpdate: (id: string, label: string, code: string) => void;
  onShare: (asset: QRAsset) => void;
  branchName?: string;
}> = ({ asset, isSelected, onSelect, onDelete, onUpdate, onShare, branchName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localLabel, setLocalLabel] = useState(asset.label);
  const productionBase = "https://men-brown.vercel.app/";
  const finalUrl = `${productionBase}${asset.code}`;

  useEffect(() => {
    if (canvasRef.current && typeof QRious !== 'undefined') {
      new QRious({ element: canvasRef.current, size: 180, value: finalUrl, level: 'H', foreground: '#0f172a' });
    }
  }, [finalUrl]);

  return (
    <div className={`bg-white p-8 rounded-[3rem] border transition-all relative group animate-fade-in ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-2xl' : 'border-slate-100 shadow-sm hover:shadow-xl'}`}>
      <div className="absolute top-6 left-6 z-20">
        <button onClick={() => onSelect(asset.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-transparent hover:border-indigo-300'}`}>
          <i className="fa-solid fa-check text-[10px]"></i>
        </button>
      </div>
      <div className="flex items-start justify-between mb-8 relative z-10 pl-10">
        <div className="flex-1 pr-4">
          <input type="text" value={localLabel} onBlur={() => localLabel !== asset.label && onUpdate(asset.id, localLabel, asset.code)} onChange={(e) => setLocalLabel(e.target.value)} className="text-xl font-black uppercase tracking-tighter text-brand-primary bg-transparent border-b-2 border-transparent hover:border-indigo-100 focus:border-brand-primary outline-none transition-all w-full mb-1" placeholder="Label..." />
          {branchName && <span className="text-[8px] font-black uppercase text-brand-primary tracking-widest bg-brand-secondary px-2 py-0.5 rounded-lg w-fit">{branchName}</span>}
        </div>
        <div className="flex gap-2">
            <button onClick={() => onShare(asset)} className="w-10 h-10 rounded-xl bg-slate-900 text-white hover:bg-brand-primary transition-all flex items-center justify-center shadow-lg"><i className="fa-solid fa-share-nodes text-xs"></i></button>
            <button onClick={() => onDelete(asset)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><i className="fa-solid fa-trash-can text-xs"></i></button>
        </div>
      </div>
      <div className="flex flex-col items-center py-10 bg-slate-50/50 rounded-[2.5rem] mb-8 border border-slate-100 shadow-inner group-hover:bg-white transition-all">
        <div className="bg-white p-4 rounded-3xl shadow-lg cursor-pointer" onClick={() => onShare(asset)}><canvas ref={canvasRef}></canvas></div>
        <p className="mt-6 text-[8px] font-bold text-slate-400 break-all opacity-60 px-8 text-center">{finalUrl}</p>
      </div>
    </div>
  );
};

interface AdminQRProps {
  availableBranches?: any[];
}

const AdminQR: React.FC<AdminQRProps> = ({ availableBranches = [] }) => {
  const [activeTab, setActiveTab] = useState<'gen' | 'saved'>('gen');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [baseName, setBaseName] = useState('Table ');
  const [bulkCount, setBulkCount] = useState(5);
  const [savedQrs, setSavedQrs] = useState<QRAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [genBranchId, setGenBranchId] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [qrToDelete, setQrToDelete] = useState<QRAsset[] | null>(null);
  const [qrToShare, setQrToShare] = useState<QRAsset | null>(null);

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;
  const userRole = session?.user?.role;
  const userBranchId = session?.user?.branch_id;
  const isSuperAdmin = userRole === 'super-admin';
  const isBranchManager = userRole === 'branch-manager';

  useEffect(() => { if (restaurantId) fetchQRCodes(); }, [restaurantId]);
  
  useEffect(() => { 
    if (!isSuperAdmin && userBranchId) {
        setGenBranchId(userBranchId);
        setBranchFilter(userBranchId);
    } else if (availableBranches.length > 0 && !genBranchId) {
        setGenBranchId(availableBranches[0].id);
    }
  }, [availableBranches, isSuperAdmin, userBranchId]);

  const fetchQRCodes = async () => {
    setLoading(true);
    try { 
        const data = await MenuService.getQRCodes(restaurantId); 
        setSavedQrs(data); 
    }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!genBranchId) return alert("Select a branch.");
    setLoading(true);
    try {
      if (mode === 'single') { await MenuService.upsertQRCode({ restaurant_id: restaurantId, branch_id: genBranchId, label: baseName, code: Math.random().toString(36).substr(2, 6).toUpperCase(), type: 'menu' }); }
      else { for (let i = 1; i <= Math.min(bulkCount, 50); i++) { await MenuService.upsertQRCode({ restaurant_id: restaurantId, branch_id: genBranchId, label: `${baseName}${i}`, code: Math.random().toString(36).substr(2, 6).toUpperCase(), type: 'menu' }); } }
      await fetchQRCodes(); setActiveTab('saved');
    } catch (err) { alert("Error generating codes."); } finally { setLoading(false); }
  };

  const filteredQrs = savedQrs.filter(qr => {
    if (isBranchManager) return qr.branch_id === userBranchId;
    return branchFilter === 'all' || qr.branch_id === branchFilter;
  });

  return (
    <div className="flex flex-col h-full animate-fade-in relative overflow-x-hidden font-jakarta bg-slate-50/30">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-[45] px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('gen')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'gen' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500'}`}>Generator</button>
          <button onClick={() => setActiveTab('saved')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500'}`}>Saved ({filteredQrs.length})</button>
        </div>
        {activeTab === 'saved' && isSuperAdmin && availableBranches.length > 0 && (
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[9px] font-black uppercase outline-none">
            <option value="all">All Branches</option>
            {availableBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 pb-32">
        {activeTab === 'gen' ? (
          <section className="space-y-10 max-w-2xl mx-auto">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8">
              <div className="bg-slate-50 p-1.5 rounded-2xl flex border border-slate-100 shadow-inner">
                <button onClick={() => setMode('single')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'single' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Single</button>
                <button onClick={() => setMode('bulk')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'bulk' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Bulk Create</button>
              </div>
              <div className="space-y-6">
                {isSuperAdmin && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Target Branch</label>
                    <select value={genBranchId} onChange={(e) => setGenBranchId(e.target.value)} className="w-full px-6 py-5 bg-slate-50 rounded-2xl outline-none font-black text-sm">
                      <option value="">Select Branch...</option>
                      {availableBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Table Label</label><input type="text" value={baseName} onChange={(e) => setBaseName(e.target.value)} className="w-full px-6 py-5 bg-slate-50 rounded-2xl outline-none font-black text-sm shadow-inner" /></div>
                {mode === 'bulk' && <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Total Quantity</label><input type="number" value={bulkCount} onChange={(e) => setBulkCount(Number(e.target.value))} className="w-full px-6 py-5 bg-slate-50 rounded-2xl outline-none font-black text-sm shadow-inner" /></div>}
                <button disabled={loading || !genBranchId} onClick={handleGenerate} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-600">{loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Generate QR'}</button>
              </div>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredQrs.map(asset => (
              <QRBlock key={asset.id} asset={asset} isSelected={selectedIds.includes(asset.id)} onSelect={(id) => setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])} onDelete={(a) => MenuService.deleteQRCode(a.id).then(fetchQRCodes)} onUpdate={(id, l, c) => MenuService.upsertQRCode({ id, label: l, code: c, restaurant_id: restaurantId }).then(fetchQRCodes)} onShare={(a) => setQrToShare(a)} branchName={asset.branches?.name} />
            ))}
          </div>
        )}
      </div>
      {qrToShare && <ShareModal asset={qrToShare} restaurantName={session?.restaurant?.name || 'Restaurant'} branchName={qrToShare.branches?.name} onClose={() => setQrToShare(null)} />}
    </div>
  );
};

export default AdminQR;
