
import React from 'react';
import { Reveal } from './Reveal';

const SETUP_STEPS = [
  { id: "01", title: "Create Menu", desc: "Add your dishes, prices, and categories to your digital catalog." },
  { id: "02", title: "Generate QR Code", desc: "Create unique digital identifiers for every table in your venue." },
  { id: "03", title: "Place QR on Table", desc: "Print your custom codes and display them at physical table locations." },
  { id: "04", title: "Scan and Order", desc: "Guests scan the table code to instantly see your menu and place orders." }
];

export const BlueprintStepper: React.FC = () => (
  <section className="py-32 bg-slate-50 border-y border-slate-100">
    <div className="max-w-[1000px] mx-auto px-6">
       <header className="mb-24 text-center">
          <Reveal>
            <div className="space-y-4">
               <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.4em]">The Workflow</h3>
               <h2 className="text-[32px] md:text-[48px] font-bold tracking-tight text-slate-900 leading-none">Four Steps to Success.</h2>
               <p className="text-slate-400 text-[16px] md:text-[19px] font-medium leading-relaxed max-w-xl mx-auto">Modernize your hospitality workflow with precise integration.</p>
            </div>
          </Reveal>
       </header>

       <div className="relative max-w-xl mx-auto">
          {/* Vertical line centered to circles: w-16 = 32px center, md:w-20 = 40px center */}
          <div className="absolute left-[32px] md:left-[40px] top-8 bottom-8 w-[1px] bg-slate-200 z-0"></div>

          <div className="space-y-24">
             {SETUP_STEPS.map((s, i) => (
                <Reveal key={i} delay={i * 100}>
                  <div className="flex gap-10 md:gap-16 group relative z-10">
                     <div className="flex flex-col items-center shrink-0">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-xl md:text-2xl shadow-xl border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                            {s.id}
                        </div>
                     </div>
                     <div className="pt-4 md:pt-6">
                        <h4 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 mb-2">{s.title}</h4>
                        <p className="text-slate-400 text-[14px] md:text-[16px] font-medium leading-relaxed">{s.desc}</p>
                     </div>
                  </div>
                </Reveal>
             ))}
          </div>
       </div>
    </div>
  </section>
);
