
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
    const productionBase = "https://men-m53q.vercel.app/";
    const finalUrl = `${productionBase}${asset.code}`;

    useEffect(() => {
        if (canvasRef.current && typeof QRious !== 'undefined') {
            new QRious({
                element: canvasRef.current,
                size: 240,
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
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-md rounded-[4rem] p-10 shadow-2xl relative overflow-hidden space-y-8 animate-scale" onClick={e => e.stopPropagation()}>
                {/* Brand Background Element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -translate-y-6 translate-x-6 z-0"></div>
                
                <header className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.4em] mb-2 italic">Node Verification</p>
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">
                            Share <span className="text-indigo-600">Access</span>
                        </h3>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all border border-slate-100"><i className="fa-solid fa-xmark"></i></button>
                </header>

                <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 shadow-inner space-y-6">
                    <div className="flex flex-col items-center">
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl mb-6">
                            <canvas ref={canvasRef}></canvas>
                        </div>
                        <div className="text-center space-y-1">
                            <h4 className="text-lg font-black uppercase italic text-slate-800">{restaurantName}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full inline-block">{branchName || 'Main Territory'}</p>
                        </div>
                    </div>

                    <div className="h-px bg-slate-200/50 w-full"></div>

                    <div className="flex justify-between items-center px-2">
                        <div>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">Identity Label</p>
                            <p className="text-sm font-black text-slate-700 uppercase italic">{asset.label}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">Token ID</p>
                            <p className="text-[10px] font-mono font-bold text-indigo-600 uppercase">{asset.code}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={handleCopy}
                        className={`py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3 ${isCopied ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 text-white shadow-slate-200'}`}
                    >
                        <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-link'}`}></i>
                        {isCopied ? 'Copied' : 'Copy Link'}
                    </button>
                    <button 
                        onClick={handleDownload}
                        className="bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <i className="fa-solid fa-download"></i>
                        PNG Format
                    </button>
                </div>
                
                <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-50">Authorized Menu Node Generation</p>
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

  const handleSyncUpdate = () => {
    if (localLabel !== asset.label) {
        onUpdate(asset.id, localLabel, asset.code);
    }
  };

  return (
    <div className={`bg-white p-8 rounded-[3rem] border transition-all duration-500 relative overflow-hidden group animate-fade-in ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-2xl' : 'border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl'}`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[4rem] -translate-y-4 translate-x-4 group-hover:bg-indigo-50 transition-colors"></div>
      
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
          <div className="flex flex-col gap-2">
            {branchName && (
              <span className="text-[8px] font-black uppercase text-indigo-500 tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg w-fit">
                {branchName}
              </span>
            )}
            <div className="flex items-center text-[10px] font-black text-slate-300 uppercase tracking-widest group/token">
              <span className="opacity-40 mr-2">TOKEN:</span>
              <div className="bg-slate-100/50 px-3 py-1 rounded-lg text-slate-400 border border-slate-100 flex items-center gap-2 cursor-not-allowed">
                <span className="font-mono">{asset.code}</span>
                <i className="fa-solid fa-lock text-[8px] opacity-30"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => onShare(asset)} className="w-10 h-10 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 transition-all flex items-center justify-center shadow-lg"><i className="fa-solid fa-share-nodes text-xs"></i></button>
            <button onClick={() => onDelete(asset)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><i className="fa-solid fa-trash-can text-xs"></i></button>
        </div>
      </div>

      <div className="flex flex-col items-center py-10 bg-slate-50/50 rounded-[2.5rem] mb-8 border border-slate-100 shadow-inner group-hover:bg-white transition-all">
        <div className="bg-white p-4 rounded-3xl shadow-lg shadow-slate-200/50 cursor-pointer" onClick={() => onShare(asset)}>
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
        onClick={() => onShare(asset)}
        className="w-full py-5 bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white hover:shadow-xl active:scale-95"
      >
        Configure & Share
      </button>
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
  
  // Branch specific states
  const [genBranchId, setGenBranchId] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals state
  const [qrToDelete, setQrToDelete] = useState<QRAsset[] | null>(null);
  const [qrToShare, setQrToShare] = useState<QRAsset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;
  const restaurantName = session?.restaurant?.name || 'My Restaurant';

  useEffect(() => {
    if (restaurantId && restaurantId !== "undefined") {
      fetchQRCodes();
    }
  }, [restaurantId]);

  useEffect(() => {
    if (availableBranches.length > 0 && !genBranchId) {
      setGenBranchId(availableBranches[0].id);
    }
  }, [availableBranches]);

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
    if (!genBranchId) return alert("Please select a target branch.");
    
    setLoading(true);
    try {
      if (mode === 'single') {
        await MenuService.upsertQRCode({
          restaurant_id: restaurantId,
          branch_id: genBranchId,
          label: baseName,
          code: generateToken(),
          type: 'menu'
        });
      } else {
        const qty = Math.min(bulkCount, 50);
        for (let i = 1; i <= qty; i++) {
          await MenuService.upsertQRCode({
            restaurant_id: restaurantId,
            branch_id: genBranchId,
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

  const filteredQrs = savedQrs.filter(qr => {
    if (branchFilter === 'all') return true;
    return qr.branch_id === branchFilter;
  });

  return (
    <div className="flex flex-col h-full animate-fade-in relative overflow-x-hidden font-['Plus_Jakarta_Sans'] bg-slate-50/30">
      
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

        {activeTab === 'saved' && (
          <div className="flex items-center gap-4">
            {availableBranches.length > 0 && (
              <div className="relative group">
                <select 
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest outline-none appearance-none pr-8 cursor-pointer hover:border-indigo-300 transition-all text-slate-600"
                >
                  <option value="all">All Branches</option>
                  {availableBranches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-slate-300 pointer-events-none group-hover:text-indigo-400"></i>
              </div>
            )}
            {savedQrs.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={handleSelectAll}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedIds.length === savedQrs.length && savedQrs.length > 0 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 text-transparent hover:border-indigo-400'}`}
                   >
                     <i className="fa-solid fa-check text-[8px]"></i>
                   </button>
                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest hidden sm:inline">Select All</span>
                </div>
                {selectedIds.length > 0 && (
                  <button 
                    onClick={() => setQrToDelete(savedQrs.filter(q => selectedIds.includes(q.id)))}
                    className="bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 flex items-center gap-2 animate-scale"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    <span className="hidden sm:inline">Delete</span> ({selectedIds.length})
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar pb-32">
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
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Target Branch</label>
                  <div className="relative group">
                    <select 
                      value={genBranchId} 
                      onChange={(e) => setGenBranchId(e.target.value)}
                      className="w-full px-6 py-5 bg-slate-50 rounded-2xl border-none outline-none font-black text-sm italic focus:ring-4 ring-indigo-500/5 transition-all shadow-inner appearance-none pr-12 cursor-pointer"
                    >
                      <option value="" disabled>Select Branch...</option>
                      {availableBranches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
                  </div>
                </div>

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
                
                <button disabled={loading || !genBranchId} onClick={handleGenerate} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-600 disabled:opacity-50">
                  {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Create QR Code'}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-8 animate-fade-in">
            {filteredQrs.length === 0 ? (
              <div className="py-32 text-center border-4 border-dashed border-slate-100 rounded-[4rem] bg-white/50">
                <i className="fa-solid fa-folder-open text-4xl text-slate-100 mb-6"></i>
                <p className="text-slate-300 text-[11px] font-black uppercase tracking-[0.5em] italic">No codes found for this filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                {filteredQrs.map(asset => (
                  <QRBlock 
                    key={asset.id} 
                    asset={asset} 
                    isSelected={selectedIds.includes(asset.id)}
                    onSelect={handleSelectOne}
                    onDelete={(a) => setQrToDelete([a])} 
                    onUpdate={updateQr} 
                    onShare={(a) => setQrToShare(a)}
                    branchName={asset.branches?.name || availableBranches.find(b => b.id === asset.branch_id)?.name}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Immersive Share Modal */}
      {qrToShare && (
        <ShareModal 
            asset={qrToShare} 
            restaurantName={restaurantName}
            branchName={qrToShare.branches?.name || availableBranches.find(b => b.id === qrToShare.branch_id)?.name}
            onClose={() => setQrToShare(null)} 
        />
      )}

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
                  : <>Removing <span className="text-slate-900 font-bold uppercase italic tracking-tight">"{qrToDelete[0].label}"</span> will permanently deactivate its unique access token.</>
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
