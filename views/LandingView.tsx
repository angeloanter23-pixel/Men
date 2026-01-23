
import React, { useState, useEffect, useRef } from 'react';

// --- Intersection Observer Component for Scroll Reveals ---
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; direction?: 'up' | 'left' | 'right' }> = ({ children, delay = 0, direction = 'up' }) => {
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

  const getTransform = () => {
    if (isVisible) return 'translate(0, 0)';
    switch (direction) {
      case 'up': return 'translateY(40px)';
      case 'left': return 'translateX(-40px)';
      case 'right': return 'translateX(40px)';
      default: return 'translateY(40px)';
    }
  };

  return (
    <div
      ref={ref}
      style={{ 
        transitionDelay: `${delay}ms`,
        transform: getTransform(),
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

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
    <div className="min-h-screen bg-white overflow-x-hidden font-['Plus_Jakarta_Sans'] selection:bg-indigo-100 selection:text-indigo-900 w-full">
      
      {/* --- Top Navigation --- */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 py-4 w-full ${isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-[1600px] mx-auto flex justify-between items-center lg:px-12">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
             <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <i className="fa-solid fa-bolt text-sm lg:text-lg"></i>
             </div>
             <h1 className={`font-black text-xl lg:text-2xl tracking-tighter italic uppercase ${isScrolled ? 'text-slate-900' : 'text-white'}`}>SHARP<span className="text-orange-500">QR</span></h1>
          </div>
          
          <div className="hidden md:flex items-center gap-12">
            {['About', 'How it Works', 'Testimonials', 'Contact'].map(link => (
              <button 
                key={link} 
                onClick={() => scrollToSection(link.toLowerCase().replace(/\s+/g, '-'))}
                className={`text-[11px] lg:text-[12px] font-black uppercase tracking-widest transition-all hover:scale-110 active:scale-95 ${isScrolled ? 'text-slate-500 hover:text-indigo-600' : 'text-white/60 hover:text-white'}`}
              >
                {link}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onStart} className={`hidden sm:block px-8 py-3 rounded-xl text-[10px] lg:text-[12px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${isScrolled ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-indigo-600'}`}>
              Try Demo
            </button>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative min-h-[90vh] lg:min-h-screen flex items-center justify-center px-6 bg-[#0f172a] overflow-hidden rounded-b-[4rem] lg:rounded-b-[10rem] w-full">
        {/* Background Lights */}
        <div className="absolute top-0 left-0 w-full h-full opacity-50 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] lg:w-[1200px] h-[800px] lg:h-[1200px] bg-orange-600/40 rounded-full blur-[200px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[800px] lg:w-[1200px] h-[800px] lg:h-[1200px] bg-indigo-600/40 rounded-full blur-[200px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        </div>
        
        <div className="relative text-center space-y-12 lg:space-y-20 z-10 max-w-[1400px] mx-auto w-full py-32">
          <Reveal>
            <div className="inline-block bg-white/5 backdrop-blur-2xl px-8 py-4 rounded-full border border-white/10 shadow-2xl mb-8">
              <span className="text-[10px] lg:text-[14px] font-black uppercase tracking-[0.6em] text-orange-400">Enterprise Grade Digital Solutions</span>
            </div>
          </Reveal>
          
          <Reveal delay={200}>
            <h1 className="text-6xl md:text-9xl lg:text-[14rem] font-black text-white leading-[0.8] tracking-tighter italic uppercase">
              THE FUTURE<br />
              <span className="text-orange-500">OF DINING</span><br />
              <span className="opacity-90">IS SHARP.</span>
            </h1>
          </Reveal>

          <Reveal delay={400}>
            <p className="text-slate-400 text-lg lg:text-2xl max-w-3xl mx-auto leading-relaxed font-medium">
              Enterprise-grade digital menus, real-time ordering, and analytics for modern hospitality. Built for the web, optimized for humans.
            </p>
          </Reveal>

          <Reveal delay={600}>
            <div className="flex flex-col gap-10 items-center pt-8">
              <div className="flex flex-col sm:flex-row gap-6 w-full justify-center max-w-4xl">
                <button onClick={onStart} className="flex-1 bg-white text-indigo-950 px-12 py-8 rounded-[3rem] font-black uppercase text-[12px] lg:text-[14px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-50 border-4 border-transparent hover:border-indigo-100">
                  Launch Demo
                </button>
                <button onClick={onCreateMenu} className="flex-1 bg-orange-500 text-white px-12 py-8 rounded-[3rem] font-black uppercase text-[12px] lg:text-[14px] tracking-[0.4em] shadow-2xl shadow-orange-500/30 active:scale-95 hover:bg-orange-600 transition-all border-4 border-transparent hover:border-orange-400">
                  Deploy Menu
                </button>
              </div>
              
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
              <button onClick={handleImportClick} className="group text-[11px] lg:text-[13px] text-slate-500 font-black uppercase tracking-[0.4em] hover:text-white transition-all flex items-center gap-3">
                <i className="fa-solid fa-file-import group-hover:rotate-12 transition-transform"></i> 
                Load configuration artifact
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --- About Section --- */}
      <section id="about" className="py-32 lg:py-64 px-12 bg-white w-full overflow-hidden">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-48 items-center">
          <Reveal direction="left">
            <div className="space-y-10">
              <p className="text-[12px] lg:text-[14px] font-black uppercase text-indigo-500 tracking-[0.5em] italic">Precision Engineering</p>
              <h2 className="text-6xl lg:text-9xl font-black text-slate-900 uppercase italic tracking-tighter leading-[0.85]">Zero <br/><span className="text-orange-500">Friction.</span></h2>
              <p className="text-slate-500 text-xl lg:text-2xl leading-relaxed font-medium">
                We've eliminated the gap between your kitchen and your guests. Instant updates, seamless ordering, and data-driven insights. 
                <br/><br/>
                Our ecosystem is designed to perform on everything from low-bandwidth mobile devices to high-resolution desktop terminals.
              </p>
              <div className="pt-10 flex flex-col sm:flex-row gap-8">
                 <div className="bg-slate-50 p-10 rounded-[4rem] border border-slate-100 flex-1 shadow-inner group hover:bg-white transition-all">
                    <p className="text-5xl font-black text-slate-900 leading-none mb-4 group-hover:text-indigo-600 transition-colors">0.2s</p>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Update Latency</p>
                 </div>
                 <div className="bg-slate-50 p-10 rounded-[4rem] border border-slate-100 flex-1 shadow-inner group hover:bg-white transition-all">
                    <p className="text-5xl font-black text-slate-900 leading-none mb-4 group-hover:text-orange-500 transition-colors">4K</p>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ready Assets</p>
                 </div>
              </div>
            </div>
          </Reveal>
          <Reveal direction="right">
            <div className="relative">
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-100 rounded-full blur-[100px] opacity-60 animate-pulse"></div>
              <div className="bg-slate-900 p-4 rounded-[4rem] lg:rounded-[6rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] rotate-3 hover:rotate-0 transition-all duration-1000">
                <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1400" className="rounded-[3.5rem] lg:rounded-[5.5rem] object-cover w-full h-[600px]" alt="Enterprise dashboard" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --- How it Works --- */}
      <section id="how-it-works" className="py-32 lg:py-64 bg-slate-900 overflow-hidden rounded-[4rem] lg:rounded-[12rem] lg:mx-12 mb-12">
        <div className="px-12 max-w-[1400px] mx-auto mb-32">
          <Reveal>
             <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                <div className="space-y-6">
                   <p className="text-[12px] lg:text-[14px] font-black uppercase text-orange-500 tracking-[0.5em] italic">The Ecosystem</p>
                   <h2 className="text-6xl lg:text-9xl font-black text-white uppercase italic tracking-tighter leading-[0.85]">Unified <br/><span className="text-indigo-400">Workflow.</span></h2>
                </div>
                <p className="text-slate-400 max-w-md text-lg lg:text-xl font-medium leading-relaxed">
                  Four stages of digital evolution for your business. Scaled for multi-branch operations and enterprise stability.
                </p>
             </div>
          </Reveal>
        </div>

        <div className="max-w-[1400px] mx-auto px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
           {[
             { step: '01', title: 'Curate', desc: 'Define your menu library with high-fidelity assets and metadata.', icon: 'fa-layer-group', color: 'bg-orange-500' },
             { step: '02', title: 'Provision', desc: 'Initialize unique QR identifiers for every table node.', icon: 'fa-microchip', color: 'bg-indigo-600' },
             { step: '03', title: 'Transact', desc: 'Secure real-time ordering and payment processing for guests.', icon: 'fa-shield-check', color: 'bg-emerald-500' },
             { step: '04', title: 'Optimize', desc: 'Extract deep insights from automated sales reporting.', icon: 'fa-gauge-high', color: 'bg-amber-500' }
           ].map((item, i) => (
             <Reveal key={i} delay={i * 200} direction="up">
               <div className="bg-white/5 backdrop-blur-2xl p-14 rounded-[5rem] border border-white/10 h-full flex flex-col justify-between group hover:bg-white/10 transition-all duration-700 hover:-translate-y-4 shadow-2xl">
                  <div>
                    <div className={`w-20 h-20 ${item.color} rounded-[2rem] flex items-center justify-center text-white text-3xl mb-12 shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                       <i className={`fa-solid ${item.icon}`}></i>
                    </div>
                    <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Phase {item.step}</p>
                    <h4 className="text-3xl lg:text-4xl font-black text-white uppercase italic mb-8 tracking-tighter">{item.title}</h4>
                    <p className="text-slate-400 text-base lg:text-lg font-medium leading-relaxed opacity-80">{item.desc}</p>
                  </div>
               </div>
             </Reveal>
           ))}
        </div>
      </section>

      {/* --- Contact Hub --- */}
      <section id="contact" className="py-32 lg:py-64 px-12 bg-white w-full">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-48">
          <Reveal direction="left">
             <div className="space-y-16">
               <div className="space-y-6">
                  <p className="text-[12px] lg:text-[14px] font-black uppercase text-orange-500 tracking-[0.5em] italic">Strategic Support</p>
                  <h2 className="text-6xl lg:text-9xl font-black text-slate-900 uppercase italic tracking-tighter leading-[0.85]">Global <br/><span className="text-indigo-600">Command.</span></h2>
               </div>
               <p className="text-slate-500 text-xl lg:text-2xl leading-relaxed max-w-2xl font-medium">Our enterprise deployment team is ready to scale your menu across any number of territories. Reach out for custom integrations or high-volume support.</p>
               
               <div className="space-y-8">
                  <div className="flex items-center gap-10 p-10 rounded-[3.5rem] bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group shadow-inner">
                     <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-lg group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500"><i className="fa-solid fa-envelope text-2xl"></i></div>
                     <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Global Relations</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tight">hq@sharpqr.enterprise</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-10 p-10 rounded-[3.5rem] bg-slate-50 border border-slate-100 hover:border-orange-200 transition-all cursor-pointer group shadow-inner">
                     <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-orange-500 shadow-lg group-hover:bg-orange-500 group-hover:text-white transition-all duration-500"><i className="fa-solid fa-phone-volume text-2xl"></i></div>
                     <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Direct Line</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tight">+1 (888) SHARP-00</p>
                     </div>
                  </div>
               </div>
             </div>
          </Reveal>

          <Reveal direction="right">
             <form className="bg-slate-900 p-16 lg:p-24 rounded-[5rem] lg:rounded-[8rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] space-y-10 border border-white/5" onSubmit={e => e.preventDefault()}>
                <div className="space-y-4">
                    <h4 className="text-white font-black uppercase italic tracking-widest text-2xl">Connect</h4>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest italic">Request Infrastructure Review</p>
                </div>
                <div className="space-y-8">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <input type="text" placeholder="Full Name" className="w-full bg-white/5 border border-white/10 p-8 rounded-3xl text-white text-lg font-bold outline-none focus:ring-4 ring-indigo-500/20 transition-all" />
                      <input type="email" placeholder="Business Email" className="w-full bg-white/5 border border-white/10 p-8 rounded-3xl text-white text-lg font-bold outline-none focus:ring-4 ring-indigo-500/20 transition-all" />
                   </div>
                   <textarea placeholder="Tell us about your project requirements..." className="w-full bg-white/5 border border-white/10 p-10 rounded-[4rem] text-white text-lg font-bold outline-none focus:ring-4 ring-indigo-500/20 h-64 resize-none transition-all"></textarea>
                   <button className="w-full bg-indigo-600 text-white py-8 rounded-[4rem] font-black uppercase text-[14px] tracking-[0.6em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-500 border-4 border-transparent hover:border-indigo-400">Dispatch Request</button>
                </div>
             </form>
          </Reveal>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="pt-48 pb-32 bg-[#0f172a] px-12 border-t border-white/5 rounded-t-[5rem] lg:rounded-t-[15rem] w-full">
         <div className="max-w-[1400px] mx-auto space-y-32">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-20 lg:gap-32 text-left">
               <div className="col-span-1 md:col-span-1 space-y-10">
                  <h2 className="font-black text-3xl text-white tracking-tighter italic uppercase">SHARP<span className="text-orange-600">QR.</span></h2>
                  <p className="text-slate-500 text-sm font-bold leading-relaxed uppercase tracking-widest">Global Head of Digital Menu Infrastructure and Operations.</p>
               </div>
               <div className="space-y-8">
                  <h5 className="text-[12px] font-black text-white uppercase tracking-[0.5em] italic mb-6">Network</h5>
                  <ul className="space-y-6 text-[12px] font-black uppercase text-slate-500 tracking-[0.2em]">
                    <li className="hover:text-indigo-400 transition-all cursor-pointer hover:translate-x-2" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>Master Node</li>
                    <li className="hover:text-indigo-400 transition-all cursor-pointer hover:translate-x-2" onClick={() => scrollToSection('about')}>Documentation</li>
                    <li className="hover:text-indigo-400 transition-all cursor-pointer hover:translate-x-2" onClick={() => scrollToSection('how-it-works')}>Deployment</li>
                    <li className="hover:text-indigo-400 transition-all cursor-pointer hover:translate-x-2" onClick={() => scrollToSection('contact')}>Terminal</li>
                  </ul>
               </div>
               <div className="space-y-8">
                  <h5 className="text-[12px] font-black text-white uppercase tracking-[0.5em] italic mb-6">Security</h5>
                  <ul className="space-y-6 text-[12px] font-black uppercase text-slate-500 tracking-[0.2em]">
                    <li className="hover:text-orange-400 transition-all cursor-pointer hover:translate-x-2">Encryption</li>
                    <li className="hover:text-orange-400 transition-all cursor-pointer hover:translate-x-2">Privacy Policy</li>
                    <li className="hover:text-orange-400 transition-all cursor-pointer hover:translate-x-2">SLA Agreement</li>
                    <li className="hover:text-orange-400 transition-all cursor-pointer hover:translate-x-2">Compliance</li>
                  </ul>
               </div>
               <div className="space-y-10 text-right">
                  <h5 className="text-[12px] font-black text-white uppercase tracking-[0.5em] italic mb-6">Connect</h5>
                  <div className="flex gap-10 text-slate-500 text-3xl justify-end">
                    <i className="fa-brands fa-instagram hover:text-orange-500 transition-all cursor-pointer hover:-translate-y-2"></i>
                    <i className="fa-brands fa-linkedin hover:text-indigo-500 transition-all cursor-pointer hover:-translate-y-2"></i>
                    <i className="fa-brands fa-twitter hover:text-sky-400 transition-all cursor-pointer hover:-translate-y-2"></i>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed font-bold uppercase tracking-[0.4em] max-w-xs ml-auto italic">Strategic operations handled by Sharp Tech Enterprise.</p>
               </div>
            </div>

            <div className="text-center space-y-16 pt-32 border-t border-white/5">
               <div className="space-y-6">
                  <p className="text-[11px] font-black uppercase tracking-[0.8em] text-slate-600 leading-none mb-4">© 2025 SHARP TECH ENTERPRISE PVT. LTD.</p>
                  <p className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.4em] italic">System Architecture Optimized for Enterprise Performance on PC, Tablet, and Mobile</p>
               </div>
               <button onClick={onStart} className="w-full bg-white text-slate-900 py-10 lg:py-12 rounded-[5rem] font-black uppercase text-sm lg:text-lg tracking-[0.6em] shadow-[0_30px_60px_-15px_rgba(255,255,255,0.15)] active:scale-95 transition-all mx-auto block max-w-2xl border-4 border-transparent hover:border-slate-100">
                  BOOT MASTER SYSTEM
               </button>
            </div>
         </div>
      </footer>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes scale { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-scale { animation: scale 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>

    </div>
  );
};

export default LandingView;
