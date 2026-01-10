
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
            <i className="fa-solid fa-chevron-down"></i>
          </button>
          <h3 className="font-bold text-slate-800">Product Details</h3>
          <div className="w-10"></div>
        </div>

        <div className="p-6 pb-32 max-w-2xl mx-auto">
          <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden mb-8 shadow-xl">
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl font-black text-orange-600 shadow-lg">₱{item.price}</div>
          </div>
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">{item.name}</h2>
            <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">
              <i className="fa-solid fa-star text-[10px]"></i> 4.9
            </div>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">{item.description}</p>

          <div className="space-y-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Order for (Name)</label>
              <input type="text" placeholder="Who is this for? (Default: Me)" value={orderTo} onChange={(e) => setOrderTo(e.target.value)} className="w-full bg-white border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-orange-500 transition-all outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Kitchen Note</label>
              <textarea placeholder="Extra spice, no onions..." value={instructions} onChange={(e) => setInstructions(e.target.value)} className="w-full bg-white border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-orange-500 transition-all outline-none min-h-[80px]" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Quantity</label>
              <div className="flex items-center gap-4 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-orange-500 transition"><i className="fa-solid fa-minus"></i></button>
                <span className="font-bold text-slate-700 w-4 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-orange-500 transition"><i className="fa-solid fa-plus"></i></button>
              </div>
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-50 flex gap-3 max-w-xl mx-auto">
          <button onClick={handleAdd} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs hover:bg-slate-800 active:scale-95 transition-all shadow-lg">ADD TO CART</button>
          <button onClick={handleKitchen} className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black text-xs hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-100">SEND TO KITCHEN</button>
        </div>
      </aside>
    </>
  );
};

export default DetailPanel;
