import React from 'react';
import { Reveal } from './Reveal';

export const CaseStudiesSection: React.FC = () => {
  return (
    <section id="case-studies" className="py-24 bg-white font-jakarta">
      <div className="max-w-2xl mx-auto px-6">
        <Reveal>
          <header className="mb-16">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-2 h-2 rounded-full bg-slate-900"></div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Success Stories</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
              Case Studies
            </h1>
            <div className="h-1 w-12 bg-[#FF6B00] mt-6"></div>
          </header>
        </Reveal>

        <div className="space-y-12">
          <Reveal delay={100}>
            <p className="text-slate-500 text-[15px] leading-relaxed font-medium">
              See how leading restaurants are transforming their operations with mymenu.asia.
            </p>
          </Reveal>
          
          <Reveal delay={200}>
            <div className="space-y-8">
              <div className="border-l-2 border-slate-200 pl-6 py-2">
                <h3 className="text-lg font-bold text-slate-900 mb-2">The Coffee Club</h3>
                <p className="text-sm text-slate-500 mb-4">Increased average order value by 15% using digital menus.</p>
                <button className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Read Story</button>
              </div>
              
              <div className="border-l-2 border-slate-200 pl-6 py-2">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Burger & Lobster</h3>
                <p className="text-sm text-slate-500 mb-4">Streamlined kitchen operations and reduced wait times.</p>
                <button className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Read Story</button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
