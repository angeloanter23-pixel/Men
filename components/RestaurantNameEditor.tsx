import React, { useState } from 'react';
import * as MenuService from '../services/menuService';

interface RestaurantNameEditorProps {
  userId: string;
  email: string;
  onComplete: () => void;
}

export const RestaurantNameEditor: React.FC<RestaurantNameEditorProps> = ({ userId, email, onComplete }) => {
  const [restaurantName, setRestaurantName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
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
              onClick={handleCreate}
              disabled={isVerifying}
              className="w-full h-14 bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors uppercase tracking-widest flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {isVerifying ? (
                <i className="fa-solid fa-spinner animate-spin text-xl"></i>
              ) : (
                <span>Create Restaurant</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
