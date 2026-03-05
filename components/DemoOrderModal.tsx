import React, { useState } from 'react';
import * as MenuService from '../services/menuService';

interface DemoOrderModalProps {
  onClose: () => void;
  onUnderstand: () => void;
  onCreateMenu?: () => void;
  title?: string;
  message?: string;
}

export const DemoOrderModal: React.FC<DemoOrderModalProps> = ({ onClose, onUnderstand, onCreateMenu, title, message }) => {
  const [step, setStep] = useState<'info' | 'identity' | 'activation'>('info');
  const [brandName, setBrandName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayTitle = title && title.trim() !== '' ? title : 'Demo Environment';
  const displayMessage = message && message.trim() !== '' ? message : 'This is a demo environment. Orders are not sent to a real kitchen.';

  const handleNext = async () => {
    if (step === 'identity') {
      if (!brandName.trim()) {
        setError("Restaurant name is required");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const exists = await MenuService.checkBusinessNameExists(brandName);
        if (exists) {
          setError("This business name is already taken");
          setLoading(false);
          return;
        }
        setStep('activation');
      } catch (e) {
        setError("Verification failed. Check your connection.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleActivation = () => {
    const msg = encodeURIComponent(`Hello! I'd like to activate my digital menu for "${brandName}".`);
    window.open(`https://m.me/940288252493266?text=${msg}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center p-0 font-jakarta transition-all duration-300">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl p-8 shadow-2xl animate-slide-up border-t border-slate-100 space-y-6">
        
        {step === 'info' && (
          <div className="space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              <i className="fa-solid fa-flask"></i>
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-slate-900">{displayTitle}</h3>
                <p className="text-slate-500 text-sm font-medium">{displayMessage}</p>
            </div>
            <div className="space-y-3">
                <button onClick={onUnderstand} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all">I understand</button>
                <button onClick={() => setStep('identity')} className="w-full py-4 text-slate-500 font-bold hover:text-slate-900 transition-all">Create menu</button>
            </div>
          </div>
        )}

        {step === 'identity' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col items-center">
              <div className="flex gap-2 mb-4">
                <div className="h-1.5 bg-indigo-600 w-8 rounded-full" />
                <div className="h-1.5 bg-slate-200 w-4 rounded-full" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 1 of 2</span>
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Brand Identity</h3>
                <p className="text-slate-500 text-sm font-medium">What's the name of your establishment?</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Restaurant Name</label>
                <input 
                  type="text" 
                  value={brandName}
                  onChange={(e) => { setBrandName(e.target.value); setError(null); }}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all"
                  placeholder="e.g. Blue Ocean Grill"
                />
                {error && <p className="text-rose-500 text-[10px] font-bold ml-1">{error}</p>}
              </div>
              <button 
                onClick={handleNext}
                disabled={loading || !brandName.trim()}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all disabled:opacity-30 uppercase tracking-widest text-sm"
              >
                {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Continue'}
              </button>
              <button onClick={() => setStep('info')} className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-wider">Back</button>
            </div>
          </div>
        )}

        {step === 'activation' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col items-center">
              <div className="flex gap-2 mb-4">
                <div className="h-1.5 bg-indigo-600 w-8 rounded-full" />
                <div className="h-1.5 bg-indigo-600 w-8 rounded-full" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 2 of 2</span>
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Activation</h3>
                <p className="text-slate-500 text-sm font-medium">Connect with our team to activate your license.</p>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <i className="fa-solid fa-check text-[10px]"></i>
                </div>
                <p className="text-[12px] font-medium text-slate-600 leading-relaxed">
                  Brand <span className="font-bold text-slate-900">"{brandName}"</span> is ready.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <i className="fa-solid fa-bolt text-[10px]"></i>
                </div>
                <p className="text-[12px] font-medium text-slate-600 leading-relaxed">
                  Instant activation via Messenger.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <button 
                onClick={handleActivation}
                className="w-full py-4 bg-[#0084FF] text-white rounded-2xl font-black shadow-xl shadow-blue-200 active:scale-95 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3"
              >
                <i className="fa-brands fa-facebook-messenger text-lg"></i>
                Send to Messenger
              </button>
              <button onClick={() => setStep('identity')} className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-wider">Back</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};
