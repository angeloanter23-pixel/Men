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
        <h2 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Your cart is <span className="text-brand-primary">empty</span></h2>
        <p className="text-slate-400 text-base max-w-sm mb-12 leading-relaxed font-medium">Add some items from the menu to start your order.</p>
        <button onClick={onGoBack} className="bg-slate-900 text-white px-16 py-6 rounded-[2rem] font-black text-[11px] tracking-widest uppercase shadow-2xl active:scale-95 transition-all">Go to Menu</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-[#FBFBFD] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <header className="mb-12">
          <p className="text-[11px] font-black text-brand-primary uppercase tracking-[0.4em] mb-2 leading-none">Your Selection</p>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">Your <span className="text-brand-primary">Cart</span></h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-5 pb-48">
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
                         <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">For: {item.orderTo}</span>
                       </div>
                     </div>
                     <button onClick={() => onRemove(idx)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                       <i className="fa-solid fa-xmark text-lg"></i>
                     </button>
                   </div>
                   
                   {item.customInstructions && (
                     <div className="mt-3 text-[11px] text-slate-400 font-bold uppercase leading-relaxed">
                       Note: {item.customInstructions}
                     </div>
                   )}

                   <div className="flex justify-between items-end mt-6">
                     <span className="text-2xl font-black text-slate-900 tracking-tighter">₱{(item.price * item.quantity).toLocaleString()}</span>
                     <div className="flex items-center gap-5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                       <button onClick={() => onUpdateQuantity(idx, -1)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-brand-primary transition-all"><i className="fa-solid fa-minus text-sm"></i></button>
                       <span className="text-lg font-black text-slate-800 w-6 text-center tabular-nums">{item.quantity}</span>
                       <button onClick={() => onUpdateQuantity(idx, 1)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-brand-primary transition-all"><i className="fa-solid fa-plus text-sm"></i></button>
                     </div>
                   </div>
                 </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
             <div className="sticky top-28 space-y-6">
                <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl space-y-10">
                   <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-primary mb-6">Price Summary</p>
                      <div className="space-y-4">
                         <div className="flex justify-between text-[12px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span>₱{total.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-[12px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Service Fee</span>
                            <span className="text-brand-primary">Free</span>
                         </div>
                         <div className="h-px bg-white/10 w-full my-4"></div>
                         <div className="flex justify-between items-end">
                            <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Total</span>
                            <h3 className="text-5xl font-black tracking-tighter text-white leading-none">₱{total.toLocaleString()}</h3>
                         </div>
                      </div>
                   </div>
                   <button 
                     onClick={onCheckout}
                     className="w-full bg-brand-primary text-white py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all hover:bg-orange-600 shadow-brand-primary/20"
                   >
                     Order Everything
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-24 left-0 right-0 p-8 z-[45]">
        <button 
          onClick={onCheckout} 
          className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 border-2 border-white/10"
        >
          Check out
        </button>
      </div>
    </div>
  );
};

export default CartView;
