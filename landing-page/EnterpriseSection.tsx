import React from 'react';
import { Reveal } from './Reveal';

export const EnterpriseSection: React.FC = () => {
  return (
    <section id="enterprise" className="py-24 bg-white font-jakarta">
      <div className="max-w-2xl mx-auto px-6">
        <Reveal>
          <header className="mb-16">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-2 h-2 rounded-full bg-slate-900"></div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Enterprise</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
              Enterprise Solutions
            </h1>
            <div className="h-1 w-12 bg-[#FF6B00] mt-6"></div>
          </header>
        </Reveal>

        <div className="space-y-12">
          <Reveal delay={100}>
            <p className="text-slate-500 text-[15px] leading-relaxed font-medium">
              Scale your operations with our enterprise-grade infrastructure. Designed for multi-location chains and high-volume venues.
            </p>
          </Reveal>
          
          <Reveal delay={200}>
            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Contact Sales</h3>
              <p className="text-slate-500 text-[13px] mb-6">
                Get a custom quote for your organization.
              </p>
              <button className="px-6 py-3 bg-slate-900 text-white rounded-full text-[11px] font-bold uppercase tracking-widest">
                Contact Us
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
