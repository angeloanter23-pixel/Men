import React from 'react';
import { Reveal } from './Reveal';

export const InvestmentSection: React.FC = () => {
  return (
    <div className="font-jakarta bg-white">
      {/* Genesis Section */}
      <section className="py-20 bg-[#FBFBFD]">
        <div className="max-w-[800px] mx-auto px-10">
          <Reveal>
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-[#FF6B00] text-[10px] font-black uppercase tracking-[0.5em]">The Genesis</p>
                <h1 className="text-[42px] md:text-[52px] font-bold tracking-tighter leading-[0.95] text-slate-900 uppercase">
                  My First <br />Business.
                </h1>
                <div className="h-1 w-12 bg-[#FF6B00] mt-4"></div>
              </div>

              <div className="space-y-4">
                <p className="text-[18px] md:text-[20px] text-slate-800 font-bold leading-tight uppercase">
                  Building mymenu.asia to modernize hospitality. This is our foundation.
                </p>
                <p className="text-slate-500 text-[15px] md:text-[16px] leading-relaxed font-medium">
                  The product is simple: a QR-based digital menu that connects guests directly to the kitchen. No friction, no apps, just sub-second ordering.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Purpose Section */}
      <section className="py-20 border-y border-slate-100 bg-white">
        <div className="max-w-[800px] mx-auto px-10 space-y-12">
          <Reveal>
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.4em]">Capital Purpose</h3>
              <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tighter">Growth and expansion</h2>
            </div>
          </Reveal>

          <div className="space-y-6">
            {[
              { icon: "fa-bullhorn", title: "Advertising and Market Growth", desc: "Expanding digital presence to capture rising hospitality demand." },
              { icon: "fa-server", title: "Infrastructure Scaling", desc: "Maintaining sub-second latency through global node expansion." },
              { icon: "fa-microchip", title: "Core R&D", desc: "Developing advanced Platinum features and deep guest engagement tools." }
            ].map((item, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="flex gap-6 items-start group">
                   <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0 group-hover:text-[#FF6B00] transition-colors">
                      <i className={`fa-solid ${item.icon} text-sm`}></i>
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-[15px] font-bold text-slate-900 uppercase tracking-tight">{item.title}</h4>
                      <p className="text-[14px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                   </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Agreement & Benefits Section */}
      <section className="py-20 bg-[#FBFBFD]">
        <div className="max-w-[800px] mx-auto px-10 space-y-16">
          <Reveal>
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase text-[#FF6B00] tracking-[0.4em]">The Support Model</h3>
              <h2 className="text-[32px] md:text-[42px] font-bold tracking-tighter leading-none uppercase">Simple Agreement</h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Reveal delay={100}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[9px] font-bold uppercase text-indigo-600 tracking-widest">Repayment Cycle</p>
                  <h3 className="text-4xl font-bold tracking-tighter text-slate-900">500 USD x 1.5</h3>
                  <p className="text-[14px] font-bold text-emerald-600 uppercase">Return cap: 750 USD per block</p>
                </div>
                <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                  This is a revenue-share agreement. We repay you 1.5x your investment from gross revenue until the cap is satisfied.
                </p>
              </div>
            </Reveal>

            {/* Benefits nested here */}
            <div className="space-y-8 border-l border-slate-200 pl-10">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.3em]">Benefits of Investing</p>
              <div className="space-y-6">
                {[
                  { icon: "fa-arrow-up-right-dots", label: "Repayment Cap", desc: "Blocks over 2k USD qualify for 1.8x multiplier." },
                  { icon: "fa-certificate", label: "Equity Rights", desc: "Priority conversion rights in future Series A round." },
                  { icon: "fa-crown", label: "Advisory Status", desc: "Direct access to our product development channel." }
                ].map((benefit, bIdx) => (
                  <Reveal key={bIdx} delay={bIdx * 50}>
                    <div className="flex gap-4 items-start">
                       <i className={`fa-solid ${benefit.icon} text-[#FF6B00] text-[12px] mt-1 shrink-0`}></i>
                       <div>
                          <p className="text-[13px] font-bold text-slate-900 uppercase leading-none mb-1">{benefit.label}</p>
                          <p className="text-[12px] text-slate-400 font-medium">{benefit.desc}</p>
                       </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Risks Section */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-[800px] mx-auto px-10 space-y-12">
          <Reveal>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 text-xl"><i className="fa-solid fa-triangle-exclamation"></i></div>
                 <h3 className="text-3xl font-bold uppercase text-slate-900 tracking-tighter leading-none">The Risk</h3>
              </div>
              <p className="text-[16px] text-slate-500 font-medium leading-relaxed max-w-2xl">
                Business is challenging. If we fail to generate revenue, you may lose your investment. There are no guarantees in entrepreneurship.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Reveal delay={100}>
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.4em]">This is not for</h4>
                <div className="space-y-4">
                  {[
                    "People seeking guaranteed fixed returns.",
                    "Investors looking for immediate equity.",
                    "Anyone who cannot afford to lose capital."
                  ].map((text, i) => (
                    <div key={i} className="flex gap-3 items-start">
                       <i className="fa-solid fa-circle-xmark text-rose-200 text-xs mt-1"></i>
                       <p className="text-slate-700 text-[14px] font-bold leading-tight">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.4em]">This is for</h4>
                <div className="space-y-4">
                  {[
                    "Supporters of our long-term vision.",
                    "People comfortable with high-risk models.",
                    "Believers in digital dining evolution."
                  ].map((text, i) => (
                    <div key={i} className="flex gap-3 items-start">
                       <i className="fa-solid fa-circle-check text-emerald-300 text-xs mt-1"></i>
                       <p className="text-slate-700 text-[14px] font-bold leading-tight">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[600px] mx-auto px-10 text-center space-y-10">
          <Reveal>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tighter">Ready to proceed?</h2>
              <p className="text-slate-500 text-[14px] font-medium leading-relaxed">
                By requesting the agreement, you confirm that you have read the risks and are interested in supporting us.
              </p>
            </div>
          </Reveal>
          
          <Reveal delay={200}>
            <div className="flex flex-col items-center gap-6">
              <button 
                onClick={() => window.location.href = "mailto:hello@mymenu.asia?subject=Inquiry"}
                className="px-10 py-5 bg-slate-900 text-white rounded-full font-bold uppercase text-[11px] tracking-[0.3em] shadow-xl active:scale-95 transition-all hover:bg-[#FF6B00]"
              >
                Request Agreement
              </button>
              <p className="text-[9px] font-bold text-slate-200 uppercase tracking-[1em]">PLATINUM CORE</p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};