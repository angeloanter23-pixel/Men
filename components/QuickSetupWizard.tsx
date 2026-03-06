import React, { useState } from 'react';

interface QuickSetupWizardProps {
  onComplete: () => void;
}

export const QuickSetupWizard: React.FC<QuickSetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [restaurantName, setRestaurantName] = useState('');

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Welcome! Let's set up your restaurant.</h2>
            <input 
              type="text" 
              value={restaurantName} 
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Restaurant Name"
              className="w-full p-4 rounded-2xl border border-slate-200"
            />
            <button onClick={() => setStep(2)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold">Next</button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Menu Editor</h2>
            <p>Menu editor components would go here.</p>
            <button onClick={() => setStep(3)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold">Next</button>
          </div>
        );
      case 3:
        return (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900">QR Table Generator</h2>
              <p>QR table generator components would go here.</p>
              <button onClick={() => setStep(4)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold">Next</button>
            </div>
        );
      case 4:
        return (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900">Ready to Publish?</h2>
              <button onClick={() => window.open('/menu/' + restaurantName.toLowerCase().replace(/\s+/g, '-'), '_blank')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">Publish & Open in New Tab</button>
              <button onClick={onComplete} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold">Finish</button>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
            {renderStep()}
        </div>
    </div>
  );
};
