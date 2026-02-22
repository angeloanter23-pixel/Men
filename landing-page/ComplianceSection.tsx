import React from 'react';
import { Reveal } from './Reveal';

export const ComplianceSection: React.FC = () => {
  return (
    <section id="compliance" className="py-24 bg-white font-jakarta">
      <div className="max-w-2xl mx-auto px-6">
        <Reveal>
          <header className="mb-16">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-2 h-2 rounded-full bg-slate-900"></div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Legal</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
              Compliance
            </h1>
            <div className="h-1 w-12 bg-[#FF6B00] mt-6"></div>
          </header>
        </Reveal>

        <div className="space-y-12">
          <Reveal delay={100}>
            <p className="text-slate-500 text-[15px] leading-relaxed font-medium">
              We are committed to maintaining the highest standards of compliance with local and international regulations.
            </p>
          </Reveal>
          
          <Reveal delay={200}>
            <div className="grid grid-cols-1 gap-6">
              <div className="p-6 border border-slate-100 rounded-xl">
                <h3 className="text-sm font-bold text-slate-900 mb-2">GDPR Compliance</h3>
                <p className="text-xs text-slate-500">We adhere to the General Data Protection Regulation for all users in the EU.</p>
              </div>
              <div className="p-6 border border-slate-100 rounded-xl">
                <h3 className="text-sm font-bold text-slate-900 mb-2">PCI DSS</h3>
                <p className="text-xs text-slate-500">Our payment processing is fully compliant with the Payment Card Industry Data Security Standard.</p>
              </div>
              <div className="p-6 border border-slate-100 rounded-xl">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Accessibility</h3>
                <p className="text-xs text-slate-500">We strive to make our platform accessible to all users, following WCAG 2.1 guidelines.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
