
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

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 py-6 group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left"
      >
        <span className="font-black text-slate-800 text-sm uppercase tracking-tight group-hover:text-indigo-600 transition-colors italic">{question}</span>
        <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center transition-all ${isOpen ? 'rotate-180 bg-indigo-600 text-white' : 'text-slate-300'}`}>
           <i className="fa-solid fa-chevron-down text-[10px]"></i>
        </div>
      </button>
      {isOpen && (
        <div className="mt-4 text-slate-500 text-xs leading-relaxed animate-fade-in font-medium max-w-lg">
          {answer}
        </div>
      )}
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
    <div className="min-h-screen bg-white overflow-x-hidden font-['Plus_Jakarta_Sans'] selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* --- Top Navigation --- */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 py-4 max-w-7xl mx-auto ${isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 py-3 shadow-sm rounded-b-[2rem] mt-0' : 'bg-transparent mt-4'}`}>
        <div className="flex justify-between items-center lg:px-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
             <div className="w-8 h-8 lg:w-10 lg:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <i className="fa-solid fa-bolt text-[10px] lg:text-sm"></i>
             </div>
             <h1 className={`font-black text-lg lg:text-xl tracking-tighter italic uppercase ${isScrolled ? 'text-slate-900' : 'text-white'}`}>SHARP<span className="text-orange-500">QR</span></h1>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            {['About', 'How it Works', 'Testimonials', 'Contact'].map(link => (
              <button 
                key={link} 
                onClick={() => scrollToSection(link.toLowerCase().replace(/\s+/g, '-'))}
                className={`text-[10px] lg:text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 ${isScrolled ? 'text-slate-500 hover:text-indigo-600' : 'text-white/60 hover:text-white'}`}
              >
                {link}
              </button>
            ))}
          </div>

          <button onClick={onStart} className={`px-6 lg:px-8 py-2.5 lg:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${isScrolled ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-indigo-600'}`}>
            Enter Demo
          </button>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-48 lg:pt-64 pb-32 lg:pb-64 px-6 bg-[#0f172a] overflow-hidden rounded-b-[4rem] lg:rounded-b-[8rem]">
        {/* Background Lights */}
        <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] lg:w-[900px] h-[600px] lg:h-[900px] bg-orange-600 rounded-full blur-[180px] animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-[600px] lg:w-[900px] h-[600px] lg:h-[900px] bg-indigo-600 rounded-full blur-[180px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        </div>
        
        <div className="relative text-center space-y-10 lg:space-y-16 z-10 max-w-7xl mx-auto">
          <Reveal>
            <div className="inline-block bg-white/5 backdrop-blur-xl px-6 lg:px-8 py-3 rounded-full border border-white/10 shadow-2xl mb-4">
              <span className="text-[10px] lg:text-[12px] font-black uppercase tracking-[0.5em] text-orange-400">Premium Digital Menu Ecosystem</span>
            </div>
          </Reveal>
          
          <Reveal delay={200}>
            <h1 className="text-6xl md:text-8xl lg:text-[11rem] font-black text-white leading-[0.85] tracking-tighter italic uppercase">
              SMARTER<br />
              <span className="text-orange-500">DINING</span><br />
              <span className="text-indigo-400 lg:text-white lg:opacity-90">STARTS HERE.</span>
            </h1>
          </Reveal>

          <Reveal delay={400}>
            <p className="text-slate-400 text-base lg:text-xl max-w-xl mx-auto leading-relaxed font-medium">
              Toss out the old paper menus. Create a beautiful digital menu that works on any phone, anywhere. Scaled for enterprise efficiency.
            </p>
          </Reveal>

          <Reveal delay={600}>
            <div className="flex flex-col gap-6 items-center pt-8">
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-2xl">
                <button onClick={onStart} className="flex-1 bg-white text-indigo-900 px-8 py-6 rounded-[2.5rem] lg:rounded-[3rem] font-black uppercase text-[11px] lg:text-[12px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-50">
                  Try Demo
                </button>
                <button onClick={onCreateMenu} className="flex-1 bg-orange-500 text-white px-8 py-6 rounded-[2.5rem] lg:rounded-[3rem] font-black uppercase text-[11px] lg:text-[12px] tracking-[0.3em] shadow-2xl shadow-orange-500/30 active:scale-95 hover:bg-orange-600 transition-all">
                  Get Started
                </button>
              </div>
              
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
              <button onClick={handleImportClick} className="text-[10px] lg:text-[12px] text-slate-500 font-black uppercase tracking-[0.3em] hover:text-white transition-colors mt-4">
                <i className="fa-solid fa-file-import mr-2"></i> Load your previous save file
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --- About Section --- */}
      <section id="about" className="py-32 lg:py-64 px-8 bg-white max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center">
          <Reveal direction="left">
            <div className="space-y-8">
              <p className="text-[10px] lg:text-[12px] font-black uppercase text-indigo-500 tracking-[0.4em] italic">Why Foodie?</p>
              <h2 className="text-5xl lg:text-7xl font-black text-slate-900 uppercase italic tracking-tighter leading-[0.95]">Built for <br/><span className="text-orange-500">Global Scale.</span></h2>
              <p className="text-slate-500 text-base lg:text-lg leading-relaxed font-medium">
                Traditional menus are slow and expensive to print. SharpQR lets you change prices, add dishes, and manage orders from your phone in seconds. 
                <br/><br/>
                We built this for modern restaurants that want to serve customers faster and look more professional on any device.
              </p>
              <div className="pt-6 flex flex-col sm:flex-row gap-6">
                 <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex-1">
                    <p className="text-4xl font-black text-slate-900 leading-none mb-2">0%</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Printing Cost</p>
                 </div>
                 <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex-1">
                    <p className="text-4xl font-black text-slate-900 leading-none mb-2">100%</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Power</p>
                 </div>
              </div>
            </div>
          </Reveal>
          <Reveal direction="right">
            <div className="relative">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-50"></div>
              <div className="bg-slate-900 p-3 rounded-[3rem] lg:rounded-[5rem] shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-1000">
                <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1200" className="rounded-[2.5rem] lg:rounded-[4.5rem] object-cover" alt="Restaurant interior" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --- How it Works --- */}
      <section id="how-it-works" className="py-32 lg:py-48 bg-slate-900 overflow-hidden rounded-[3rem] lg:rounded-[10rem] lg:mx-8">
        <div className="px-8 max-w-7xl mx-auto mb-24">
          <Reveal>
             <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                   <p className="text-[10px] lg:text-[12px] font-black uppercase text-orange-500 tracking-[0.4em] mb-4 italic">The Journey</p>
                   <h2 className="text-5xl lg:text-7xl font-black text-white uppercase italic tracking-tighter leading-tight">Simple Steps <br/><span className="text-indigo-400">Total Control.</span></h2>
                </div>
                <p className="text-slate-400 max-w-xs text-sm lg:text-base font-medium">From design to delivery, our workflow is optimized for speed and clarity.</p>
             </div>
          </Reveal>
        </div>

        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { step: '01', title: 'Design Menu', desc: 'Add your dishes, prices, and beautiful photos in our simple cloud editor.', icon: 'fa-pen-nib', color: 'bg-orange-500' },
             { step: '02', title: 'Get QR Codes', desc: 'Generate unique codes for every table. Print them once and use forever.', icon: 'fa-qrcode', color: 'bg-indigo-600' },
             { step: '03', title: 'Start Selling', desc: 'Customers scan, browse, and order. You get notifications instantly.', icon: 'fa-rocket', color: 'bg-emerald-500' },
             { step: '04', title: 'Analyze Results', desc: 'See which dishes are popular and how much money you made today.', icon: 'fa-chart-pie', color: 'bg-amber-500' }
           ].map((item, i) => (
             <Reveal key={i} delay={i * 150} direction="up">
               <div className="bg-white/5 backdrop-blur-md p-12 rounded-[4rem] border border-white/10 h-full flex flex-col justify-between group hover:bg-white/10 transition-all duration-500 hover:-translate-y-2">
                  <div>
                    <div className={`w-16 h-16 ${item.color} rounded-3xl flex items-center justify-center text-white text-2xl mb-10 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                       <i className={`fa-solid ${item.icon}`}></i>
                    </div>
                    <p className="text-[10px] lg:text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Step {item.step}</p>
                    <h4 className="text-2xl lg:text-3xl font-black text-white uppercase italic mb-6 leading-none">{item.title}</h4>
                    <p className="text-slate-400 text-sm lg:text-base font-medium leading-relaxed">{item.desc}</p>
                  </div>
               </div>
             </Reveal>
           ))}
        </div>
      </section>

      {/* --- Testimonials --- */}
      <section id="testimonials" className="py-32 lg:py-64 px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-24">
              <p className="text-[10px] lg:text-[12px] font-black uppercase text-indigo-500 tracking-[0.4em] mb-4 italic">Merchant Stories</p>
              <h2 className="text-5xl lg:text-8xl font-black text-slate-900 uppercase italic tracking-tighter">Loved by <br/><span className="text-orange-500">Business Owners.</span></h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             {[
               { name: 'Chef Mario', role: 'Owner, Mario’s Kitchen', quote: 'Setup took only 10 minutes. My customers love how fast the menu loads on their phones, and I love the real-time price updates.', img: 'https://i.pravatar.cc/200?u=1' },
               { name: 'Sarah J.', role: 'Manager, The Green Bean', quote: 'Changing prices used to be a nightmare with printed menus. Now it’s just one click and every table is updated instantly.', img: 'https://i.pravatar.cc/200?u=2' }
             ].map((t, i) => (
               <Reveal key={i} delay={i * 200}>
                 <div className="bg-white p-12 lg:p-16 rounded-[4rem] lg:rounded-[5rem] border border-slate-100 shadow-xl relative group hover:shadow-2xl transition-all duration-700">
                    <i className="fa-solid fa-quote-left absolute top-12 right-12 text-6xl text-slate-50 opacity-10"></i>
                    <p className="text-slate-600 text-lg lg:text-xl italic font-medium mb-12 leading-relaxed">"{t.quote}"</p>
                    <div className="flex items-center gap-6">
                       <img src={t.img} className="w-16 h-16 lg:w-20 lg:h-20 rounded-[2rem] object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={t.name} />
                       <div>
                          <p className="text-sm lg:text-base font-black text-slate-900 uppercase tracking-tight">{t.name}</p>
                          <p className="text-[10px] lg:text-[12px] font-bold text-slate-400 uppercase tracking-widest">{t.role}</p>
                       </div>
                    </div>
                 </div>
               </Reveal>
             ))}
          </div>
        </div>
      </section>

      {/* --- Contact Hub --- */}
      <section id="contact" className="py-32 lg:py-64 px-8 bg-white max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32">
          <Reveal direction="left">
             <div className="space-y-12">
               <div>
                  <p className="text-[10px] lg:text-[12px] font-black uppercase text-orange-500 tracking-[0.4em] mb-4 italic">Get in Touch</p>
                  <h2 className="text-5xl lg:text-8xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Need <br/><span className="text-indigo-600">Assistance?</span></h2>
               </div>
               <p className="text-slate-500 text-lg lg:text-xl leading-relaxed max-w-lg">Have questions about our enterprise plans or need technical help? Our team is available 24/7 to keep your kitchen running at peak performance.</p>
               
               <div className="space-y-6">
                  <div className="flex items-center gap-8 p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group">
                     <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all"><i className="fa-solid fa-envelope text-xl"></i></div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Support</p>
                        <p className="text-lg font-black text-slate-800">support@sharpqr.com</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-8 p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-orange-200 transition-all cursor-pointer group">
                     <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-orange-500 shadow-sm group-hover:bg-orange-500 group-hover:text-white transition-all"><i className="fa-solid fa-phone text-xl"></i></div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Call Sales</p>
                        <p className="text-lg font-black text-slate-800">+1 (800) 555-FOOD</p>
                     </div>
                  </div>
               </div>
             </div>
          </Reveal>

          <Reveal direction="right">
             <form className="bg-slate-900 p-12 lg:p-20 rounded-[4rem] lg:rounded-[6rem] shadow-2xl space-y-8" onSubmit={e => e.preventDefault()}>
                <h4 className="text-white font-black uppercase italic tracking-widest text-lg mb-4">Send a Message</h4>
                <div className="space-y-6">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <input type="text" placeholder="Full Name" className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-white text-sm font-bold outline-none focus:ring-4 ring-indigo-500/20" />
                      <input type="email" placeholder="Email Address" className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-white text-sm font-bold outline-none focus:ring-4 ring-indigo-500/20" />
                   </div>
                   <textarea placeholder="How can we help your business today?" className="w-full bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-white text-sm font-bold outline-none focus:ring-4 ring-indigo-500/20 h-48 resize-none"></textarea>
                   <button className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-xl active:scale-95 transition-all hover:bg-indigo-700">Submit Request</button>
                </div>
             </form>
          </Reveal>
        </div>
      </section>

      {/* --- Newsletter --- */}
      <section className="py-32 lg:py-48 px-8 bg-slate-50 border-t border-slate-100">
        <Reveal>
          <div className="bg-white p-12 lg:p-24 rounded-[4rem] lg:rounded-[6rem] shadow-xl border border-slate-100 text-center space-y-8 max-w-4xl mx-auto">
            <h3 className="text-4xl lg:text-6xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Merchant Insights</h3>
            <p className="text-slate-500 text-sm lg:text-lg font-medium leading-relaxed max-w-lg mx-auto">Join 5,000+ restaurant owners getting weekly strategic menu tips and early feature access for the Sharp ecosystem.</p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mt-10" onSubmit={e => e.preventDefault()}>
              <input type="email" placeholder="Enter your business email" className="flex-1 bg-slate-50 border border-slate-100 p-6 rounded-3xl text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 shadow-inner" />
              <button className="bg-indigo-600 text-white px-12 py-6 rounded-3xl font-black uppercase text-[12px] tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all hover:bg-indigo-700">Subscribe</button>
            </form>
          </div>
        </Reveal>
      </section>

      {/* --- Footer --- */}
      <footer className="pt-32 pb-24 bg-[#0f172a] px-8 border-t border-white/5 rounded-t-[4rem] lg:rounded-t-[10rem]">
         <div className="max-w-7xl mx-auto space-y-24">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-16 lg:gap-32 text-left">
               <div className="space-y-8">
                  <h5 className="text-[10px] lg:text-[12px] font-black text-white uppercase tracking-[0.4em] italic mb-6">Ecosystem</h5>
                  <ul className="space-y-4 text-[11px] font-black uppercase text-slate-500 tracking-widest">
                    <li className="hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>Home</li>
                    <li className="hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => scrollToSection('about')}>About</li>
                    <li className="hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => scrollToSection('how-it-works')}>How to Use</li>
                    <li className="hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => scrollToSection('contact')}>Contact</li>
                  </ul>
               </div>
               <div className="space-y-8">
                  <h5 className="text-[10px] lg:text-[12px] font-black text-white uppercase tracking-[0.4em] italic mb-6">Intel</h5>
                  <ul className="space-y-4 text-[11px] font-black uppercase text-slate-500 tracking-widest">
                    <li className="hover:text-indigo-400 transition-colors cursor-pointer">Security</li>
                    <li className="hover:text-indigo-400 transition-colors cursor-pointer">Documentation</li>
                    <li className="hover:text-indigo-400 transition-colors cursor-pointer">Privacy Policy</li>
                    <li className="hover:text-indigo-400 transition-colors cursor-pointer">Service Level</li>
                  </ul>
               </div>
               <div className="col-span-2 space-y-8 lg:text-right lg:ml-auto">
                  <h5 className="text-[10px] lg:text-[12px] font-black text-white uppercase tracking-[0.4em] italic mb-6">Connect</h5>
                  <div className="flex gap-8 text-slate-500 text-2xl lg:justify-end">
                    <i className="fa-brands fa-instagram hover:text-orange-500 transition-colors cursor-pointer"></i>
                    <i className="fa-brands fa-linkedin hover:text-indigo-500 transition-colors cursor-pointer"></i>
                    <i className="fa-brands fa-twitter hover:text-sky-400 transition-colors cursor-pointer"></i>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium uppercase tracking-widest max-w-xs lg:ml-auto">Global HQ: 4th Ave, Bonifacio Global City, Manila, PH</p>
               </div>
            </div>

            <div className="text-center space-y-12 pt-16 border-t border-white/5">
               <h2 className="font-black text-5xl lg:text-7xl text-orange-600 tracking-tighter italic">SHARP<span className="text-white opacity-40">QR.</span></h2>
               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 leading-none">© 2025 SHARP TECH ENTERPRISE PVT. LTD.</p>
                  <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">Optimized for Enterprise Performance on Desktop, Tablet, and Mobile</p>
               </div>
               <button onClick={onStart} className="w-full bg-white text-slate-900 py-7 lg:py-9 rounded-[3rem] font-black uppercase text-xs lg:text-sm tracking-[0.4em] shadow-2xl active:scale-95 transition-all mx-auto block max-w-xl">
                  DEPLOY ECOSYSTEM
               </button>
            </div>
         </div>
      </footer>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes scale { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-scale { animation: scale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>

    </div>
  );
};

export default LandingView;
