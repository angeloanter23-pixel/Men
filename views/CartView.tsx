
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
      <div className="p-6 text-center py-32 md:py-64 animate-fade-in flex flex-col items-center">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-8 text-4xl md:text-5xl shadow-inner">
          <i className="fa-solid fa-cart-shopping"></i>
        </div>
        <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-4 uppercase italic tracking-tighter">Your cart is <span className="text-orange-500">empty</span></h2>
        <p className="text-slate-400 text-sm md:text-lg max-w-[280px] md:max-w-md mb-12 leading-relaxed font-medium">It looks like you haven't added any delicacies yet. Browse our menu to find something you love.</p>
        <button onClick={onGoBack} className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-[10px] tracking-[0.4em] uppercase shadow-2xl active:scale-95 transition-all hover:bg-indigo-600">GO TO MENU</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-slate-50/50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-10 md:py-20">
        <header className="mb-12">
          <p className="text-[10px] md:text-[12px] font-black text-orange-500 uppercase tracking-[0.5em] mb-3 italic">Order Selection</p>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Your <span className="text-orange-500">Basket</span></h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main List Column */}
          <div className="lg:col-span-8 space-y-6 pb-40 lg:pb-20">
            <div className="flex justify-between items-center mb-6 px-2">
               <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest italic">{cart.length} Selected Items</h3>
               <button onClick={onGoBack} className="text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-600 transition-colors">Add more dishes +</button>
            </div>
            
            <div className="space-y-4">
              {cart.map((item, idx) => (
                <div key={idx} className="bg-white p-5 md:p-8 rounded-[3rem] border border-slate-100 flex flex-col md:flex-row gap-6 md:gap-10 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group">
                   <div className="w-full md:w-32 h-32 rounded-[2.5rem] overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-700">
                     <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                   </div>
                   
                   <div className="flex-1 flex flex-col justify-center min-w-0">
                     <div className="flex justify-between items-start mb-2">
                       <div>
                         <h4 className="font-black text-lg md:text-xl text-slate-800 uppercase italic tracking-tight leading-none mb-2">{item.name}</h4>
                         <div className="flex items-center gap-3">
                           <span className="text-[9px] md:text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">For: {item.orderTo === 'Me' ? 'Guest (Self)' : item.orderTo}</span>
                           <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                           <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.cat_name}</span>
                         </div>
                       </div>
                       <button onClick={() => onRemove(idx)} className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                         <i className="fa-solid fa-trash-can text-sm"></i>
                       </button>
                     </div>
                     
                     {item.customInstructions && (
                       <div className="mt-4 p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50 italic text-[10px] md:text-[11px] text-orange-600 font-medium">
                         <i className="fa-solid fa-quote-left mr-2 opacity-30"></i>
                         {item.customInstructions}
                       </div>
                     )}

                     <div className="flex justify-between items-end mt-6">
                       <span className="text-xl font-black text-slate-900 italic tracking-tighter">₱{(item.price * item.quantity).toLocaleString()}</span>
                       
                       <div className="flex items-center gap-6 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                         <button onClick={() => onUpdateQuantity(idx, -1)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-all active:scale-90"><i className="fa-solid fa-minus text-xs"></i></button>
                         <span className="text-base font-black text-slate-800 tabular-nums w-4 text-center">{item.quantity}</span>
                         <button onClick={() => onUpdateQuantity(idx, 1)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-all active:scale-90"><i className="fa-solid fa-plus text-xs"></i></button>
                       </div>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Summary Column */}
          <div className="lg:col-span-4">
             <div className="sticky top-32 space-y-6">
                <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-1000"></div>
                   <div className="relative z-10 space-y-10">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-500 mb-4">Invoice Summary</p>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center text-slate-400">
                               <span className="text-[10px] font-black uppercase tracking-widest">Subtotal Value</span>
                               <span className="font-bold">₱{total.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                               <span className="text-[10px] font-black uppercase tracking-widest">Platform Fee</span>
                               <span className="font-bold italic">INCLUDED</span>
                            </div>
                            <div className="h-px bg-white/10 w-full"></div>
                            <div className="flex justify-between items-end">
                               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Total Due</span>
                               <h3 className="text-4xl font-black italic tracking-tighter leading-none">₱{total.toLocaleString()}</h3>
                            </div>
                         </div>
                      </div>

                      <div className="hidden lg:block space-y-4">
                         <button 
                           onClick={onCheckout}
                           className="w-full bg-white text-slate-900 py-6 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-xl hover:bg-orange-500 hover:text-white transition-all active:scale-95"
                         >
                           SEND TO KITCHEN
                         </button>
                         <p className="text-[9px] text-slate-500 text-center uppercase tracking-widest font-bold opacity-60">Verified Order Authentication Protocol</p>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-indigo-100 transition-all cursor-default">
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                      <i className="fa-solid fa-shield-check"></i>
                   </div>
                   <div>
                      <h5 className="text-[11px] font-black text-slate-800 uppercase italic">Encrypted Checkout</h5>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Secure TLS 1.3 Transmission</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Mobile-Only Fixed Bottom Action */}
      <div className="lg:hidden fixed bottom-24 left-0 right-0 p-6 z-[45] pointer-events-none">
        <button 
          onClick={onCheckout} 
          className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all pointer-events-auto border-4 border-white/10"
        >
          SEND ALL TO KITCHEN
        </button>
      </div>
    </div>
  );
};

export default CartView;
