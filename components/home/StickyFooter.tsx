import React from 'react';

interface StickyFooterProps {
  totalPrice: number;
  quantity: number;
  onQuantityChange: (q: number) => void;
  onAddToCart: () => void;
  onSendToKitchen: () => void;
  isVisible: boolean;
  isProcessing?: boolean;
  accentColor?: string;
}

const StickyFooter: React.FC<StickyFooterProps> = ({
  totalPrice,
  quantity,
  onQuantityChange,
  onAddToCart,
  onSendToKitchen,
  isVisible,
  isProcessing,
  accentColor = '#FF6B00'
}) => {
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-[1300] p-6 bg-white/80 backdrop-blur-2xl border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-all duration-500 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      style={{ maxWidth: 'inherit' }} // To respect the max-w-xl of parent if needed
    >
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Total Amount</p>
            <span className="text-2xl font-black tracking-tighter text-slate-900">₱{totalPrice.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center bg-slate-100/50 rounded-2xl p-1 border border-slate-200/50">
            <button 
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors active:scale-90"
            >
              <i className="fa-solid fa-minus text-[10px]"></i>
            </button>
            <span className="w-8 text-center text-sm font-black text-slate-900">{quantity}</span>
            <button 
              onClick={() => onQuantityChange(quantity + 1)}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors active:scale-90"
            >
              <i className="fa-solid fa-plus text-[10px]"></i>
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onSendToKitchen}
            disabled={isProcessing}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Send to Kitchen'}
          </button>
          <button 
            onClick={onAddToCart}
            disabled={isProcessing}
            className="flex-[1.5] py-4 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyFooter;
