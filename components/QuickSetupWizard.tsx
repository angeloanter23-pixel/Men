import React, { useState } from 'react';

interface QuickSetupWizardProps {
  onComplete: () => void;
}

export const QuickSetupWizard: React.FC<QuickSetupWizardProps> = ({ onComplete }) => {
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

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate checking if name exists (for demo purposes, block if it's exactly "test")
    if (restaurantName.trim().toLowerCase() === 'test') {
      setError('This restaurant name is already taken. Please choose another.');
      setIsVerifying(false);
    } else {
      // Continue
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col font-jakarta">
      <header className="flex items-center justify-between p-6 border-b border-slate-100">
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add Restaurant</h1>
        <button 
          onClick={onComplete}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">What's your restaurant's name?</h2>
            <p className="text-slate-500 font-medium">This will be used to generate your unique menu link.</p>
          </div>

          <div className="space-y-4">
            <textarea 
              value={restaurantName} 
              onChange={(e) => {
                setRestaurantName(e.target.value);
                setError('');
              }}
              placeholder="e.g. The Golden Spoon"
              className="w-full p-6 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 focus:ring-0 text-xl font-bold text-center resize-none transition-colors"
              rows={2}
            />
            
            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold flex items-center gap-3">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            <button 
              onClick={handleVerify} 
              disabled={isVerifying || !restaurantName.trim()}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isVerifying ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
