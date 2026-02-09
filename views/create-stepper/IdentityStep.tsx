
import React, { useState } from 'react';

interface IdentityStepProps {
  brand: { name: string; email: string };
  setBrand: (val: any) => void;
  errors: Record<string, string>;
  verifying: boolean;
}

const faqs = [
  { q: "Is the restaurant name permanent?", a: "No, you can update your restaurant name anytime through the Merchant Portal settings." },
  { q: "Which email should I use?", a: "Use your primary business email. This will be your master login for the administration console." },
  { q: "What if I have multiple branches?", a: "You can define additional territories and branch contexts once your primary account is active." }
];

const IdentityStep: React.FC<IdentityStepProps> = ({ brand, setBrand, errors, verifying }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-[34px] font-bold tracking-tight text-slate-900 leading-tight">Restaurant Identity</h1>
        <p className="text-[17px] text-slate-500 font-medium leading-relaxed">Define the essence of your digital presence.</p>
      </header>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 space-y-8 relative overflow-hidden">
        <div className="space-y-6">
          <div className="space-y-2 relative">
            <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider ml-1">Restaurant Name</label>
            <div className="relative">
              <input 
                type="text" 
                value={brand.name}
                onChange={e => setBrand({ ...brand, name: e.target.value })}
                className={`w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-[17px] font-semibold outline-none transition-all focus:bg-white focus:ring-4 ring-indigo-500/5 ${errors.name ? 'border-rose-200 bg-rose-50/10' : ''}`}
                placeholder="e.g. Noir Kitchen"
              />
              {verifying && brand.name.length > 2 && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <i className="fa-solid fa-spinner animate-spin text-indigo-400 text-sm"></i>
                </div>
              )}
            </div>
            {errors.name && <p className="text-rose-500 text-[11px] font-bold ml-1 animate-fade-in">{errors.name}</p>}
          </div>

          <div className="space-y-2 relative">
            <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider ml-1">Business Email</label>
            <div className="relative">
              <input 
                type="email" 
                value={brand.email}
                onChange={e => setBrand({ ...brand, email: e.target.value })}
                className={`w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-[17px] font-semibold outline-none transition-all focus:bg-white focus:ring-4 ring-indigo-500/5 ${errors.email ? 'border-rose-200 bg-rose-50/10' : ''}`}
                placeholder="hello@noirkitchen.com"
              />
              {verifying && brand.email.includes('@') && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <i className="fa-solid fa-spinner animate-spin text-indigo-400 text-sm"></i>
                </div>
              )}
            </div>
            {errors.email && <p className="text-rose-500 text-[11px] font-bold ml-1 animate-fade-in">{errors.email}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[11px] font-bold uppercase text-slate-400 tracking-widest px-4">Setup Assistance</h3>
        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 overflow-hidden shadow-sm">
          {faqs.map((faq, i) => (
            <div key={i} className={`border-b border-slate-50 last:border-none transition-all ${openFaq === i ? 'bg-slate-50/50' : ''}`}>
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-6 flex items-center justify-between group text-left"
              >
                <span className="font-bold text-slate-800 text-[15px]">{faq.q}</span>
                <i className={`fa-solid fa-chevron-down text-slate-300 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-indigo-600' : ''}`}></i>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="px-6 pb-6 text-sm text-slate-500 font-medium leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IdentityStep;
