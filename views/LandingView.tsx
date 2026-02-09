
import React, { useState, useEffect, useRef } from 'react';

// --- Scroll Reveal Animation Wrapper ---
const Reveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ 
        transitionDelay: `${delay}ms`,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        opacity: isVisible ? 1 : 0
      }}
      className="transition-all duration-[1000ms] cubic-bezier(0.23, 1, 0.32, 1)"
    >
      {children}
    </div>
  );
};

interface LandingViewProps {
  onStart: () => void;
  onCreateMenu: () => void;
  onImportMenu: (config: any) => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onStart, onCreateMenu, onImportMenu }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [emailSub, setEmailSub] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImportClick = () => fileInputRef.current?.click();

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
    <div className="min-h-screen bg-[#FBFBFD] font-jakarta text-[#1D1D1F] selection:bg-[#007AFF]/20 selection:text-[#007AFF] overflow-x-hidden">
      
      {/* APPLE STYLE GLOBAL NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 border-b border-transparent ${isScrolled ? 'bg-white/80 backdrop-blur-2xl border-slate-200/50 shadow-sm py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-[1024px] mx-auto h-12 flex justify-between items-center px-6">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-8 h-8 bg-[#1D1D1F] rounded-lg flex items-center justify-center text-white">
              <i className="fa-solid fa-utensils text-[14px]"></i>
            </div>
            <span className="font-bold text-[19px] tracking-tight text-[#1D1D1F]">Foodie</span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
             <button onClick={onStart} className="hidden sm:block text-[13px] font-medium text-[#1D1D1F]/70 hover:text-[#007AFF] transition-colors">See demo</button>
             <button onClick={onCreateMenu} className="px-4 py-2 bg-[#1D1D1F] text-white rounded-full text-[13px] font-semibold hover:bg-black transition-all active:scale-95 shadow-sm">Get Started</button>
          </div>
        </div>
      </nav>

      {/* APPLE STYLE HERO SECTION */}
      <section className="relative pt-32 pb-16 md:pt-56 md:pb-40 text-center px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="space-y-6">
               <h2 className="text-[13px] md:text-[16px] font-bold text-[#FF6B00] uppercase tracking-[0.2em]">Platform Evolution</h2>
               <h1 className="text-[40px] md:text-[80px] font-bold tracking-[-0.04em] leading-[1.1] text-[#1D1D1F]">
                 The future of <br className="md:hidden" /> dining. <br className="hidden md:block" />
                 Simple. Seamless.
               </h1>
               <p className="text-[18px] md:text-[26px] text-[#86868B] font-medium max-w-2xl mx-auto mt-8 leading-snug">
                 Beautiful digital menus, sub-second ordering, and effortless kitchen sync. Built for the world's finest tables.
               </p>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-10 pt-10">
              <button 
                onClick={onCreateMenu}
                className="w-full sm:w-auto px-10 py-5 bg-[#007AFF] text-white rounded-full text-[17px] font-semibold transition-all hover:bg-[#0077ED] active:scale-95 shadow-lg shadow-[#007AFF]/20"
              >
                Create a menu now
              </button>
              <button 
                onClick={onStart}
                className="group text-[19px] font-medium text-[#007AFF] hover:underline flex items-center gap-2"
              >
                See demo <i className="fa-solid fa-chevron-right text-[12px] mt-0.5 group-hover:translate-x-0.5 transition-transform"></i>
              </button>
            </div>
          </Reveal>
          
          <Reveal delay={400}>
            <div className="relative mt-20 md:mt-32 mx-auto max-w-5xl">
               <div className="aspect-[16/10] md:aspect-[21/9] bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.06)] border border-slate-200/50 overflow-hidden relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2000" 
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[6s] ease-out opacity-90"
                    alt="Premium Dining Experience"
                  />
                  <div className="absolute inset-0 bg-black/5"></div>
                  <div className="absolute bottom-8 left-8 md:bottom-16 md:left-16 text-left space-y-3">
                     <p className="text-white text-[10px] md:text-[12px] font-bold uppercase tracking-[0.2em] opacity-70">Core Engine V4.5</p>
                     <h3 className="text-white text-2xl md:text-5xl font-bold tracking-tight">Industrial Strength <br/> Connectivity.</h3>
                  </div>
               </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TRUSTED BRANDS */}
      <section className="pb-32 px-6">
        <div className="max-w-[1024px] mx-auto text-center">
           <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-[0.1em] mb-12 opacity-60">Powering independent and franchise venues</p>
           <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 grayscale opacity-40">
              <i className="fa-brands fa-apple text-3xl"></i>
              <i className="fa-brands fa-airbnb text-3xl"></i>
              <i className="fa-brands fa-spotify text-3xl"></i>
              <i className="fa-brands fa-uber text-3xl"></i>
              <i className="fa-brands fa-stripe text-3xl"></i>
              <i className="fa-solid fa-cloud text-2xl"></i>
           </div>
        </div>
      </section>

      {/* BENTO GRID - OPTIMIZED FOR MOBILE */}
      <section className="py-24 md:py-40 bg-white">
        <div className="max-w-[1024px] mx-auto px-6">
          <header className="mb-20 text-center md:text-left">
            <h2 className="text-[36px] md:text-[64px] font-bold tracking-tight text-[#1D1D1F] leading-[1.1]">Built for the modern <br className="hidden md:block"/> guest experience.</h2>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            
            {/* Feature 1: Bento Card Large */}
            <div className="bg-[#F5F5F7] rounded-[2.5rem] p-8 md:p-14 flex flex-col justify-between min-h-[480px] md:h-[560px] overflow-hidden group border border-transparent hover:border-slate-200 transition-all">
               <div className="space-y-4">
                  <h3 className="text-[26px] md:text-[32px] font-bold tracking-tight">Real-time Sync.</h3>
                  <p className="text-[17px] md:text-[19px] text-[#86868B] font-medium leading-snug">Orders land on your kitchen terminal instantly. No more lost tickets or frantic staff communication.</p>
               </div>
               <div className="relative h-60 -mb-10 -mx-8 md:-mx-14 bg-white rounded-t-[2.5rem] shadow-2xl border-x border-t border-slate-200/50 p-8">
                  <div className="flex flex-col gap-5">
                    <div className="w-full h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center px-5 justify-between animate-pulse">
                      <div className="w-1/2 h-2 bg-slate-200 rounded-full"></div>
                      <div className="w-12 h-6 bg-emerald-100 rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div></div>
                    </div>
                    <div className="w-full h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center px-5 justify-between animate-pulse [animation-delay:0.2s]">
                      <div className="w-2/3 h-2 bg-slate-200 rounded-full"></div>
                      <div className="w-12 h-6 bg-orange-100 rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div></div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Feature 2: Bento Card Tall */}
            <div className="bg-[#1D1D1F] text-white rounded-[2.5rem] p-8 md:p-14 flex flex-col min-h-[480px] md:h-[560px] overflow-hidden group relative border border-white/5">
               <div className="space-y-4 mb-8">
                  <h3 className="text-[26px] md:text-[32px] font-bold tracking-tight">Zero Hardware.</h3>
                  <p className="text-[17px] md:text-[19px] text-slate-400 font-medium leading-snug">Scale your business without expensive tablets. Guests use the phone already in their hands.</p>
               </div>
               <div className="flex-1 flex items-center justify-center relative">
                  <div className="w-40 md:w-56 h-80 md:h-[450px] bg-[#1a1a1a] rounded-[3rem] border-[6px] md:border-[10px] border-[#333] shadow-[0_40px_80px_rgba(0,0,0,0.5)] relative flex flex-col p-4">
                     <div className="w-16 h-5 bg-[#333] rounded-full absolute top-2 left-1/2 -translate-x-1/2"></div>
                     <div className="flex-1 bg-[#FBFBFD] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden p-5 space-y-5">
                        <div className="w-10 h-10 rounded-xl bg-[#FF6B00]"></div>
                        <div className="space-y-3">
                           <div className="w-full h-3 bg-slate-200 rounded-full"></div>
                           <div className="w-3/4 h-3 bg-slate-100 rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="aspect-square bg-slate-100 rounded-2xl"></div>
                           <div className="aspect-square bg-slate-100 rounded-2xl"></div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Feature 3 & 4 (Grid Row 2) */}
            <div className="bg-[#F5F5F7] rounded-[2.5rem] p-8 md:p-14 space-y-6 border border-transparent hover:border-slate-200 transition-all flex flex-col justify-center text-center md:text-left">
                <div className="w-16 h-16 bg-[#007AFF] rounded-3xl flex items-center justify-center text-white shadow-xl shadow-[#007AFF]/20 mx-auto md:mx-0">
                  <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
                </div>
                <h3 className="text-[26px] font-bold tracking-tight">AI Concierge.</h3>
                <p className="text-[17px] text-[#86868B] font-medium leading-relaxed">Integrated Gemini 3.0 Pro recommends the perfect dish and pairing based on your guest's mood.</p>
            </div>

            <div className="bg-[#F5F5F7] rounded-[2.5rem] p-8 md:p-14 space-y-6 border border-transparent hover:border-slate-200 transition-all flex flex-col justify-center text-center md:text-left">
                <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mx-auto md:mx-0">
                  <i className="fa-solid fa-chart-line text-xl"></i>
                </div>
                <h3 className="text-[26px] font-bold tracking-tight">Live Analytics.</h3>
                <p className="text-[17px] text-[#86868B] font-medium leading-relaxed">Real-time revenue monitoring and inventory alerts keep you informed wherever you are.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TECHNICAL STATS */}
      <section className="py-24 md:py-48 px-6 bg-[#FBFBFD]">
        <div className="max-w-[1024px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
           <Reveal>
              <div className="space-y-4 text-center md:text-left">
                 <h4 className="text-[44px] md:text-[60px] font-bold tracking-tight text-[#1D1D1F]">99.99%</h4>
                 <p className="text-[15px] font-bold text-[#86868B] uppercase tracking-[0.2em]">Core Uptime</p>
                 <p className="text-[16px] text-[#86868B] font-medium leading-relaxed">Enterprise-grade cloud infrastructure ensures your menu is always serving.</p>
              </div>
           </Reveal>
           <Reveal delay={100}>
              <div className="space-y-4 text-center md:text-left">
                 <h4 className="text-[44px] md:text-[60px] font-bold tracking-tight text-[#1D1D1F]">&lt;200ms</h4>
                 <p className="text-[15px] font-bold text-[#86868B] uppercase tracking-[0.2em]">Latencies</p>
                 <p className="text-[16px] text-[#86868B] font-medium leading-relaxed">Edge network delivery provides instantaneous transitions and updates.</p>
              </div>
           </Reveal>
           <Reveal delay={200}>
              <div className="space-y-4 text-center md:text-left">
                 <h4 className="text-[44px] md:text-[60px] font-bold tracking-tight text-[#1D1D1F]">∞</h4>
                 <p className="text-[15px] font-bold text-[#86868B] uppercase tracking-[0.2em]">Scalability</p>
                 <p className="text-[16px] text-[#86868B] font-medium leading-relaxed">From single-table cafes to global franchises, our platform scales effortlessly.</p>
              </div>
           </Reveal>
        </div>
      </section>

      {/* CLEAN NEWSLETTER SECTION */}
      <section className="py-20 md:py-32 bg-white px-6">
         <div className="max-w-[1024px] mx-auto bg-[#F5F5F7] rounded-[3rem] p-10 md:p-20 flex flex-col md:flex-row items-center gap-10 md:gap-20">
            <div className="flex-1 space-y-4 text-center md:text-left">
               <h3 className="text-[28px] md:text-[40px] font-bold tracking-tight">Stay in the loop.</h3>
               <p className="text-[17px] md:text-[19px] text-[#86868B] font-medium leading-snug">Get the latest on restaurant technology <br className="hidden md:block" /> and modern hospitality trends.</p>
            </div>
            <div className="w-full md:w-[380px]">
               <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="relative">
                     <input 
                       type="email" 
                       placeholder="Email address"
                       value={emailSub}
                       onChange={(e) => setEmailSub(e.target.value)}
                       className="w-full px-6 py-5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-[#007AFF]/5 transition-all text-[16px] font-medium placeholder:text-slate-300"
                     />
                     <button className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#1D1D1F] text-white rounded-xl flex items-center justify-center transition-all hover:bg-black active:scale-95">
                        <i className="fa-solid fa-arrow-right"></i>
                     </button>
                  </div>
                  <p className="text-[11px] text-[#86868B] text-center md:text-left px-1 font-medium italic opacity-70">Requires opt-in. Cancel anytime.</p>
               </form>
            </div>
         </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-32 md:py-56 px-6 text-center">
         <div className="max-w-2xl mx-auto space-y-10">
            <Reveal>
              <h2 className="text-[40px] md:text-[72px] font-bold tracking-tight leading-[1.05]">Deploy today. <br/> Serve forever.</h2>
              <p className="text-[18px] md:text-[24px] text-[#86868B] font-medium max-w-xl mx-auto mt-6">Join hundreds of merchants modernizing the table-to-kitchen workflow with Foodie Premium.</p>
            </Reveal>
            <Reveal delay={200}>
              <div className="flex flex-col items-center gap-8 pt-8">
                <button onClick={onCreateMenu} className="w-full sm:w-auto px-12 py-6 bg-[#007AFF] text-white rounded-full text-[19px] font-semibold hover:bg-[#0077ED] transition-all shadow-xl shadow-[#007AFF]/20 active:scale-95">Launch Your Menu</button>
                <button onClick={handleImportClick} className="text-[#86868B] hover:text-[#1D1D1F] text-[14px] font-semibold flex items-center gap-3 group">
                   <i className="fa-solid fa-cloud-arrow-down group-hover:scale-110 transition-transform"></i> Load Configuration
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
              </div>
            </Reveal>
         </div>
      </section>

      {/* APPLE STYLE FOOTER */}
      <footer className="bg-[#F5F5F7] pt-20 pb-12 px-6">
        <div className="max-w-[1024px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pb-16 border-b border-slate-300/50">
             <div className="space-y-6">
                <h4 className="text-[11px] font-bold text-[#1D1D1F] uppercase tracking-[0.1em]">Product</h4>
                <ul className="space-y-3 text-[13px] font-medium text-[#424245]">
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">Digital Menu</li>
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">Staff Terminal</li>
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">Analytics</li>
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">Table QR Nodes</li>
                </ul>
             </div>
             <div className="space-y-6">
                <h4 className="text-[11px] font-bold text-[#1D1D1F] uppercase tracking-[0.1em]">Business</h4>
                <ul className="space-y-3 text-[13px] font-medium text-[#424245]">
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">Merchant Portal</li>
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">Pricing Plans</li>
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">Success Stories</li>
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">Enterprise</li>
                </ul>
             </div>
             <div className="space-y-6">
                <h4 className="text-[11px] font-bold text-[#1D1D1F] uppercase tracking-[0.1em]">Resources</h4>
                <ul className="space-y-3 text-[13px] font-medium text-[#424245]">
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">Support Center</li>
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">API Docs</li>
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">Branding</li>
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">Staff Guides</li>
                </ul>
             </div>
             <div className="space-y-6">
                <h4 className="text-[11px] font-bold text-[#1D1D1F] uppercase tracking-[0.1em]">Legal</h4>
                <ul className="space-y-3 text-[13px] font-medium text-[#424245]">
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">Privacy Policy</li>
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">Terms of Use</li>
                   <li className="hover:text-[#007AFF] cursor-pointer transition-colors">Cookie Settings</li>
                </ul>
             </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-8">
             <p className="text-[12px] font-medium text-[#86868B]">Copyright © 2025 Platinum Digital Solutions. All rights reserved.</p>
             <div className="flex gap-8 items-center">
                <span className="text-[12px] font-medium text-[#86868B]">United States</span>
                <div className="flex gap-6 text-[#1D1D1F] opacity-60">
                  <i className="fa-brands fa-instagram text-lg cursor-pointer hover:opacity-100 transition-opacity"></i>
                  <i className="fa-brands fa-x-twitter text-lg cursor-pointer hover:opacity-100 transition-opacity"></i>
                  <i className="fa-brands fa-linkedin text-lg cursor-pointer hover:opacity-100 transition-opacity"></i>
                </div>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
