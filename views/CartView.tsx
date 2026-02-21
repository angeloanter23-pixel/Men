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

        <div className="space-y-4 pb-48">
          {cart.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-4 group transition-all shadow-sm hover:shadow-md">
               <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                 <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
               </div>
               
               <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                 <div className="flex justify-between items-start gap-2">
                   <div className="min-w-0">
                     <h4 className="font-bold text-[15px] text-slate-900 leading-tight truncate">{item.name}</h4>
                     <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{item.orderTo}</span>
                       <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">• {item.orderMode}</span>
                     </div>
                   </div>
                   <div className="relative group/menu shrink-0">
                      <button className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors">
                        <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-2xl py-2 px-3 hidden group-hover/menu:block z-10">
                        <button onClick={() => onRemove(idx)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">Remove Item</button>
                      </div>
                   </div>
                 </div>
                 
                 <div className="flex items-end justify-between mt-auto">
                    <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <button onClick={() => onUpdateQuantity(idx, -1)} className="text-slate-400 hover:text-orange-600 transition-all p-1"><i className="fa-solid fa-minus text-[10px]"></i></button>
                      <span className="text-sm font-black text-slate-900 w-4 text-center tabular-nums">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(idx, 1)} className="text-slate-400 hover:text-orange-600 transition-all p-1"><i className="fa-solid fa-plus text-[10px]"></i></button>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-0.5">Subtotal</p>
                      <span className="text-lg font-black text-slate-900 tabular-nums leading-none">₱{(item.price * item.quantity).toLocaleString()}</span>
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