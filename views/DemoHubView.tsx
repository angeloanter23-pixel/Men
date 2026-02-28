
import React, { useEffect, useRef } from 'react';

const DEMO_RESTAURANTS = [
  { 
    id: "01",
    label: "Demo",
    name: 'The Coffee House', 
    industry: 'Cafe & Bakery', 
    desc: 'Great for busy coffee shops. Customers can quickly add milk options or extra shots to their drinks.', 
    code: 'aeec6204-496e-46c4-adfb-ba154fa92153',
    table: 'Counter 02',
    accent: '#FF6B00',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800'
  }
];

const QRComponent: React.FC<{ code: string }> = ({ code }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const QRious = (window as any).QRious;
        if (canvasRef.current && QRious) {
            new QRious({
                element: canvasRef.current,
                size: 360, 
                value: `${window.location.origin}/${code}`,
                level: 'H',
                foreground: '#0f172a',
                background: 'transparent',
                padding: 0
            });
        }
    }, [code]);

    return (
        <div className="flex flex-col items-center gap-6 transition-all duration-500 hover:scale-105">
            <canvas ref={canvasRef} className="w-64 h-64 sm:w-80 sm:h-80"></canvas>
            <div className="text-center">
                <span className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">Scan this QR code</span>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Code: {code}</p>
            </div>
        </div>
    );
};

const DemoHubView: React.FC<{ onBack: () => void; onSelectDemo: (code: string) => void }> = ({ onBack, onSelectDemo }) => {
  const [loadingDemo, setLoadingDemo] = React.useState<string | null>(null);

  const handleDemoClick = (code: string) => {
    setLoadingDemo(code);
    // Simulate a short delay for visual feedback if needed, but keep it fast
    setTimeout(() => {
        onSelectDemo(code);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white font-jakarta pb-40">
      <header className="bg-white/90 backdrop-blur-2xl sticky top-0 z-[100] border-b border-slate-100 px-6 h-[72px] flex items-center justify-between">
        <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90 border border-slate-100">
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                  <span className="text-[10px] font-bold">M</span>
                </div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none uppercase">mymenu.asia</h1>
              </div>
            </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-20 space-y-32">
        <section className="text-center space-y-6 max-w-3xl mx-auto">
           <div className="inline-flex px-5 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] shadow-sm">Try our Demo</div>
           <h2 className="text-[42px] md:text-[64px] font-black text-slate-900 tracking-tight leading-[1.1] uppercase">
             Try the Demo
           </h2>
           <p className="text-slate-500 text-[18px] md:text-[21px] font-medium leading-relaxed">
             Select the restaurant below to test our menu. This is a mockup store that shows you how fast ordering works for your guests.
           </p>
        </section>

        <div className="grid grid-cols-1 gap-12">
          {DEMO_RESTAURANTS.map((demo, idx) => (
            <div 
              key={idx} 
              className="bg-slate-50 rounded-[4rem] p-8 md:p-16 border border-slate-100/50 hover:bg-white hover:shadow-[0_40px_100px_rgba(0,0,0,0.06)] hover:border-orange-100 transition-all duration-700 group relative overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
                <div className="lg:col-span-7 space-y-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="text-5xl font-black text-orange-500/20 tabular-nums">{demo.id}</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">{demo.label}</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.4em]">{demo.industry}</p>
                        <h3 className="text-[36px] md:text-[52px] font-black text-slate-900 leading-none tracking-tight uppercase">{demo.name}</h3>
                        <p className="text-indigo-600 font-bold text-sm tracking-[0.2em] uppercase leading-none pt-2">Table: {demo.table}</p>
                    </div>
                  </div>

                  <p className="text-slate-500 text-[16px] md:text-[18px] font-medium leading-relaxed max-w-xl">
                    {demo.desc}
                  </p>

                  <button 
                    onClick={() => handleDemoClick(demo.code)}
                    disabled={loadingDemo !== null}
                    className="w-full md:w-auto px-12 py-6 bg-slate-900 text-white rounded-full font-black uppercase text-[12px] tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 group-hover:bg-orange-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loadingDemo === demo.code ? (
                        <>
                            <i className="fa-solid fa-spinner animate-spin text-sm"></i>
                            Loading...
                        </>
                    ) : (
                        <>
                            Open Demo Menu
                            <i className="fa-solid fa-arrow-right text-[10px] transition-transform group-hover:translate-x-1"></i>
                        </>
                    )}
                  </button>
                </div>

                <div className="lg:col-span-5 flex flex-col items-center">
                    <QRComponent code={demo.code} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-white rounded-[4rem] p-12 md:p-20 grid grid-cols-1 md:grid-cols-3 gap-16 border border-slate-100 shadow-2xl shadow-slate-200/50">
           <div className="space-y-6">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl"><i className="fa-solid fa-bolt"></i></div>
              <h4 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Fast Sync</h4>
              <p className="text-[14px] text-slate-500 font-medium leading-relaxed">Orders go from the phone to the kitchen staff in less than a second.</p>
           </div>
           <div className="space-y-6">
              <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-xl"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
              <h4 className="text-xl font-bold tracking-tight text-slate-900 uppercase">AI Helper</h4>
              <p className="text-[14px] text-slate-500 font-medium leading-relaxed">Our AI helps guests choose the best food based on what they like.</p>
           </div>
           <div className="space-y-6">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl"><i className="fa-solid fa-shield-halved"></i></div>
              <h4 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Safe & Private</h4>
              <p className="text-[14px] text-slate-500 font-medium leading-relaxed">Every table is private and secure. No personal data is stored.</p>
           </div>
        </section>

        <footer className="text-center pt-10 opacity-40">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.6em]">Demo Version 4.5.2 • 2025</p>
        </footer>
      </main>
    </div>
  );
};

export default DemoHubView;
