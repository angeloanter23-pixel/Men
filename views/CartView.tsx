import React from 'react';
import { CartItem } from '../types';

interface CartViewProps {
  cart: CartItem[];
  onUpdateQuantity: (idx: number, delta: number) => void;
  onRemove: (idx: number) => void;
  onCheckout: () => void;
  onGoBack: () => void;
}

const CartView: React.FC<CartViewProps> = ({ cart, onUpdateQuantity, onRemove, onCheckout, onGoBack }) => {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="p-8 text-center py-48 animate-fade-in flex flex-col items-center">
        <div className="w-28 h-28 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-8 text-5xl shadow-inner">
          <i className="fa-solid fa-cart-shopping"></i>
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Your cart is <span className="text-[#FF6B00]">empty</span></h2>
        <p className="text-slate-400 text-base max-w-sm mb-12 leading-relaxed font-medium">Add some items from the menu to start your order.</p>
        <button onClick={onGoBack} className="bg-slate-900 text-white px-16 py-6 rounded-[2rem] font-black text-[11px] tracking-widest uppercase shadow-2xl active:scale-95 transition-all">Go to Menu</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-[#FBFBFD] min-h-screen">
      <div className="max-w-[800px] mx-auto px-4 py-8">
        <header className="mb-6">
          <p className="text-[9px] font-black text-[#FF6B00] uppercase tracking-[0.4em] mb-1 leading-none">Your Selection</p>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">Your <span className="text-[#FF6B00]">Cart</span></h1>
        </header>

        <div className="space-y-3 pb-48">
          {cart.map((item, idx) => (
            <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 flex gap-3 group transition-all shadow-sm hover:shadow-md relative">
               <button 
                 onClick={() => onRemove(idx)} 
                 className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm z-10 transition-all active:scale-90"
               >
                 <i className="fa-solid fa-xmark text-[10px]"></i>
               </button>

               <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                 <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
               </div>
               
               <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                 <div className="flex justify-between items-start gap-2">
                   <div className="min-w-0">
                     <h4 className="font-bold text-[12px] text-slate-900 leading-tight truncate">{item.name}</h4>
                     <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{item.orderMode}</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex items-end justify-between mt-auto">
                    <div className="text-left">
                      <span className="text-[15px] font-black text-slate-400 tabular-nums leading-none">₱{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shadow-inner">
                      <button 
                        onClick={() => onUpdateQuantity(idx, -1)} 
                        className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-sm active:scale-90"
                      >
                        <i className="fa-solid fa-minus text-[9px]"></i>
                      </button>
                      <span className="text-[13px] font-black text-slate-900 w-4 text-center tabular-nums">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(idx, 1)} 
                        className="bg-[#FF6B00] text-white rounded-md w-6 h-6 flex items-center justify-center active:scale-90 transition-all shadow-md"
                      >
                        <i className="fa-solid fa-plus text-[9px]"></i>
                      </button>
                    </div>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Checkout FAB */}
      <div className="fixed bottom-24 left-0 right-0 p-6 z-[45] flex justify-center">
        <button 
          onClick={onCheckout} 
          className="w-full max-w-md bg-slate-900 text-white py-5 px-10 rounded-2xl font-bold text-[12px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 border border-white/10 flex justify-between items-center group transition-all"
        >
          <span>Order Everything</span>
          <div className="flex items-center gap-3">
            <span className="h-6 w-px bg-white/20"></span>
            <span className="text-lg tracking-tighter">₱{total.toLocaleString()}</span>
            <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
          </div>
        </button>
      </div>
    </div>
  );
};

export default CartView;