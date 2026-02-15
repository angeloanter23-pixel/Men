
import React from 'react';
import { Reveal } from './Reveal';

const PLANS = [
  {
    name: "Professional",
    price: "₱1,299",
    desc: "Our most popular lifetime license for individual venues.",
    features: ["Unlimited Table Nodes", "AI Concierge Access", "Priority Staff Messaging", "Sales Insights Hub"],
    cta: "Get Lifetime Access",
    highlight: true,
    action: () => window.location.hash = '#/create-menu'
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For chains, franchises, and luxury hospitality groups.",
    features: ["Custom Domain", "Custom Designer", "Multi-branch Management", "Dedicated Support Node", "Custom API Access"],
    cta: "Contact Us Now",
    highlight: false,
    action: () => {
      const subject = encodeURIComponent("Enterprise Inquiry: mymenu.asia");
      const body = encodeURIComponent("Hello Mymenu Team,\n\nI am interested in the Enterprise plan for my business. I would like to discuss custom domains and designer options.\n\nBusiness Name:\nContact Number:");
      window.location.href = `mailto:geloelolo@gmail.com?subject=${subject}&body=${body}`;
    }
  }
];

export const PricingSection: React.FC = () => (
  <section id="pricing" className="py-32 bg-slate-50">
    <div className="max-w-[1100px] mx-auto px-6">
      <header className="mb-24 text-center">
        <Reveal>
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Investment</h3>
            <h2 className="text-[32px] md:text-[52px] font-bold tracking-tight text-slate-900 leading-none text-center">Flexible for every kitchen.</h2>
          </div>
        </Reveal>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {PLANS.map((plan, i) => (
          <Reveal key={i} delay={i * 100}>
            <div className={`p-10 rounded-[3rem] border transition-all duration-500 h-full flex flex-col justify-between ${plan.highlight ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-105' : 'bg-white text-slate-900 border-slate-100 shadow-sm hover:shadow-xl'}`}>
              <div>
                <h4 className="text-[13px] font-black uppercase tracking-[0.3em] mb-6 opacity-60">{plan.name}</h4>
                <div className="mb-8">
                  <span className="text-4xl font-black tracking-tighter">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-xs font-bold opacity-40 ml-2">/ one-time</span>}
                </div>
                <p className={`text-sm font-medium mb-10 leading-relaxed ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{plan.desc}</p>
                <ul className="space-y-4">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-[13px] font-bold">
                      <i className={`fa-solid fa-circle-check text-xs ${plan.highlight ? 'text-indigo-400' : 'text-emerald-500'}`}></i>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={plan.action}
                className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest mt-12 transition-all active:scale-95 ${plan.highlight ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-black'}`}
              >
                {plan.cta}
              </button>
            </div>
          </Reveal>
        ))}
      </div>
      
      <Reveal delay={300}>
        <p className="text-center mt-16 text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
          * Professional license is per physical location. <br/> 
          Enterprise pricing depends on node volume and custom requirements.
        </p>
      </Reveal>
    </div>
  </section>
);
