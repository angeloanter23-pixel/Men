
import React, { useState, useEffect, useRef } from 'react';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left"
      >
        <span className="font-bold text-slate-800 text-sm">{question}</span>
        <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'} text-[10px] text-slate-300 transition-all`}></i>
      </button>
      {isOpen && <p className="mt-3 text-slate-500 text-xs leading-relaxed animate-fade-in">{answer}</p>}
    </div>
  );
};

interface LandingViewProps {
  onStart: () => void;
  onCreateMenu: () => void;
  onImportMenu: (config: any) => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onStart, onCreateMenu, onImportMenu }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const slides = [
    {
      title: "Real-time Synchronization",
      desc: "Changes made in the kitchen reflect instantly on every customer's table.",
      icon: "fa-bolt",
      color: "text-orange-500"
    },
    {
      title: "Smart Analytics",
      desc: "Understand your peak hours and trending dishes with one click.",
      icon: "fa-chart-pie",
      color: "text-indigo-500"
    },
    {
      title: "Multi-branch Control",
      desc: "Scale your business with centralized menu and branch management.",
      icon: "fa-sitemap",
      color: "text-emerald-500"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target?.result as string);
        onImportMenu(config);
      } catch (err) {
        alert("Invalid configuration file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in overflow-x-hidden font-['Plus_Jakarta_Sans']">
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 bg-[#0f172a] overflow-hidden rounded-b-[4rem]">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-orange-600 rounded-full blur-[150px] animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[150px]"></div>
        </div>
        
        <div className="relative text-center space-y-8 z-10">
          <div className="inline-block bg-white/5 backdrop-blur-xl px-5 py-2 rounded-full border border-white/10 shadow-2xl">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-400">Offline-Ready Ecosystem</span>
          </div>
          <h1 className="text-6xl font-black text-white leading-[0.9] tracking-tighter italic uppercase">
            SHARP<span className="text-orange-500">QR</span><br />
            <span className="text-indigo-400">REIMAGINED.</span>
          </h1>
          <p className="text-slate-400 text-base max-w-xs mx-auto leading-relaxed font-medium">
            The ultimate digital menu ecosystem. Works anywhere, anytime, without cloud dependency.
          </p>
          <div className="flex flex-col gap-4 items-center pt-6">
            <div className="flex gap-4 w-full justify-center">
              <button onClick={onStart} className="flex-1 max-w-[160px] bg-indigo-600 text-white px-4 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-indigo-500/30 active:scale-95 transition-all">
                Explore
              </button>
              <button onClick={onCreateMenu} className="flex-1 max-w-[160px] bg-orange-500 text-white px-4 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-orange-500/30 active:scale-95 hover:bg-orange-600 transition-all">
                Create Menu
              </button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleFileChange} 
            />
            <button 
              onClick={handleImportClick}
              className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] hover:text-white transition-colors"
            >
              Import Existing Menu JSON
            </button>
          </div>
        </div>

        {/* Visual Mockup */}
        <div className="mt-16 relative flex justify-center perspective-1000">
            <div className="relative w-56 h-96 bg-slate-800 border-8 border-slate-700/50 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-float rotate-x-12">
                <div className="h-full w-full bg-slate-900 p-0 flex flex-col">
                   <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400" className="h-2/3 object-cover opacity-80" alt="Restaurant Interior" />
                   <div className="flex-1 bg-gradient-to-t from-slate-950 to-slate-900 p-6 flex flex-col justify-center items-center gap-6">
                      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                         <i className="fa-solid fa-qrcode text-4xl text-orange-500 animate-pulse"></i>
                      </div>
                      <div className="space-y-3 w-full">
                         <div className="w-2/3 h-2.5 bg-white/20 rounded-full mx-auto"></div>
                         <div className="w-1/2 h-2.5 bg-white/10 rounded-full mx-auto"></div>
                      </div>
                   </div>
                </div>
            </div>
            <div className="absolute top-10 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
      </section>

      {/* Feature Carousel */}
      <section className="py-20 px-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden">
            <div className="relative z-10 min-h-[160px] flex flex-col justify-center text-center space-y-4">
              <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center bg-slate-50 transition-colors ${slides[activeSlide].color}`}>
                <i className={`fa-solid ${slides[activeSlide].icon} text-2xl`}></i>
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{slides[activeSlide].title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{slides[activeSlide].desc}</p>
            </div>
            <div className="flex justify-center gap-2 mt-8">
              {slides.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all ${activeSlide === i ? 'w-8 bg-indigo-600' : 'bg-slate-200'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-12 px-6 space-y-8">
        <h2 className="text-4xl font-black text-slate-900 text-center uppercase tracking-tighter leading-none italic">
          THE <span className="text-orange-500">ADVANTAGE</span>
        </h2>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <h4 className="text-[10px] font-black uppercase text-slate-300 mb-8 tracking-[0.3em] relative z-10">Traditional Menu</h4>
            <div className="space-y-6 relative z-10">
              {[
                { label: "High Printing Costs", icon: "fa-circle-xmark" },
                { label: "Slow Price Updates", icon: "fa-circle-xmark" },
                { label: "Zero Analytics", icon: "fa-circle-xmark" }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-4 text-sm font-bold text-slate-400">
                  <i className={`fa-solid ${item.icon} text-rose-500 text-base`}></i>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-600 p-10 rounded-[3rem] shadow-2xl shadow-indigo-200 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
            <h4 className="text-[10px] font-black uppercase text-indigo-200 mb-8 tracking-[0.3em] relative z-10">Sharp QR Ecosystem</h4>
            <div className="space-y-6 relative z-10">
              {[
                { label: "Zero Print Costs", icon: "fa-circle-check" },
                { label: "1s Instant Sync", icon: "fa-circle-check" },
                { label: "Full Customer Insights", icon: "fa-circle-check" }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-4 text-sm font-black text-white">
                  <i className={`fa-solid ${item.icon} text-emerald-400 text-base`}></i>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-8">
        <h2 className="text-3xl font-black text-slate-800 mb-10 uppercase tracking-tighter italic">COMMON <span className="text-indigo-600">QUERIES</span></h2>
        <div className="space-y-2">
           <FAQItem 
             question="Does this require an internet connection?" 
             answer="The system is designed for local-first usage. While a connection is needed to load the initial site, all menu data, ordering, and admin management can run strictly on your local browser's storage." 
           />
           <FAQItem 
             question="Is there a subscription fee?" 
             answer="We offer one-time payment plans for lifetime local access, or annual plans for cloud synchronization features." 
           />
           <FAQItem 
             question="How do I back up my data?" 
             answer="You can export your entire menu and branch configuration as a JSON file at any time from the Merchant Dashboard." 
           />
        </div>
      </section>

      <footer className="py-20 bg-slate-900 text-center px-8 border-t border-white/5 rounded-t-[4rem]">
         <h2 className="font-black text-3xl text-orange-600 tracking-tighter italic mb-6">FOODIE.</h2>
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-10">© 2025 SHARP QR TECHNOLOGIES</p>
         <button onClick={onStart} className="w-full max-w-[300px] bg-white text-slate-900 py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all mx-auto block">
            ENTER ECOSYSTEM
         </button>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotateX(12deg); }
          50% { transform: translateY(-30px) rotateX(15deg) rotateZ(1deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .rotate-x-12 {
          transform: rotateX(12deg);
        }
      `}</style>

    </div>
  );
};

export default LandingView;
