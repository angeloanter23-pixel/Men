import React from 'react';
import { Reveal } from './Reveal';

export const GuidesSection: React.FC = () => {
  return (
    <section id="guides" className="py-24 bg-white font-jakarta">
      <div className="max-w-2xl mx-auto px-6">
        <Reveal>
          <header className="mb-16">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-2 h-2 rounded-full bg-slate-900"></div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Resources</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
              Guides
            </h1>
            <div className="h-1 w-12 bg-[#FF6B00] mt-6"></div>
          </header>
        </Reveal>

        <div className="space-y-12">
          <Reveal delay={100}>
            <p className="text-slate-500 text-[15px] leading-relaxed font-medium">
              Learn how to get the most out of mymenu.asia with our comprehensive guides and tutorials.
            </p>
          </Reveal>
          
          <Reveal delay={200}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Getting Started</span>
              </div>
              <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Menu Optimization</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
