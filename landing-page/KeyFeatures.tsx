
import React from 'react';
import { Reveal } from './Reveal';

const FEATURES = [
  {
    title: "QR Generator",
    desc: "Deploy table nodes instantly with high-res exports. Every table gets a unique digital fingerprint, allowing your staff to identify exactly where orders originate without manual verification.",
    icon: "fa-qrcode",
    img: "https://images.unsplash.com/photo-1590650516494-23253a08051b?auto=format&fit=crop&q=80&w=800",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-600"
  },
  {
    title: "Dish Manager",
    desc: "Update inventory and pricing in real-time across your entire network. Handle complex variations, seasonal availability, and beautiful high-res galleries from a single centralized interface.",
    icon: "fa-utensils",
    img: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=800",
    iconBg: "bg-orange-100",
    iconText: "text-orange-600"
  },
  {
    title: "Analytics Hub",
    desc: "Monitor revenue trends and guest engagement with precision. Identify top-performing dishes and peak service hours to optimize your staffing and inventory procurement with data-driven confidence.",
    icon: "fa-chart-pie",
    img: "https://images.unsplash.com/photo-1551288049-bbbda536ad0a?auto=format&fit=crop&q=80&w=800",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600"
  }
];

export const KeyFeatures: React.FC<{ onPricingClick?: () => void }> = ({ onPricingClick }) => (
  <section className="bg-white py-24 md:py-32">
    <div className="max-w-[1100px] mx-auto px-6 mb-20 text-center md:text-left">
      <Reveal>
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Integrated Suite</h3>
          <h2 className="text-[32px] md:text-[52px] font-bold tracking-tight text-slate-900 leading-none">Built for Efficiency.</h2>
          <p className="text-slate-400 text-[16px] md:text-[20px] font-medium leading-relaxed max-w-xl">One ecosystem to manage your entire floor and kitchen operations.</p>
        </div>
      </Reveal>
    </div>

    <div className="max-w-[1100px] mx-auto px-6 space-y-24 md:space-y-40">
      {FEATURES.map((f, i) => (
        <div key={i} className={`flex flex-col md:items-center gap-12 md:gap-20 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
          {/* Text Content */}
          <div className="flex-1 space-y-8">
            <Reveal delay={100}>
              <div className="inline-flex p-6 md:p-12 flex-col justify-between rounded-[3rem] bg-slate-50 border border-slate-100/50 w-full shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${f.iconBg} flex items-center justify-center text-xl md:text-2xl shadow-sm mb-10`}>
                  <i className={`fa-solid ${f.icon} ${f.iconText}`}></i>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[24px] md:text-[32px] font-bold tracking-tight uppercase leading-tight text-slate-900">{f.title}</h3>
                  <p className="text-[15px] md:text-[17px] font-medium text-slate-500 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Image Content */}
          <div className="flex-1">
            <Reveal delay={200}>
              <div className="aspect-[4/3] rounded-[3rem] overflow-hidden bg-slate-100 shadow-2xl border border-slate-200/50 group">
                <img 
                  src={f.img} 
                  alt={f.title} 
                  className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                />
              </div>
            </Reveal>
          </div>
        </div>
      ))}
    </div>

    <Reveal delay={400}>
      <div className="mt-24 text-center">
        <button 
            onClick={onPricingClick}
            className="text-[16px] font-bold text-[#007AFF] hover:underline flex items-center justify-center gap-2 mx-auto group"
        >
          View Pricing 
          <i className="fa-solid fa-chevron-right text-[10px] transition-transform group-hover:translate-x-1"></i>
        </button>
      </div>
    </Reveal>
  </section>
);
