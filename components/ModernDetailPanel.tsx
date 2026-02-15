
import React, { useState, useMemo } from 'react';
import { MenuItem, CartItem } from '../types';

interface ModernDetailPanelProps {
  item: MenuItem | null;
  isOpen: boolean;
  isProcessing?: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onSendToKitchen: (item: CartItem) => void;
}

const ModernDetailPanel: React.FC<ModernDetailPanelProps> = ({ 
  item, 
  isOpen, 
  isProcessing, 
  onClose, 
  onAddToCart, 
  onSendToKitchen 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [orderTo, setOrderTo] = useState('');

  const totalPrice = useMemo(() => (item ? item.price * quantity : 0), [item, quantity]);

  if (!item) return null;

  const getFinalItem = (): CartItem => ({
    ...item,
    quantity,
    orderMode: 'Dine-in',
    customInstructions: instructions.trim(),
    orderTo: orderTo.trim() || 'Guest',
    price: item.price
  });

  return (
    <div className={`fixed inset-0 z-[1200] transition-transform duration-500 font-poppins flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="absolute inset-0 bg-[#D81B60]/95" />
      
      <div className="relative z-10 px-6 pt-12 pb-6 flex items-center justify-between text-white">
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i className="fa-solid fa-chevron-left"></i></button>
        <button className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i className="fa-regular fa-heart"></i></button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
         <div className="w-full max-w-[300px] aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white/10 rotate-3">
            <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
         </div>
      </div>

      <div className="relative z-10 bg-white rounded-t-[3.5rem] p-8 pb-12 flex flex-col gap-6 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
         <div className="flex justify-between items-start">
            <div className="w-2/3">
               <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-1">{item.name}</h2>
               <p className="text-xs text-slate-400 font-medium italic">with {item.ingredients?.slice(0, 2).map((i: any) => typeof i === 'string' ? i : i.label).join(', ')}</p>
            </div>
            <div className="text-right">
               <span className="text-[10px] font-bold text-slate-300 block line-through">₱{(item.price * 1.1).toFixed(0)}</span>
               <span className="text-2xl font-black text-[#D81B60] tracking-tighter">₱{item.price}</span>
            </div>
         </div>

         <div className="flex items-center gap-5 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center gap-2 shrink-0">
               <i className="fa-solid fa-star text-amber-400 text-xs"></i>
               <span className="text-xs font-bold text-slate-800">4,9</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
               <i className="fa-solid fa-clock text-slate-300 text-xs"></i>
               <span className="text-xs font-bold text-slate-400">{item.serving_time}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
               <i className="fa-solid fa-user-group text-slate-300 text-xs"></i>
               <span className="text-xs font-bold text-slate-400">{item.pax}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
               <i className="fa-solid fa-location-dot text-[#D81B60] text-xs"></i>
               <span className="text-xs font-bold text-slate-400">1.2 km</span>
            </div>
         </div>

         <div className="space-y-2">
            <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest">Ingredients:</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
               {item.description}
            </p>
         </div>

         <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
               <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-[#D81B60]/10 text-[#D81B60] flex items-center justify-center"><i className="fa-solid fa-plus rotate-45 text-[10px]"></i></button>
               <span className="w-10 text-center font-bold text-slate-800">{quantity}</span>
               <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg bg-[#D81B60] text-white flex items-center justify-center"><i className="fa-solid fa-plus text-[10px]"></i></button>
            </div>
            
            <button 
              onClick={() => { onAddToCart(getFinalItem()); onClose(); }}
              disabled={isProcessing}
              className="flex-1 h-16 bg-[#D81B60] text-white rounded-3xl font-bold flex items-center justify-between px-6 shadow-xl shadow-[#D81B60]/20 active:scale-95 transition-all"
            >
              <span>Add to cart</span>
              <i className="fa-solid fa-cart-shopping"></i>
            </button>
         </div>
      </div>
    </div>
  );
};

export default ModernDetailPanel;
