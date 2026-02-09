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
      <div className="max-w-[800px] mx-auto px-6 py-12">
        <header className="mb-12">
          <p className="text-[11px] font-black text-[#FF6B00] uppercase tracking-[0.4em] mb-2 leading-none">Your Selection</p>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">Your <span className="text-[#FF6B00]">Cart</span></h1>
        </header>

        <div className="space-y-5 pb-48">
          {cart.map((item, idx) => (
            <div key={idx} className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-slate-100 flex flex-col sm:flex-row gap-8 shadow-sm group hover:shadow-md transition-all">
               <div className="w-full sm:w-32 h-32 rounded-3xl overflow-hidden shrink-0 border border-slate-50 shadow-inner">
                 <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
               </div>
               
               <div className="flex-1 flex flex-col justify-center min-w-0">
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <h4 className="font-black text-xl text-slate-800 uppercase tracking-tight mb-1">{item.name}</h4>
                     <div className="flex items-center gap-4">
                       <span className="text-[10px] font-black text-[#FF6B00] uppercase tracking-widest">For: {item.orderTo}</span>
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">• {item.orderMode}</span>
                     </div>
                   </div>
                   <button onClick={() => onRemove(idx)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                     <i className="fa-solid fa-xmark text-lg"></i>
                   </button>
                 </div>
                 
                 {/* OPTIONS BREAKDOWN */}
                 {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                   <div className="mt-4 space-y-1.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                      {Object.entries(item.selectedOptions).map(([groupName, options]) => (
                        <div key={groupName} className="flex flex-col gap-0.5">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{groupName}</span>
                           <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {(options as string[]).map(optName => {
                                // Find price for this option
                                const group = item.option_groups?.find(g => g.name === groupName);
                                const opt = group?.options.find(o => o.name === optName);
                                return (
                                  <span key={optName} className="text-[11px] font-bold text-slate-600">
                                    {optName} {opt && opt.price > 0 && <span className="text-[#FF6B00] font-black text-[9px] ml-1">+₱{opt.price}</span>}
                                  </span>
                                );
                              })}
                           </div>
                        </div>
                      ))}
                   </div>
                 )}

                 {item.customInstructions && (
                   <div className="mt-3 text-[11px] text-slate-400 font-bold uppercase leading-relaxed">
                     Note: {item.customInstructions}
                   </div>
                 )}

                 <div className="flex justify-between items-end mt-6">
                   <div className="flex flex-col">
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Unit Total</span>
                     <span className="text-2xl font-black text-slate-900 tracking-tighter">₱{(item.price * item.quantity).toLocaleString()}</span>
                   </div>
                   <div className="flex items-center gap-5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                     <button onClick={() => onUpdateQuantity(idx, -1)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-[#FF6B00] transition-all"><i className="fa-solid fa-minus text-sm"></i></button>
                     <span className="text-lg font-black text-slate-800 w-6 text-center tabular-nums">{item.quantity}</span>
                     <button onClick={() => onUpdateQuantity(idx, 1)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-[#FF6B00] transition-all"><i className="fa-solid fa-plus text-sm"></i></button>
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
          className="w-full max-w-md bg-[#FF6B00] text-white py-6 px-10 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(255,107,0,0.3)] active:scale-95 border-2 border-white/10 flex justify-between items-center group transition-all hover:bg-orange-600"
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