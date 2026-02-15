
import React, { useState } from 'react';
import MenuFAQ from './menu/MenuFAQ';

interface IdentityStepProps {
  brand: { name: string; email: string };
  setBrand: (val: any) => void;
  errors: Record<string, string>;
  verifying: boolean;
}

const identityFaqs = [
  { q: "Is the restaurant name permanent?", a: "No, you can update your restaurant name anytime through the Merchant Portal settings once your account is fully activated." },
  { q: "Which email should I use?", a: "Use your primary business email. This will be your master login for the administration console and where you will receive your license keys." },
  { q: "What if I have multiple branches?", a: "You can define additional territories and branch contexts once your primary account is active. This wizard sets up your first main location." }
];

const IdentityStep: React.FC<IdentityStepProps> = ({ brand, setBrand, errors, verifying }) => {
  const [showFaq, setShowFaq] = useState(false);

  if (showFaq) {
    return (
      <MenuFAQ 
        onBack={() => setShowFaq(false)} 
        title="Brand Support" 
        items={identityFaqs}
      />
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="space-y-3 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Brand Identity</h1>
        <p className="text-[13px] font-medium text-slate-400 leading-relaxed px-4">
          Enter your restaurant name and email.
          <button onClick={() => setShowFaq(true)} className="ml-1.5 text-[#007AFF] font-bold hover:underline">FAQs</button>
        </p>
      </header>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60 space-y-8 relative overflow-hidden">
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
    </div>
  );
};

export default IdentityStep;
