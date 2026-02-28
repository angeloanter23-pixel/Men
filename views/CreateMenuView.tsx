
import React, { useState, useEffect } from 'react';
import * as MenuService from '../services/menuService';
import IdentityStep from './create-stepper/IdentityStep';
import MenuFAQ from './create-stepper/menu/MenuFAQ';

type WizardStep = 'identity' | 'pricing' | 'payment';

const STEPS: { id: WizardStep; label: string; icon: string; desc: string }[] = [
  { id: 'identity', label: 'Brand', icon: 'fa-building', desc: 'Define your restaurant identity.' },
  { id: 'pricing', label: 'Plan', icon: 'fa-tags', desc: 'Select your subscription plan.' },
  { id: 'payment', label: 'Billing', icon: 'fa-credit-card', desc: 'Activate your cloud license.' }
];

const STORAGE_KEY = 'foodie_stepper_progress';

const paymentFaqs = [
  { q: "Is the fee really one-time?", a: "Yes. The Platinum Lifetime license grants you perpetual access to the Merchant Console and AI Concierge for one location with no recurring monthly fees." },
  { q: "How long does activation take?", a: "Manual activations via GCash or Maya are typically processed within 1-2 hours of the email request during business hours." },
  { q: "Can I add more tables later?", a: "Yes. Your license supports unlimited table nodes. You can generate new QR codes at any time from your dashboard after activation." },
  { q: "Is there a refund policy?", a: "As this is a digital license providing immediate platform access, we generally do not offer refunds. Please ensure you have tested the demo environment before activating." }
];

