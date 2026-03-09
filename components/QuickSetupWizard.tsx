import React, { useState, useEffect } from 'react';
import * as MenuService from '../services/menuService';

interface QuickSetupWizardProps {
  userId: string;
  email: string;
  onComplete: (nextAction?: 'menu' | 'qr' | 'admin') => void;
}

export const QuickSetupWizard: React.FC<QuickSetupWizardProps> = ({ userId, email, onComplete }) => {
  const [restaurantName, setRestaurantName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const restaurant = await MenuService.getRestaurantByOwnerId(userId);
        if (restaurant) {
          onComplete('admin');
        } else {
          setIsChecking(false);
        }
      } catch (err) {
        setIsChecking(false);
      }
    };
    checkExisting();
  }, [userId, onComplete]);

  const handleVerify = async () => {
    if (!restaurantName.trim()) {
      setError('Restaurant name cannot be empty.');
      return;
    }
    
    setIsVerifying(true);
    setError('');

    try {
      await MenuService.createRestaurantForUser(userId, email, restaurantName.trim());
      onComplete('admin');
    } catch (err: any) {
      console.error('Error creating restaurant:', err);
      setError(err.message || 'Failed to create restaurant. Please try again.');
      setIsVerifying(false);
    }
  };

  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center">
        <i className="fa-solid fa-spinner animate-spin text-4xl text-indigo-600"></i>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col font-jakarta selection:bg-slate-100">
      <header className="flex items-center justify-between p-6">
        <img src="https://tjfqlutqsxhdraoraoyb.supabase.co/storage/v1/object/public/Menu-images/platform/logo/logo.png" alt="MyMenu.asia Logo" className="w-10 h-10 rounded-lg object-cover" />
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
      </div>
    </div>
  );
};
