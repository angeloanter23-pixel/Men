
import React, { useState } from 'react';
import { Reveal } from './Reveal';

const FAQ_ITEMS = [
  {
    q: "How does the ordering process work?",
    a: "Customers scan a unique QR code on their table to view the digital menu. They can then select items and place orders directly from their mobile browser. No app download required."
  },
  {
    q: "Can I manage multiple restaurant branches?",
    a: "Yes. Our enterprise tier allows you to manage multiple locations from a single dashboard, with shared inventory management or localized menus."
  },
  {
    q: "What payment methods are supported?",
    a: "MyMenu integrates with popular gateways like GCash, Maya, and standard credit cards. You can also allow guests to pay at the counter using generated barcodes."
  },
  {
    q: "Is there any hardware required?",
    a: "No special hardware is needed. The platform runs on existing tablets, smartphones, and computers. You only need to print the generated QR codes for your tables."
  },
  {
    q: "Can I customize the menu design?",
    a: "Absolutely. You can choose from several high-fidelity templates and customize colors, fonts, and branding to match your restaurant's identity."
  }
];

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-none">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-7 px-2 flex items-center justify-between text-left transition-colors group"
      >
        <span className={`text-[17px] md:text-[20px] font-bold tracking-tight transition-colors ${isOpen ? 'text-orange-500' : 'text-slate-900 group-hover:text-slate-600'}`}>
          {q}
        </span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 transition-all ${isOpen ? 'rotate-45 bg-orange-50 text-orange-500' : 'text-slate-300'}`}>
          <i className="fa-solid fa-plus text-xs"></i>
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? 'max-h-[300px] opacity-100 mb-8' : 'max-h-0 opacity-0'}`}>
        <p className="px-2 text-[15px] md:text-[17px] text-slate-500 font-medium leading-relaxed max-w-3xl">
          {a}
        </p>
      </div>
    </div>
  );
};

export const LandingFaq: React.FC<{ onContactClick?: () => void }> = ({ onContactClick }) => (
  <section className="py-32 bg-white">
    <div className="max-w-[1000px] mx-auto px-6">
      <Reveal>
        <div className="mb-20 text-center md:text-left">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mb-4">Support Hub</h3>
          <h2 className="text-[32px] md:text-[48px] font-bold tracking-tight text-slate-900 leading-none">Questions & Answers.</h2>
        </div>
      </Reveal>

      <div className="space-y-2">
        {FAQ_ITEMS.map((item, idx) => (
          <Reveal key={idx} delay={idx * 50}>
            <FaqItem q={item.q} a={item.a} />
          </Reveal>
        ))}
      </div>
      
      <Reveal delay={400}>
        <div className="mt-20 p-10 bg-slate-50 rounded-[3rem] text-center border border-slate-100/50">
          <h4 className="text-xl font-bold text-slate-900 mb-2">Still have questions?</h4>
          <p className="text-slate-500 text-sm font-medium mb-8">Our specialists are here to help you get started.</p>
          <button 
            onClick={onContactClick}
            className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-[13px] uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all"
          >
            Contact Support
          </button>
        </div>
      </Reveal>
    </div>
  </section>
);
