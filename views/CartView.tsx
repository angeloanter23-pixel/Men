
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
      <div className="p-6 text-center py-32 animate-fade-in flex flex-col items-center">
        <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6 text-4xl"><i className="fa-solid fa-cart-shopping"></i></div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Cart is empty</h2>
        <p className="text-slate-400 text-sm max-w-[200px] mb-8 leading-relaxed">Your basket is waiting for some delicious treats.</p>
        <button onClick={onGoBack} className="bg-orange-500 text-white px-10 py-4 rounded-2xl font-black text-xs tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all">GO TO MENU</button>
      </div>
    );
  }

  return (
    <div className="p-6 pb-40 animate-fade-in">
      <h2 className="text-2xl font-black text-slate-800 mb-6">Shopping Cart</h2>
      <div className="space-y-4">
        {cart.map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded-3xl border border-slate-100 flex gap-4 shadow-sm animate-fade-in relative">
             <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0"><img src={item.image_url} className="w-full h-full object-cover" alt="" /></div>
             <div className="flex-1 min-w-0">
               <div className="flex justify-between items-start mb-1">
                 <h4 className="font-bold text-slate-800 truncate pr-4">{item.name}</h4>
                 <button onClick={() => onRemove(idx)} className="text-slate-300 hover:text-red-500 transition p-1"><i className="fa-solid fa-trash-can text-sm"></i></button>
               </div>
               <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-widest">{item.orderTo === 'Me' ? 'Self' : `For: ${item.orderTo}`}</p>
               {item.customInstructions && <p className="text-[9px] text-orange-400 font-bold mb-2 italic">"{item.customInstructions}"</p>}
               <div className="flex justify-between items-center">
                 <span className="text-orange-600 font-black">₱{item.price * item.quantity}</span>
                 <div className="flex items-center gap-3 bg-slate-50 px-2 py-1 rounded-xl">
                   <button onClick={() => onUpdateQuantity(idx, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400"><i className="fa-solid fa-minus text-[10px]"></i></button>
                   <span className="text-xs font-black text-slate-700">{item.quantity}</span>
                   <button onClick={() => onUpdateQuantity(idx, 1)} className="w-6 h-6 flex items-center justify-center text-slate-400"><i className="fa-solid fa-plus text-[10px]"></i></button>
                 </div>
               </div>
             </div>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
        <div className="flex justify-between items-center mb-2"><span className="text-slate-500 text-sm font-bold">Subtotal</span><span className="text-slate-800 font-black">₱{total}</span></div>
        <div className="flex justify-between items-center text-orange-600"><span className="text-sm font-black">Total Amount</span><span className="text-xl font-black">₱{total}</span></div>
      </div>
      <div className="fixed bottom-24 left-0 right-0 p-6 bg-transparent pointer-events-none max-w-xl mx-auto">
        <button onClick={onCheckout} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs tracking-widest hover:bg-orange-600 transition-all shadow-xl active:scale-95 pointer-events-auto">SEND ALL TO KITCHEN</button>
      </div>
    </div>
  );
};

export default CartView;
