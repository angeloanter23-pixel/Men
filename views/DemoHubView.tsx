import React, { useEffect, useRef, useState } from 'react';
import * as MenuService from '../services/menuService';
import { LandingNav } from '../landing-page/LandingNav';
import { LandingFooter } from '../landing-page/LandingFooter';

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

const DemoHubView: React.FC<{ onBack: () => void; onSelectDemo: (code: string) => void; onSignUp: () => void }> = ({ onBack, onSelectDemo, onSignUp }) => {
  const [loadingDemo, setLoadingDemo] = React.useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [demoRestaurant, setDemoRestaurant] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchDemo = async () => {
        setLoadingStatus('Looking for available demo menu...');
        const details = await MenuService.getQRCodeByCode('93QBAW');
        setLoadingStatus('Fetching data...');
        if (details) {
            setDemoRestaurant({
                id: "01",
                label: "Demo",
                name: details.restaurant_name,
                industry: details.restaurant?.industry || 'Cafe & Bakery',
                desc: details.restaurant?.description || details.restaurant?.desc || 'Great for busy coffee shops. Customers can quickly add milk options or extra shots to their drinks.',
                code: details.code,
                table: details.label,
                accent: details.restaurant?.theme?.accent || '#FF6B00',
                image: details.restaurant?.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800'
            });
        }
        setLoadingStatus('');
    };
    fetchDemo();
  }, []);

  const handleDemoClick = (code: string) => {
    setLoadingDemo(code);
    setTimeout(() => {
        onSelectDemo(code);
    }, 500);
  };


  return (
    <div className="min-h-screen bg-white font-jakarta pb-40">
      <LandingNav isScrolled={isScrolled} onOpenMenu={() => {}} />
      
      <main className="max-w-[1100px] mx-auto px-6 py-20 space-y-32">
        <section className="text-center space-y-6 max-w-3xl mx-auto">
           <div className="inline-flex px-5 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] shadow-sm">Try our Demo</div>
           <h2 className="text-[42px] md:text-[64px] font-black text-slate-900 tracking-tight leading-[1.1] uppercase">
             Try the Demo
           </h2>
           <p className="text-slate-500 text-[18px] md:text-[21px] font-medium leading-relaxed">
             Select the restaurant below to test our menu. This is a mockup store that shows you how fast ordering works for your guests.
           </p>
           {loadingStatus && (
               <p className="text-orange-600 font-bold text-sm animate-pulse">{loadingStatus}</p>
           )}
        </section>

        <div className="grid grid-cols-1 gap-12">
          {demoRestaurant && (
            <div 
              className="bg-slate-50 rounded-[4rem] p-8 md:p-16 border border-slate-100/50 hover:bg-white hover:shadow-[0_40px_100px_rgba(0,0,0,0.06)] hover:border-orange-100 transition-all duration-700 group relative overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
                <div className="lg:col-span-7 space-y-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="text-5xl font-black text-orange-500/20 tabular-nums">{demoRestaurant.id}</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">{demoRestaurant.label}</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.4em]">{demoRestaurant.industry}</p>
                        <h3 className="text-[36px] md:text-[52px] font-black text-slate-900 leading-none tracking-tight uppercase">{demoRestaurant.name}</h3>
                        <p className="text-indigo-600 font-bold text-sm tracking-[0.2em] uppercase leading-none pt-2">Table: {demoRestaurant.table}</p>
                    </div>
                  </div>

                  <p className="text-slate-500 text-[16px] md:text-[18px] font-medium leading-relaxed max-w-xl">
                    {demoRestaurant.desc}
                  </p>

                  <button 
                    onClick={() => handleDemoClick(demoRestaurant.code)}
                    disabled={loadingDemo !== null}
                    className="w-full md:w-auto px-12 py-6 bg-slate-900 text-white rounded-full font-black uppercase text-[12px] tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 group-hover:bg-orange-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loadingDemo === demoRestaurant.code ? (
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
                    <QRComponent code={demoRestaurant.code} />
                </div>
              </div>
            </div>
          )}
        </div>

        <section className="bg-slate-50 rounded-[3rem] p-10 md:p-12 border border-slate-100 text-center space-y-6">
            <h4 className="text-lg font-bold text-slate-900 uppercase mb-4">Demo Restrictions</h4>
            <p className="text-[15px] text-slate-600 leading-relaxed max-w-2xl mx-auto">
                Please note that in this demo environment, some features are restricted to prevent unauthorized modifications. 
                While some items are editable, all changes made to the demo menu will be automatically erased every 24 hours.
            </p>
            <button 
                onClick={onSignUp}
                className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold uppercase text-[12px] tracking-[0.2em] shadow-lg hover:bg-indigo-700 transition-all"
            >
                Create Your Own Restaurant
            </button>
        </section>

        <LandingFooter 
            onStart={() => {}}
            onCreateMenu={() => {}}
            onInvestmentClick={() => {}}
            onCareerClick={() => {}}
            onShopClick={() => {}}
            onEnterpriseClick={() => {}}
            onGuidesClick={() => {}}
            onCaseStudiesClick={() => {}}
            onHelpCenterClick={() => {}}
            onPrivacyClick={() => {}}
            onTermsClick={() => {}}
            onNodeRegistryClick={() => {}}
            onComplianceClick={() => {}}
        />
      </main>
    </div>
  );
};

export default DemoHubView;
