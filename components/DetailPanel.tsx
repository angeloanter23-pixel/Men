
import React, { useState } from 'react';
import { MenuItem, CartItem, OrderMode } from '../types';

interface DetailPanelProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onSendToKitchen: (item: CartItem) => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ item, isOpen, onClose, onAddToCart, onSendToKitchen }) => {
  const [orderMode, setOrderMode] = useState<OrderMode>('Dine-in');
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [orderTo, setOrderTo] = useState('');

  if (!item) return null;

  const resetState = () => {
    setQuantity(1);
    setInstructions('');
    setOrderTo('');
    setOrderMode('Dine-in');
  };

  const getFinalItem = (): CartItem => ({
    ...item,
    quantity,
    orderMode,
    customInstructions: instructions.trim(),
    orderTo: orderTo.trim() || 'Me'
  });

  const handleAdd = () => { onAddToCart(getFinalItem()); onClose(); resetState(); };
  const handleKitchen = () => { onSendToKitchen(getFinalItem()); onClose(); resetState(); };

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <aside className={`fixed bottom-0 left-0 right-0 bg-white z-[130] rounded-t-[3rem] h-[92vh] transition-transform duration-500 transform shadow-2xl overflow-y-auto no-scrollbar ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-50">
          <button onClick={onClose} className="p-2 bg-slate-50 text-slate-600 rounded-full w-10 h-10 flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition">
            <i className="fa-solid fa-chevron-down text-sm"></i>
          </button>
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Product Details</h3>
          <div className="w-10"></div>
        </div>

        <div className="p-6 pb-20 max-w-2xl mx-auto">
          <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden mb-8 shadow-xl">
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl font-black text-orange-600 shadow-lg border border-white/20">₱{item.price}</div>
          </div>
          
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 leading-tight italic uppercase">
              {item.name}
            </h2>
            <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
              <i className="fa-solid fa-star"></i> 4.9
            </div>
          </div>
          
          <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">{item.description}</p>

          {/* Ingredients Section - Updated to prevent React Error #31 */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div className="mb-8">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 italic">Main Ingredients</label>
              <div className="flex flex-wrap gap-2">
                {item.ingredients.map((ing: any, i) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-bold border border-slate-100">
                    {typeof ing === 'object' ? (ing.label || ing.key) : ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Personalize Label (Order for...)</label>
              <input 
                type="text" 
                placeholder="Name or Table Identifier (Default: Me)" 
                value={orderTo} 
                onChange={(e) => setOrderTo(e.target.value)} 
                className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-500/5 transition-all outline-none shadow-sm placeholder:text-slate-300" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Custom Kitchen Instructions</label>
              <textarea 
                placeholder="No onions, extra spicy, etc." 
                value={instructions} 
                onChange={(e) => setInstructions(e.target.value)} 
                className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-500/5 transition-all outline-none min-h-[100px] shadow-sm resize-none placeholder:text-slate-300" 
              />
            </div>
            
            <div className="flex items-center justify-between bg-white/50 p-4 rounded-3xl border border-white">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Quantity</label>
              <div className="flex items-center gap-4 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-orange-500 transition-all active:scale-90"><i className="fa-solid fa-minus"></i></button>
                <span className="font-black text-slate-800 w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-orange-500 transition-all active:scale-90"><i className="fa-solid fa-plus"></i></button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4">
              <button 
                onClick={handleKitchen} 
                className="w-full bg-orange-500 text-white py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-orange-600 active:scale-95 transition-all shadow-xl shadow-orange-500/20"
              >
                Send to Kitchen Directly
              </button>
              <button 
                onClick={handleAdd} 
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-200"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DetailPanel;
