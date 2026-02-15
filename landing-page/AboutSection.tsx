
import React, { useState } from 'react';
import { Reveal } from './Reveal';

const CORE_VALUES = [
  { icon: "fa-lightbulb", label: "Innovation" },
  { icon: "fa-shield-halved", label: "Security" },
  { icon: "fa-heart", label: "Empathy" },
  { icon: "fa-bolt", label: "Speed" },
  { icon: "fa-gem", label: "Excellence" },
  { icon: "fa-users", label: "Community" },
  { icon: "fa-leaf", label: "Sustainability" },
  { icon: "fa-handshake", label: "Integrity" }
];

export const AboutSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mission' | 'vision'>('mission');

  return (
    <div className="bg-white font-jakarta">
      {/* PHILOSOPHY SECTION */}
      <section id="about" className="py-16 md:py-20 overflow-hidden border-b border-slate-50">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-20 items-start">
            <Reveal>
              <div className="space-y-10 md:space-y-12">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">The Philosophy</h3>
                  <h2 className="text-[40px] md:text-[64px] font-bold tracking-tight text-slate-900 leading-[1.1]">
                    Simplicity is the <br/> ultimate <span className="text-slate-200">sophistication.</span>
                  </h2>
                </div>
                
                <div className="space-y-6 md:space-y-8">
                  <p className="text-[17px] md:text-[21px] text-slate-500 font-medium leading-relaxed max-w-xl">
                    We started with a single goal: to remove the friction between the guest and the kitchen. No apps, no logins, just instant culinary access.
                  </p>
                  <div className="pt-2">
                    <p className="text-slate-900 font-black tracking-tight text-xl uppercase leading-none">- angelo anter</p>
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.3em] mt-1.5">Mymenu founder</p>
                  </div>
                </div>

                {/* Mission and Vision Centered Nav Tab Bar */}
                <div className="bg-slate-50 p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-inner flex flex-col items-center">
                  <div className="bg-slate-200/50 p-1.5 rounded-full flex w-full max-w-[260px] shadow-inner mb-8">
                    <button 
                      onClick={() => setActiveTab('mission')}
                      className={`flex-1 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'mission' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      Mission
                    </button>
                    <button 
                      onClick={() => setActiveTab('vision')}
                      className={`flex-1 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'vision' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      Vision
                    </button>
                  </div>

                  <div className="min-h-[90px] animate-fade-in text-center max-w-sm" key={activeTab}>
                    {activeTab === 'mission' ? (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Our Mission</h4>
                        <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                          To empower hospitality merchants with invisible technology that enhances human connection rather than replacing it.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Our Vision</h4>
                        <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                          A global dining landscape where every table is an intelligent node, and every guest feels a direct link to the kitchen.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="relative pt-8 md:pt-12">
                 <div className="aspect-[4/5] bg-slate-50 rounded-[3.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl relative z-10 border border-slate-100">
                    <img src="https://images.unsplash.com/photo-1550966841-3ee7adac1661?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Kitchen" />
                 </div>
                 <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-orange-100 rounded-full blur-[100px] -z-10 opacity-40"></div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CORE VALUES SECTION - POOL UI PILLS 3-2-3 STRICT LAYERS */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-[1000px] mx-auto px-6">
          <header className="mb-16 md:mb-20 text-center space-y-4">
            <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">The DNA</h3>
            <h2 className="text-[32px] md:text-[48px] font-bold tracking-tight text-slate-900 leading-none">8 Core Values</h2>
          </header>

          <div className="flex flex-col gap-3.5 md:gap-4 items-center">
            {/* Layer 1: 3 Items */}
            <Reveal>
              <div className="flex flex-wrap justify-center gap-2.5 md:gap-3">
                {CORE_VALUES.slice(0, 3).map((v, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-5 md:px-7 py-3 md:py-4 bg-[#F2F2F7] border border-slate-100/50 rounded-full hover:bg-orange-50 hover:border-orange-100 transition-all duration-300 group">
                    <i className={`fa-solid ${v.icon} text-[11px] md:text-sm text-slate-400 group-hover:text-orange-500 group-hover:scale-110 transition-all`}></i>
                    <span className="text-[12px] md:text-[14px] font-bold text-slate-700 tracking-tight leading-none">{v.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Layer 2: 2 Items */}
            <Reveal delay={100}>
              <div className="flex flex-wrap justify-center gap-2.5 md:gap-3">
                {CORE_VALUES.slice(3, 5).map((v, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-5 md:px-7 py-3 md:py-4 bg-[#F2F2F7] border border-slate-100/50 rounded-full hover:bg-orange-50 hover:border-orange-100 transition-all duration-300 group">
                    <i className={`fa-solid ${v.icon} text-[11px] md:text-sm text-slate-400 group-hover:text-orange-500 group-hover:scale-110 transition-all`}></i>
                    <span className="text-[12px] md:text-[14px] font-bold text-slate-700 tracking-tight leading-none">{v.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Layer 3: 3 Items */}
            <Reveal delay={200}>
              <div className="flex flex-wrap justify-center gap-2.5 md:gap-3">
                {CORE_VALUES.slice(5, 8).map((v, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-5 md:px-7 py-3 md:py-4 bg-[#F2F2F7] border border-slate-100/50 rounded-full hover:bg-orange-50 hover:border-orange-100 transition-all duration-300 group">
                    <i className={`fa-solid ${v.icon} text-[11px] md:text-sm text-slate-400 group-hover:text-orange-500 group-hover:scale-110 transition-all`}></i>
                    <span className="text-[12px] md:text-[14px] font-bold text-slate-700 tracking-tight leading-none">{v.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
};