const CreateMenuView: React.FC<{ onCancel: () => void; onComplete: () => void }> = ({ onCancel, onComplete }) => {
  const [step, setStep] = useState<WizardStep>('identity');
  const [showFaq, setShowFaq] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payMethod, setPayMethod] = useState<'gcash' | 'maya' | 'card'>('gcash');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Form Data
  const [brand, setBrand] = useState({ name: '', email: '' });
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'enterprise'>('standard');

  // Load progress on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.brand) setBrand(data.brand);
        if (data.lastStep) setStep(data.lastStep);
        if (data.selectedPlan) setSelectedPlan(data.selectedPlan);
      } catch (e) { console.error("Failed to load progress"); }
    }
  }, []);

  // Save progress on change
  useEffect(() => {
    const data = { brand, lastStep: step, selectedPlan };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [brand, step, selectedPlan]);

  const curStepIdx = STEPS.findIndex(s => s.id === step);

  const handleNext = async () => {
    if (step === 'identity') {
      setLoading(true);
      setErrors({});
      try {
        const nameExists = await MenuService.checkBusinessNameExists(brand.name);
        const emailExists = await MenuService.checkEmailExists(brand.email);
        const newErrors: Record<string, string> = {};
        if (!brand.name.trim()) newErrors.name = "Restaurant name is required";
        else if (nameExists) newErrors.name = "This business name is already taken";
        if (!brand.email.trim() || !brand.email.includes('@')) newErrors.email = "A valid business email is required";
        else if (emailExists) newErrors.email = "This email is already registered";
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); setLoading(false); return; }
      } catch (e) {
        setErrors({ general: "Verification failed. Check your connection." });
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    
    const nextIdx = curStepIdx + 1;
    if (nextIdx < STEPS.length) {
      setStep(STEPS[nextIdx].id);
      setShowFaq(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (showFaq) { setShowFaq(false); return; }
    if (curStepIdx > 0) setStep(STEPS[curStepIdx - 1].id);
    else onCancel();
  };

  const handlePaymentAction = () => {
      if (!agreedToTerms) return;
      
      const methodLabel = payMethod.toUpperCase();
      const planLabel = selectedPlan === 'enterprise' ? 'Platinum Lifetime (₱1,299)' : 'Standard Monthly (₱499)';
      const subject = encodeURIComponent(`License Activation [${methodLabel}]: ${brand.name}`);
      const body = encodeURIComponent(`I wish to activate my digital menu license via ${methodLabel}.\n\nEstablishment: ${brand.name}\nAdmin Email: ${brand.email}\nPlan: ${planLabel}\n\nPlease provide payment details for ${methodLabel}.`);
      
      window.location.href = `mailto:geloelolo@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col font-jakarta selection:bg-indigo-100 relative">
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 px-6 py-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
           <button onClick={onCancel} className="text-[#007AFF] text-[17px] font-semibold flex items-center gap-1 transition-all active:opacity-50">
             <i className="fa-solid fa-chevron-left text-sm"></i>
             <span>Exit</span>
           </button>
           <div className="flex flex-col items-center">
             <div className="flex gap-1.5 mb-1">
               {STEPS.map((s, i) => (
                 <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i === curStepIdx ? 'bg-indigo-600' : 'bg-slate-300'}`} />
               ))}
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Step {curStepIdx + 1} of {STEPS.length}</span>
           </div>
           <div className="w-10"></div>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-10 pb-48">
         {step === 'identity' && <IdentityStep brand={brand} setBrand={setBrand} errors={errors} verifying={loading} />}
         
         {step === 'pricing' && (
            <div className="space-y-8 animate-slide-up">
                <header className="text-center space-y-3 mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Select Your Plan</h1>
                    <p className="text-slate-500 text-sm font-medium">Choose the best fit for your business.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Standard Plan - Recommended */}
                    <div 
                        onClick={() => setSelectedPlan('standard')}
                        className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer flex flex-col justify-between relative ${selectedPlan === 'standard' ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-[1.02]' : 'bg-white text-slate-900 border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.01]'}`}
                    >
                        {selectedPlan === 'standard' && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                Recommended
                            </div>
                        )}
                        <div>
                            <h4 className={`text-[13px] font-black uppercase tracking-[0.3em] mb-6 ${selectedPlan === 'standard' ? 'opacity-60 text-slate-400' : 'opacity-40 text-slate-400'}`}>Standard</h4>
                            <div className="mb-8">
                                <span className="text-4xl font-black tracking-tighter">₱499</span>
                                <span className={`text-xs font-bold ml-2 ${selectedPlan === 'standard' ? 'opacity-40' : 'opacity-40'}`}>/ mo</span>
                            </div>
                            <p className={`text-sm font-medium mb-8 leading-relaxed ${selectedPlan === 'standard' ? 'text-slate-400' : 'text-slate-500'}`}>
                                Perfect for starting out.
                            </p>
                            <ul className="space-y-4">
                                {["Digital Menu & QR Codes", "Basic Analytics", "Email Support"].map((f, j) => (
                                    <li key={j} className="flex items-center gap-3 text-[13px] font-bold">
                                        <i className={`fa-solid fa-circle-check text-xs ${selectedPlan === 'standard' ? 'text-indigo-400' : 'text-emerald-500'}`}></i>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest mt-8 text-center transition-all ${selectedPlan === 'standard' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-400'}`}>
                            {selectedPlan === 'standard' ? 'Selected' : 'Select Plan'}
                        </div>
                    </div>

                    {/* Enterprise Plan */}
                    <div 
                        onClick={() => setSelectedPlan('enterprise')}
                        className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer flex flex-col justify-between ${selectedPlan === 'enterprise' ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-[1.02]' : 'bg-white text-slate-900 border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.01]'}`}
                    >
                         <div>
                            <h4 className={`text-[13px] font-black uppercase tracking-[0.3em] mb-6 ${selectedPlan === 'enterprise' ? 'opacity-60 text-slate-400' : 'opacity-40 text-slate-400'}`}>Enterprise</h4>
                            <div className="mb-8">
                                <span className="text-4xl font-black tracking-tighter">₱1,299</span>
                                <span className={`text-xs font-bold ml-2 ${selectedPlan === 'enterprise' ? 'opacity-40' : 'opacity-40'}`}>/ life</span>
                            </div>
                            <p className={`text-sm font-medium mb-8 leading-relaxed ${selectedPlan === 'enterprise' ? 'text-slate-400' : 'text-slate-500'}`}>
                                For serious business.
                            </p>
                            <ul className="space-y-4">
                                {["Custom Domain", "Custom Design", "Unlimited Nodes", "AI Concierge", "Priority Support"].map((f, j) => (
                                    <li key={j} className="flex items-center gap-3 text-[13px] font-bold">
                                        <i className={`fa-solid fa-circle-check text-xs ${selectedPlan === 'enterprise' ? 'text-indigo-400' : 'text-emerald-500'}`}></i>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest mt-8 text-center transition-all ${selectedPlan === 'enterprise' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-400'}`}>
                            {selectedPlan === 'enterprise' ? 'Selected' : 'Select Plan'}
                        </div>
                    </div>
                </div>
            </div>
         )}

         {step === 'payment' && (
            showFaq ? (
              <MenuFAQ 
                onBack={() => setShowFaq(false)} 
                title="License Support" 
                items={paymentFaqs}
              />
            ) : (
              <div className="space-y-12 animate-slide-up">
                <header className="space-y-3 text-center">
                  <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Activation</h1>
                  <p className="text-[13px] font-medium text-slate-400 leading-relaxed px-4">
                    Unlock your license to activate all features.
                    <button onClick={() => setShowFaq(true)} className="ml-1.5 text-[#007AFF] font-bold hover:underline">FAQs</button>
                  </p>
                </header>

                <div className="space-y-6">
                    <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-4">Select Gateway</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <button 
                            onClick={() => setPayMethod('gcash')}
                            className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${payMethod === 'gcash' ? 'bg-white border-blue-500 shadow-xl' : 'bg-slate-100 border-transparent text-slate-400'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${payMethod === 'gcash' ? 'bg-[#007AFF] text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-300'}`}>G</div>
                                <div>
                                    <p className={`text-sm font-black uppercase ${payMethod === 'gcash' ? 'text-slate-900' : 'text-slate-400'}`}>GCash Wallet</p>
                                    <p className="text-[10px] font-bold opacity-60">Verified via Gmail</p>
                                </div>
                            </div>
                            {payMethod === 'gcash' && <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]"><i className="fa-solid fa-check"></i></div>}
                        </button>

                        <button 
                            onClick={() => setPayMethod('maya')}
                            className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${payMethod === 'maya' ? 'bg-white border-emerald-500 shadow-xl' : 'bg-slate-100 border-transparent text-slate-400'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${payMethod === 'maya' ? 'bg-[#00FF5E] text-slate-900 shadow-lg shadow-emerald-200' : 'bg-white text-slate-300'}`}>M</div>
                                <div>
                                    <p className={`text-sm font-black uppercase ${payMethod === 'maya' ? 'text-slate-900' : 'text-slate-400'}`}>Maya App</p>
                                    <p className="text-[10px] font-bold opacity-60">Verified via Gmail</p>
                                </div>
                            </div>
                            {payMethod === 'maya' && <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]"><i className="fa-solid fa-check"></i></div>}
                        </button>

                        <button 
                            onClick={() => setPayMethod('card')}
                            className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${payMethod === 'card' ? 'bg-white border-indigo-600 shadow-xl' : 'bg-slate-100 border-transparent text-slate-400'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${payMethod === 'card' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white text-slate-300'}`}><i className="fa-solid fa-credit-card"></i></div>
                                <div>
                                    <p className={`text-sm font-black uppercase ${payMethod === 'card' ? 'text-slate-900' : 'text-slate-400'}`}>Credit / Debit</p>
                                    <p className="text-[10px] font-bold opacity-60">Manual Request</p>
                                </div>
                            </div>
                            {payMethod === 'card' && <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]"><i className="fa-solid fa-check"></i></div>}
                        </button>
                    </div>
                </div>

                <div className="px-4 py-8 bg-white rounded-3xl border border-slate-200 flex items-start gap-4">
                    <div onClick={() => setAgreedToTerms(!agreedToTerms)} className={`w-6 h-6 rounded-lg border-2 shrink-0 transition-all flex items-center justify-center cursor-pointer ${agreedToTerms ? 'bg-indigo-600 border-indigo-600 shadow-md' : 'bg-white border-slate-300'}`}>
                        {agreedToTerms && <i className="fa-solid fa-check text-white text-[10px]"></i>}
                    </div>
                    <div>
                        <p className="text-[13px] font-medium text-slate-600 leading-tight">I agree to the <span className="text-indigo-600 font-bold hover:underline cursor-pointer">Terms of Service</span> and authorize the activation of my cloud merchant license.</p>
                    </div>
                </div>
              </div>
            )
         )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-[110] bg-white/90 backdrop-blur-2xl border-t border-slate-200/50 p-6 md:p-8">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <button onClick={handleBack} className="px-6 py-4 text-[14px] font-bold text-slate-400 hover:text-slate-900 transition-colors">
            {(curStepIdx === 0 || showFaq) ? (showFaq ? 'Close' : 'Cancel') : 'Back'}
          </button>
          <button 
            onClick={step === 'payment' ? handlePaymentAction : handleNext} 
            disabled={loading || (step === 'payment' && !agreedToTerms) || showFaq || (step === 'identity' && (!brand.name.trim() || !brand.email.trim()))} 
            className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-[13px] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed ${step === 'payment' ? 'bg-slate-900 text-white' : 'bg-[#007AFF] text-white'}`}
          >
            {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <span>{step === 'payment' ? 'Request Activation' : 'Continue'}</span>}
          </button>
        </div>
      </footer>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};

export default CreateMenuView;
