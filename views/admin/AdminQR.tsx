
import React, { useState, useEffect, useRef } from 'react';

// Declare QRious globally as it's loaded from CDN
declare const QRious: any;

interface QRAsset {
  id: string;
  name: string;
  token: string;
}

const QRBlock: React.FC<{ 
  asset: QRAsset; 
  onDelete: (id: string) => void;
  onUpdate: (id: string, name: string, token: string) => void;
}> = ({ asset, onDelete, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localName, setLocalName] = useState(asset.name);
  const [localToken, setLocalToken] = useState(asset.token);
  const [isCopied, setIsCopied] = useState(false);

  const finalUrl = `mymenu.ph/${localName.replace(/\s+/g, '')}?k=${localToken}`;

  useEffect(() => {
    if (canvasRef.current) {
      new QRious({
        element: canvasRef.current,
        size: 150,
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
      link.download = `${localName}-QR.png`;
      link.click();
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-4">
          <input 
            type="text" 
            value={localName} 
            onChange={(e) => {
              setLocalName(e.target.value);
              onUpdate(asset.id, e.target.value, localToken);
            }}
            className="border border-transparent hover:border-slate-200 focus:border-indigo-600 focus:bg-white bg-transparent outline-none transition-all text-sm font-black uppercase text-indigo-600 px-2 py-1 rounded-lg w-full mb-1" 
            placeholder="Name" 
          />
          <div className="flex items-center text-[11px] font-bold text-slate-400 px-2">
            <span>K:</span>
            <input 
              type="text" 
              value={localToken} 
              onChange={(e) => {
                setLocalToken(e.target.value);
                onUpdate(asset.id, localName, e.target.value);
              }}
              className="border border-transparent hover:border-slate-200 focus:border-indigo-600 focus:bg-white bg-transparent outline-none transition-all ml-1 w-24 focus:text-slate-900" 
              placeholder="Token" 
            />
          </div>
        </div>
        <button 
          onClick={() => onDelete(asset.id)}
          className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 text-xs flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
        >
          <i className="fa-solid fa-trash-can"></i>
        </button>
      </div>

      <div className="flex flex-col items-center py-4 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
        <canvas ref={canvasRef}></canvas>
        <p className="text-[9px] font-mono text-slate-400 mt-3 truncate w-full text-center px-4">
          {finalUrl}
        </p>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={handleCopy}
          className={`flex-[2] py-3 rounded-xl text-[10px] font-black uppercase transition-all ${isCopied ? 'bg-green-100 text-green-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
        >
          {isCopied ? 'COPIED!' : 'Copy Link'}
        </button>
        <button 
          onClick={handleDownload}
          className="flex-1 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-download"></i>
        </button>
      </div>
    </div>
  );
};

const AdminQR: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gen' | 'saved'>('gen');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [baseName, setBaseName] = useState('T');
  const [bulkCount, setBulkCount] = useState(10);
  const [savedQrs, setSavedQrs] = useState<QRAsset[]>([]);

  const generateToken = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerate = () => {
    const qty = mode === 'single' ? 1 : Math.min(bulkCount, 50);
    const newAssets: QRAsset[] = [];

    for (let i = 1; i <= qty; i++) {
      newAssets.push({
        id: Math.random().toString(36).substr(2, 9),
        name: mode === 'single' ? baseName : `${baseName}${i}`,
        token: generateToken()
      });
    }

    setSavedQrs(prev => [...newAssets, ...prev]);
    setActiveTab('saved');
  };

  const deleteQr = (id: string) => {
    if (confirm('Delete this QR asset?')) {
      setSavedQrs(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateQr = (id: string, name: string, token: string) => {
    setSavedQrs(prev => prev.map(item => item.id === id ? { ...item, name, token } : item));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 animate-fade-in">
      <nav className="sticky top-16 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 mb-8 max-w-md mx-auto">
        <div className="flex justify-around">
          <button 
            onClick={() => setActiveTab('gen')}
            className={`py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'gen' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
          >
            Generator
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            className={`py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
          >
            My QRs
          </button>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4">
        {activeTab === 'gen' ? (
          <section className="space-y-6">
            <header className="text-left px-2">
              <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-tight">
                SHARP<span className="text-indigo-600">QR</span>
              </h1>
              <p className="mt-2 text-slate-500 text-xs font-bold leading-relaxed uppercase tracking-wide opacity-70">
                Digital Menu Entry Assets
              </p>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                Create high-performance QR assets for your digital menu. Generate unique alphanumeric security tokens for every table in seconds.
              </p>
            </header>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="bg-slate-100 p-1 rounded-2xl flex mb-6">
                <button 
                  onClick={() => setMode('single')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'single' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}
                >
                  Single Entry
                </button>
                <button 
                  onClick={() => setMode('bulk')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'bulk' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}
                >
                  Bulk (Max 50)
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Base Name (e.g., T)</label>
                  <input 
                    type="text" 
                    value={baseName}
                    onChange={(e) => setBaseName(e.target.value)}
                    placeholder="T" 
                    className="w-full mt-1 px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 ring-indigo-500/20 outline-none font-bold" 
                  />
                </div>

                {mode === 'bulk' && (
                  <div className="animate-fade-in">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Count (1-50)</label>
                    <input 
                      type="number" 
                      value={bulkCount}
                      onChange={(e) => setBulkCount(Number(e.target.value))}
                      min="1" 
                      max="50" 
                      className="w-full mt-1 px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold" 
                    />
                  </div>
                )}

                <button 
                  onClick={handleGenerate}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-indigo-200 uppercase text-xs tracking-widest active:scale-95"
                >
                  Build Assets
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-4 animate-fade-in">
            {savedQrs.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                <i className="fa-solid fa-folder-open text-3xl text-slate-200 mb-3"></i>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No assets generated yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedQrs.map(asset => (
                  <QRBlock 
                    key={asset.id} 
                    asset={asset} 
                    onDelete={deleteQr} 
                    onUpdate={updateQr} 
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminQR;
