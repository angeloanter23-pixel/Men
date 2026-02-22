import React from 'react';
import { Reveal } from './Reveal';

export const CareersSection: React.FC = () => {
  return (
    <section id="careers" className="py-24 bg-white font-jakarta">
      <div className="max-w-2xl mx-auto px-6">
        <Reveal>
          <header className="mb-16">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-2 h-2 rounded-full bg-slate-900"></div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Join Us</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
              Careers
            </h1>
            <div className="h-1 w-12 bg-[#FF6B00] mt-6"></div>
          </header>
        </Reveal>

        <div className="space-y-12">
          <Reveal delay={100}>
            <p className="text-slate-500 text-[15px] leading-relaxed font-medium">
              We are building the future of hospitality technology. Join our team of engineers, designers, and product thinkers.
            </p>
          </Reveal>
          
          <Reveal delay={200}>
            <div className="space-y-4">
              <div className="p-6 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-slate-900">Senior Frontend Engineer</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remote</span>
                </div>
                <p className="text-xs text-slate-500">React, TypeScript, Tailwind CSS</p>
              </div>
              
              <div className="p-6 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-slate-900">Product Designer</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Singapore</span>
                </div>
                <p className="text-xs text-slate-500">UI/UX, Design Systems</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
