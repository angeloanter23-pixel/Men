import React, { useState, useEffect } from 'react';
import { Reveal } from '../landing-page/Reveal';
import SignUpModal from '../components/SignUpModal';

const STEPS = [
  { id: "01", title: "Join the Network", desc: "Create your free partner account in seconds. Use the mockup data to explore the dashboard instantly." },
  { id: "02", title: "Share MyMenu", desc: "Introduce MyMenu to restaurant owners. We provide high-fidelity assets and your own referral link." },
  { id: "03", title: "Merchant Activation", desc: "When a venue launches their digital menu using your link, the system records a successful conversion." },
  { id: "04", title: "Earn 20% Commission", desc: "Receive a permanent share of every license fee. Track your growth in the CRM partner console." }
];

const CareersView: React.FC<{ onBack: () => void; onAffiliateAuth: () => void }> = ({ onBack, onAffiliateAuth }) => {
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white font-jakarta animate-fade-in overflow-x-hidden">
      <header className="bg-white/90 backdrop-blur-2xl sticky top-0 z-[100] border-b border-slate-100 px-6 h-[72px] flex items-center justify-between">
        <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90 border border-slate-100">
            <i className="fa-solid fa-chevron-left text-xs"></i>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <span className="text-[10px] font-bold">M</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none uppercase">Partner Program</h1>
          </div>
          <button onClick={onAffiliateAuth} className="text-indigo-600 font-bold uppercase text-[11px] tracking-widest hover:underline">Partner Login</button>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="pt-24 pb-20 text-center px-6">
          <Reveal>
            <div className="max-w-3xl mx-auto space-y-10">
              <h3 className="text-indigo-600 font-bold uppercase tracking-[0.4em] text-[11px]">Affiliate Ecosystem</h3>
              <h1 className="text-[44px] md:text-[76px] font-bold tracking-tight text-slate-900 leading-[1.05] uppercase">
                Earn rewards by <br /> sharing our technology.
              </h1>
              <p className="text-[17px] md:text-[22px] text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                Refer restaurants and cafes to mymenu.asia and earn a 20% commission on every lifetime license sold through your link.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <button 
                  onClick={() => setIsSignUpOpen(true)}
                  className="px-12 py-5 bg-slate-900 text-white rounded-full font-bold text-[15px] shadow-2xl transition-all hover:bg-black active:scale-95 w-full sm:w-auto"
                >
                  Join as Partner
                </button>
                <button 
                  onClick={onAffiliateAuth}
                  className="px-12 py-5 bg-white text-slate-900 border border-slate-200 rounded-full font-bold text-[15px] transition-all hover:bg-slate-50 active:scale-95 w-full sm:w-auto"
                >
                  Sign In
                </button>
              </div>
            </div>
          </Reveal>
        </section>

        {/* STEPPER SECTION (ALTERNATE BG) */}
        <section className="py-32 bg-slate-50 border-y border-slate-100">
          <div className="max-w-[1000px] mx-auto px-6">
             <header className="mb-24 text-center">
                <Reveal>
                  <div className="space-y-4">
                     <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.4em]">The Process</h3>
                     <h2 className="text-[32px] md:text-[48px] font-bold tracking-tight text-slate-900 leading-none uppercase">How it works</h2>
                     <p className="text-slate-400 text-[16px] md:text-[19px] font-medium leading-relaxed max-w-xl mx-auto">A simple flow to start your referral business.</p>
                  </div>
                </Reveal>
             </header>

             <div className="relative max-w-xl mx-auto">
                <div className="absolute left-[32px] md:left-[40px] top-8 bottom-8 w-[1px] bg-slate-200 z-0"></div>
                <div className="space-y-24">
                   {STEPS.map((s, i) => (
                      <Reveal key={i} delay={i * 100}>
                        <div className="flex gap-10 md:gap-16 group relative z-10">
                           <div className="flex flex-col items-center shrink-0">
                              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-xl md:text-2xl shadow-xl border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                                  {s.id}
                              </div>
                           </div>
                           <div className="pt-4 md:pt-6">
                              <h4 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 mb-2 uppercase">{s.title}</h4>
                              <p className="text-slate-400 text-[14px] md:text-[16px] font-medium leading-relaxed">{s.desc}</p>
                           </div>
                        </div>
                      </Reveal>
                   ))}
                </div>
             </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="py-32 bg-white text-center px-6">
           <Reveal>
             <div className="max-w-2xl mx-auto space-y-10">
                <h2 className="text-[32px] md:text-[48px] font-bold tracking-tight text-slate-900 leading-none uppercase">Ready to grow?</h2>
                <p className="text-slate-500 text-lg font-medium leading-relaxed">Use the mockup login to test the CRM dashboard now. See how we track your commissions.</p>
                <button 
                  onClick={() => setIsSignUpOpen(true)}
                  className="px-12 py-5 bg-indigo-600 text-white rounded-full font-bold text-[15px] shadow-2xl shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
                >
                  Create Partner Account
                </button>
             </div>
           </Reveal>
        </section>
      </main>

      <footer className="py-20 text-center opacity-30 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.8em]">Platinum Partner Node 2025</p>
      </footer>

      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onComplete={() => { setIsSignUpOpen(false); onAffiliateAuth(); }} />
    </div>
  );
};

export default CareersView;