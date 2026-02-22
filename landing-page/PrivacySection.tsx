import React from 'react';
import { Reveal } from './Reveal';

export const PrivacySection: React.FC = () => {
  return (
    <section id="privacy" className="py-24 bg-white font-jakarta">
      <div className="max-w-2xl mx-auto px-6">
        <Reveal>
          <header className="mb-16">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-2 h-2 rounded-full bg-slate-900"></div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Legal</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
              Privacy Policy
            </h1>
            <div className="h-1 w-12 bg-[#FF6B00] mt-6"></div>
          </header>
        </Reveal>

        <div className="prose prose-slate max-w-none space-y-12">
          <Reveal delay={100}>
            <section className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">1. Data Collection</h3>
              <p className="text-slate-500 text-[13px] leading-relaxed font-medium">
                We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us.
              </p>
            </section>
          </Reveal>

          <Reveal delay={200}>
            <section className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">2. Use of Information</h3>
              <p className="text-slate-500 text-[13px] leading-relaxed font-medium">
                We use the information we collect to provide, maintain, and improve our services, such as to process transactions and send you related information.
              </p>
            </section>
          </Reveal>

          <Reveal delay={300}>
            <section className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">3. Data Security</h3>
              <p className="text-slate-500 text-[13px] leading-relaxed font-medium">
                We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
              </p>
            </section>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
