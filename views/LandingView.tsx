
import React, { useState, useEffect, useRef } from 'react';

// --- Intersection Observer for Scroll Reveals ---
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
      className="transition-all duration-1000 ease-out"
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
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
    <div className="min-h-screen bg-white font-['Plus_Jakarta_Sans'] text-slate-900 overflow-x-hidden selection:bg-indigo-100">
      
      {/* --- Dynamic Navbar --- */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-8 py-6 ${isScrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-100 py-4 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-bolt"></i>
            </div>
            <h1 className="font-black text-2xl tracking-tighter uppercase italic">SHARP.</h1>
          </div>
          
          <div className="hidden lg:flex items-center gap-12">
            {['Services', 'Pricing', 'Deployment'].map(l => (
              <button key={l} className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">{l}</button>
            ))}
          </div>

          <div className="flex gap-4">
            <button onClick={onStart} className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-indigo-600 transition-all shadow-xl active:scale-95">Demo</button>
          </div>
        </div>
      </nav>

      {/* --- Premium Hero Section --- */}
      <section className="relative pt-48 pb-32 lg:pt-64 lg:pb-60 px-8 bg-slate-50 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-50/30 skew-x-12 translate-x-32 pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-50 rounded-full blur-[120px] opacity-40"></div>
        
        <div className="max-w-[1200px] mx-auto relative z-10 text-center lg:text-left">
          <div className="space-y-16">
            <Reveal>
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-slate-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">Enterprise Grade Digital Solutions</span>
              </div>
            </Reveal>
            
            <Reveal delay={150}>
              <h1 className="text-6xl md:text-8xl lg:text-[11rem] font-black text-slate-900 tracking-tighter leading-[0.8] uppercase italic">
                THE FUTURE<br />
                <span className="text-indigo-600">OF DINING</span><br />
                IS SHARP.
              </h1>
            </Reveal>

            <Reveal delay={300}>
              <p className="text-slate-500 text-lg md:text-2xl font-medium leading-relaxed max-w-3xl mx-auto lg:mx-0">
                Enterprise-grade digital menus, real-time ordering, and analytics for modern hospitality. Built for the web, optimized for humans.
              </p>
            </Reveal>

            <Reveal delay={450}>
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
                <button 
                  onClick={onStart} 
                  className="px-14 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.5em] shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-black transition-all active:scale-95"
                >
                  Launch Demo
                </button>
                <button 
                  onClick={onCreateMenu} 
                  className="px-14 py-8 bg-white text-indigo-600 border-2 border-indigo-100 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.5em] hover:bg-indigo-50 transition-all active:scale-95 shadow-sm"
                >
                  Deploy Menu
                </button>
              </div>
              
              <div className="mt-14">
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                <button onClick={handleImportClick} className="group flex items-center justify-center lg:justify-start gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">
                  <i className="fa-solid fa-file-import group-hover:rotate-12 transition-transform"></i>
                  Load configuration artifact
                </button>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Floating Visual Element */}
        <div className="hidden lg:block absolute bottom-0 right-0 w-[42%] translate-y-12 pointer-events-none">
           <div className="relative aspect-[4/5] bg-white rounded-[4.5rem] shadow-2xl p-4 rotate-3 border border-slate-100 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1550966841-3ee4ad6b105a?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover rounded-[3.6rem]" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent"></div>
              <div className="absolute top-1/2 left-0 -translate-x-1/2 bg-indigo-600 text-white p-12 rounded-[3.5rem] shadow-2xl">
                 <i className="fa-solid fa-qrcode text-6xl"></i>
              </div>
           </div>
        </div>
      </section>

      {/* --- Simple Features (Direct English) --- */}
      <section className="py-32 lg:py-56 px-8 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            {[
              { icon: 'fa-bolt-lightning', title: 'Instant Live Menu', desc: 'Update your dishes or prices and your customers see the changes immediately. No app needed, just a web link.' },
              { icon: 'fa-mobile-screen-button', title: 'Designed for Mobile', desc: 'Built from the ground up for phones. Large text, clear buttons, and fast loading for a smooth guest experience.' },
              { icon: 'fa-chart-line', title: 'Smart Analytics', desc: 'Track every order and see your best-selling items in real-time. Use data to grow your business effectively.' }
            ].map((f, i) => (
              <Reveal key={i} delay={i * 150}>
                <div className="space-y-8 group">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500 shadow-sm border border-indigo-100/50">
                    <i className={`fa-solid ${f.icon}`}></i>
                  </div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">{f.title}</h3>
                  <p className="text-slate-500 text-lg font-medium leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --- Architectural Footer --- */}
      <footer className="pt-24 pb-32 px-8 border-t border-slate-50">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
               <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">System Secure</p>
               <h4 className="font-black text-lg text-slate-900 tracking-tighter uppercase italic">SHARP ENTERPRISE.</h4>
            </div>
          </div>
          
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 text-center">© 2025 ALL RIGHTS RESERVED. OPTIMIZED FOR ENTERPRISE OPS.</p>
          
          <div className="flex gap-10 text-slate-300 text-xl">
             <i className="fa-brands fa-instagram hover:text-indigo-600 transition-colors cursor-pointer"></i>
             <i className="fa-brands fa-x-twitter hover:text-indigo-600 transition-colors cursor-pointer"></i>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
