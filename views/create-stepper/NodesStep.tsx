
import React, { useState, useEffect, useRef } from 'react';
import * as MenuService from '../../services/menuService';
import MenuFAQ from './menu/MenuFAQ';

interface NodesStepProps {
  nodes: { label: string; code: string }[];
  setNodes: (nodes: { label: string; code: string }[]) => void;
}

type SubTab = 'generate' | 'list';

const nodeFaqs = [
  { q: "What is a Node?", a: "A node is a unique QR identity for a specific table or location in your restaurant. Guests scan it to see your menu and start an ordering session." },
  { q: "Can I print these?", a: "Yes. Once your setup is complete, you can download all high-resolution QR codes as PNG images from your dashboard for physical printing." },
  { q: "Is there a limit?", a: "No. You can create as many table nodes as you need. Whether you have 5 tables or 500, the platform scales with you." },
  { q: "What happens if I delete a node?", a: "If you delete a node, the physical QR code associated with it will stop working immediately. You would need to print a new code for that table." }
];

const NodesStep: React.FC<NodesStepProps> = ({ nodes, setNodes }) => {
  const [activeTab, setActiveTab] = useState<SubTab>(nodes.length > 0 ? 'list' : 'generate');
  const [tableLabel, setTableLabel] = useState('Table ' + (nodes.length + 1));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFaq, setShowFaq] = useState(false);
  const [inspectingNode, setInspectingNode] = useState<{ label: string; code: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const QRious = (window as any).QRious;
    if (inspectingNode && qrCanvasRef.current && QRious) {
      const finalUrl = `https://men-brown.vercel.app/${inspectingNode.code}`;
      new QRious({ 
        element: qrCanvasRef.current, 
        size: 300, 
        value: finalUrl, 
        level: 'H', 
        foreground: '#000000', 
        background: '#ffffff', 
        padding: 0 
      });
    }
  }, [inspectingNode]);

  const generateUniqueCode = async (): Promise<string> => {
    let attempts = 0;
    while (attempts < 15) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data } = await MenuService.supabase
        .from('qr_codes')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      const localExists = nodes.some(n => n.code === code);
      if (!data && !localExists) return code;
      attempts++;
    }
    throw new Error("Unique ID error");
  };

  const handleAddNode = async () => {
    const label = tableLabel.trim();
    if (!label) return;
    if (nodes.some(n => n.label.toLowerCase() === label.toLowerCase())) {
      setError("Name already used.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const code = await generateUniqueCode();
      setNodes([...nodes, { label, code }]);
      setTableLabel('Table ' + (nodes.length + 2));
      setActiveTab('list');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!inspectingNode) return;
    const url = `https://men-brown.vercel.app/${inspectingNode.code}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    if (qrCanvasRef.current) {
      const link = document.createElement('a');
      link.href = qrCanvasRef.current.toDataURL("image/png");
      link.download = `QR_${inspectingNode?.label.replace(/\s+/g, '_')}.png`;
      link.click();
    }
  };

  if (showFaq) {
    return (
      <MenuFAQ 
        onBack={() => setShowFaq(false)} 
        title="Node Support" 
        items={nodeFaqs}
      />
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <header className="space-y-6 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Deployment Nodes</h1>
          <p className="text-[13px] font-medium text-slate-400 leading-relaxed px-4">
            Generate QR nodes for your tables.
            <button onClick={() => setShowFaq(true)} className="ml-1.5 text-[#007AFF] font-bold hover:underline">FAQs</button>
          </p>
        </div>

        <div className="bg-[#E8E8ED] p-1 rounded-xl flex border border-slate-200/50 shadow-inner max-w-sm mx-auto">
          <button onClick={() => setActiveTab('generate')} className={`flex-1 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'generate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Add New</button>
          <button onClick={() => setActiveTab('list')} className={`flex-1 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>My List {nodes.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white shadow-sm"></span>}</button>
        </div>
      </header>

      <main>
        {activeTab === 'generate' ? (
          <div className="space-y-10 animate-fade-in">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4">Table Name</label>
                <input type="text" value={tableLabel} onChange={e => setTableLabel(e.target.value)} className={`w-full bg-slate-50 border border-slate-100 p-6 rounded-2xl text-[17px] font-bold outline-none transition-all focus:bg-white focus:ring-4 ring-indigo-500/5 shadow-inner ${error ? 'border-rose-200' : ''}`} placeholder="e.g. Window Seat" />
                {error && <p className="text-rose-500 text-[11px] font-bold ml-4 animate-fade-in">{error}</p>}
              </div>
              <button onClick={handleAddNode} disabled={loading || !tableLabel.trim()} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all disabled:opacity-50">
                {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Create Table'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 gap-3">
              {nodes.length > 0 ? nodes.map((node, i) => (
                <div key={i} onClick={() => setInspectingNode(node)} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/50 flex items-center justify-between group animate-fade-in cursor-pointer active:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-500 border border-slate-100 shadow-sm"><i className="fa-solid fa-qrcode"></i></div>
                    <div>
                      <h4 className="text-[15px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-1.5">{node.label}</h4>
                      <p className="text-[9px] font-mono font-black text-slate-300 uppercase tracking-widest">ID: {node.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">Active</span>
                    <button onClick={(e) => { e.stopPropagation(); setNodes(nodes.filter((_, idx) => idx !== i)); }} className="w-10 h-10 rounded-full text-slate-200 hover:text-rose-500 transition-colors"><i className="fa-solid fa-circle-xmark"></i></button>
                  </div>
                </div>
              )) : (
                <div className="py-24 bg-white/50 border-4 border-dashed border-white rounded-3xl text-center flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-100 shadow-sm"><i className="fa-solid fa-chair text-3xl"></i></div>
                  <p className="text-[11px] font-black uppercase text-slate-300 tracking-[0.5em]">No tables added</p>
                  <button onClick={() => setActiveTab('generate')} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 active:scale-95 transition-all">Add First Table</button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {inspectingNode && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center animate-fade-in p-0">
          <div onClick={() => setInspectingNode(null)} className="absolute inset-0 bg-transparent backdrop-blur-xl" />
          <div className="relative bg-[#F2F2F7] w-full max-w-sm rounded-t-3xl shadow-2xl flex flex-col p-0 animate-slide-up overflow-hidden">
            <div className="w-12 h-1.5 bg-slate-300/50 rounded-full mx-auto my-5 shrink-0" />
            <header className="px-10 pb-6 shrink-0 text-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{inspectingNode.label}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Code: {inspectingNode.code}</p>
            </header>
            <div className="p-8 pt-0 space-y-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
                <canvas ref={qrCanvasRef} className="w-48 h-48"></canvas>
              </div>
              <div className="grid grid-cols-1 gap-3">
                 <button onClick={handleCopyLink} className={`w-full py-5 rounded-none font-bold text-[14px] transition-all active:scale-95 flex items-center justify-center gap-3 ${isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                   {isCopied ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-link text-indigo-400"></i>}
                   <span>{isCopied ? 'Link Copied' : 'Copy Link'}</span>
                 </button>
                 <button onClick={handleDownloadPNG} className="w-full py-5 bg-white border border-slate-200 text-slate-700 rounded-none font-bold text-[14px] active:bg-slate-50 transition-colors">Save PNG Image</button>
              </div>
              <button onClick={() => setInspectingNode(null)} className="w-full py-2 text-slate-300 font-black uppercase text-[10px] tracking-widest">Close</button>
            </div>
          </div>
        </div>
      )}
      <style>{` @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } } .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; } `}</style>
    </div>
  );
};

export default NodesStep;
