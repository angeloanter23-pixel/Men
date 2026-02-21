import React from 'react';

interface PayNowButtonProps {
  totalAmount: number;
  onPayNow: () => void;
}

const PayNowButton: React.FC<PayNowButtonProps> = ({ totalAmount, onPayNow }) => {
  return (
    <div className="p-6 bg-white border-t border-slate-100 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-[800px] mx-auto flex items-center justify-between gap-6">
            <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Amount</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">₱{totalAmount.toLocaleString()}</span>
            </div>
            <button onClick={onPayNow} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all">
                Pay Now
            </button>
        </div>
    </div>
  );
};

export default PayNowButton;
