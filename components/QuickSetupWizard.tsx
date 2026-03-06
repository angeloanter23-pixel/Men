import React, { useState } from 'react';
import * as MenuService from '../services/menuService';

interface QuickSetupWizardProps {
  userId: string;
  email: string;
  onComplete: (nextAction?: 'menu' | 'qr') => void;
}

export const QuickSetupWizard: React.FC<QuickSetupWizardProps> = ({ userId, email, onComplete }) => {
  const [restaurantName, setRestaurantName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const handleVerify = async () => {
    if (!restaurantName.trim()) {
      setError('Restaurant name cannot be empty.');
      return;
    }
    
    setIsVerifying(true);
    setError('');

    try {
      await MenuService.createRestaurantForUser(userId, email, restaurantName.trim());
      setStep(2);
    } catch (err: any) {
      console.error('Error creating restaurant:', err);
      setError(err.message || 'Failed to create restaurant. Please try again.');
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col font-jakarta selection:bg-slate-100">
      <header className="flex items-center justify-between p-6">
        <div className="w-10 h-10 bg-slate-900 flex items-center justify-center text-white">
           <span className="text-xl font-black">M</span>
        </div>
        <button 
          onClick={() => onComplete()}
          className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group"
        >
          <span className="text-sm font-bold uppercase tracking-widest">Close</span>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors">
            <i className="fa-solid fa-xmark text-sm"></i>
          </div>
        </button>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {step === 1 ? (
            <div className="w-full max-w-md space-y-10">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Name your restaurant</h2>
                <div className="w-12 h-1 bg-indigo-600"></div>
                <p className="text-slate-500 font-medium text-base">This will be used to generate your unique menu link.</p>
              </div>

              <div className="space-y-6">
                <input 
                  type="text"
                  value={restaurantName} 
                  onChange={(e) => {
                    setRestaurantName(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. The Golden Spoon"
                  className="w-full p-4 bg-transparent border-b-2 border-slate-200 focus:border-slate-900 focus:ring-0 text-2xl font-black transition-all placeholder:text-slate-300 rounded-none px-0 outline-none"
                  autoFocus
                />
                
                {error && (
                  <div className="p-4 bg-rose-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-100 flex items-center justify-center shrink-0 text-rose-500">
                        <i className="fa-solid fa-circle-exclamation text-sm"></i>
                    </div>
                    <p className="text-rose-600 text-[12px] font-bold leading-tight">{error}</p>
                  </div>
                )}

                <button 
                  onClick={handleVerify} 
                  disabled={isVerifying || !restaurantName.trim()}
                  className="w-full h-14 bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest flex items-center justify-center gap-4"
                >
                  {isVerifying ? (
                    <i className="fa-solid fa-spinner animate-spin text-lg"></i>
                  ) : (
                    <>
                      <span>Create Restaurant</span>
                      <i className="fa-solid fa-arrow-right text-sm"></i>
                    </>
                  )}
                </button>

                <div className="pt-6 border-t border-slate-100">
                    <p className="text-sm text-slate-500">Need help? <a href="mailto:support@mymenu.asia" className="text-indigo-600 font-bold hover:underline">Contact Support</a> or check our <a href="#" className="text-indigo-600 font-bold hover:underline">FAQs</a>.</p>
                </div>
              </div>
            </div>
        ) : (
            <div className="w-full max-w-md space-y-10 animate-fade-in">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="fa-solid fa-check text-2xl"></i>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Restaurant Created!</h2>
                <div className="w-12 h-1 bg-emerald-600"></div>
                <p className="text-slate-500 font-medium text-base">Your restaurant is ready. What would you like to do next?</p>
              </div>

              <div className="space-y-4">
                <button 
                    onClick={() => onComplete('menu')}
                    className="w-full p-6 border-2 border-slate-100 hover:border-slate-900 rounded-2xl flex items-center gap-6 transition-all group text-left"
                >
                    <div className="w-12 h-12 bg-slate-50 group-hover:bg-slate-900 group-hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-colors shrink-0">
                        <i className="fa-solid fa-book-open"></i>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Menu Editor</h3>
                        <p className="text-sm text-slate-500">Add categories and items to your menu.</p>
                    </div>
                </button>

                <button 
                    onClick={() => onComplete('qr')}
                    className="w-full p-6 border-2 border-slate-100 hover:border-slate-900 rounded-2xl flex items-center gap-6 transition-all group text-left"
                >
                    <div className="w-12 h-12 bg-slate-50 group-hover:bg-slate-900 group-hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-colors shrink-0">
                        <i className="fa-solid fa-qrcode"></i>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">QR Generator</h3>
                        <p className="text-sm text-slate-500">Generate and print QR codes for your tables.</p>
                    </div>
                </button>
              </div>
            </div>
        )}
      </div>
    </div>
  );
};
