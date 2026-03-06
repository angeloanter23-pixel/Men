import React, { useState } from 'react';
import * as MenuService from '../services/menuService';

interface QuickSetupWizardProps {
  userId: string;
  email: string;
  onComplete: () => void;
}

export const QuickSetupWizard: React.FC<QuickSetupWizardProps> = ({ userId, email, onComplete }) => {
  const [restaurantName, setRestaurantName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!restaurantName.trim()) {
      setError('Restaurant name cannot be empty.');
      return;
    }
    
    setIsVerifying(true);
    setError('');

    try {
      await MenuService.createRestaurantForUser(userId, email, restaurantName.trim());
      onComplete();
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
          onClick={onComplete}
          className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group"
        >
          <span className="text-sm font-bold uppercase tracking-widest">Close</span>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors">
            <i className="fa-solid fa-xmark text-sm"></i>
          </div>
        </button>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Name your restaurant</h2>
            <p className="text-slate-500 font-medium text-lg">This will be used to generate your unique menu link.</p>
          </div>

          <div className="space-y-6">
            <textarea 
              value={restaurantName} 
              onChange={(e) => {
                setRestaurantName(e.target.value);
                setError('');
              }}
              placeholder="e.g. The Golden Spoon"
              className="w-full p-8 bg-slate-50 border-0 focus:ring-2 focus:ring-slate-900 text-3xl font-black text-center resize-none transition-all placeholder:text-slate-300 rounded-none"
              rows={2}
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
              className="w-full h-[72px] bg-slate-900 text-white font-bold text-[15px] hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest flex items-center justify-center gap-4"
            >
              {isVerifying ? (
                <i className="fa-solid fa-spinner animate-spin text-xl"></i>
              ) : (
                <>
                  <span>Create Restaurant</span>
                  <i className="fa-solid fa-arrow-right text-sm"></i>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
