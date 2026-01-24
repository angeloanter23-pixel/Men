import React, { useState, useEffect } from 'react';
import { MenuItem, CartItem, OrderMode } from '../types';

interface DetailPanelProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onSendToKitchen: (item: CartItem) => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ item, isOpen, onClose, onAddToCart, onSendToKitchen }) => {
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [orderTo, setOrderTo] = useState('');
  const [orderMode, setOrderMode] = useState<OrderMode>('Dine-in');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

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
    orderMode: orderMode,
    customInstructions: instructions.trim(),
    orderTo: orderTo.trim() || 'Guest'
  });

  const handleAdd = () => { onAddToCart(getFinalItem()); onClose(); resetState(); };
  const handleKitchen = () => { onSendToKitchen(getFinalItem()); onClose(); resetState(); };

  const modes: { id: OrderMode; icon: string; label: string }[] = [
    { id: 'Dine-in', icon: 'fa-chair', label: 'Dine-in' },
    { id: 'Takeout', icon: 'fa-bag-shopping', label: 'Takeout' },
    { id: 'Delivery', icon: 'fa-truck', label: 'Delivery' }
  ];

  return (
    <aside 
      className={`fixed inset-0 z-[250] bg-white transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col overflow-hidden
        ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
      `}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 left-6 z-[260] w-12 h-12 bg-white/80 backdrop-blur-md text-slate-900 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl border border-slate-100"
        aria-label="Back to menu"
      >
        <i className="fa-solid fa-chevron-left text-base"></i>
      </button>

      <div className="flex-1 bg-[#FBFBFD] flex flex-col h-full relative overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar pb-64">
          <div className="px-6 pt-12 pb-6 flex justify-center">
            <div className="w-full max-w-sm aspect-square relative rounded-[4rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] bg-white border border-slate-100 group">
              <img 
                src={item.image_url} 
                alt={item.name} 
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
              />
            </div>
          </div>

          <div className="max-w-xl mx-auto space-y-10 p-8 md:p-12 pt-0">
            <div className="text-center space-y-2 mb-10">
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-primary block">Best Seller</span>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-slate-900">
                    {item.name}
                </h1>
            </div>

            <div className="border-b border-slate-100 pb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
               <div className="text-center sm:text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Price</p>
                  <h2 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">₱{item.price.toLocaleString()}</h2>
               </div>
               
               <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-1.5">
                     <i className="fa-solid fa-users text-slate-200 text-xs"></i>
                     <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-none">{item.pax}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-100"></div>
                  <div className="flex flex-col items-center gap-1.5">
                     <i className="fa-solid fa-clock text-slate-200 text-xs"></i>
                     <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-none">{item.serving_time}</span>
                  </div>
               </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">About this dish</h3>
                <p className="text-slate-500 text-lg leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>

              {item.ingredients && item.ingredients.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Ingredients</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {item.ingredients.map((ing: any, i: number) => (
                      <div key={i} className="bg-white border border-slate-100 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary/40"></div>
                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">
                          {typeof ing === 'string' ? ing : (ing.label || ing.key)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em] ml-1">Your Name</label>
                  <div className="relative">
                    <i className="fa-solid fa-user absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 text-xs"></i>
                    <input 
                      type="text" 
                      placeholder="Enter guest name" 
                      value={orderTo} 
                      onChange={(e) => setOrderTo(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-50 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold outline-none focus:ring-4 ring-brand-primary/5 transition-all shadow-inner" 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em] ml-1">Special Notes</label>
                  <textarea 
                    placeholder="Allergies or custom requests..." 
                    value={instructions} 
                    onChange={(e) => setInstructions(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-50 rounded-[2.5rem] py-6 px-8 text-sm font-bold outline-none h-36 resize-none focus:ring-4 ring-brand-primary/5 transition-all shadow-inner leading-relaxed" 
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <label className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em] ml-1">Service Mode</label>
                  <div className="bg-slate-50 p-1.5 rounded-2xl flex border border-slate-100 shadow-inner">
                    {modes.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setOrderMode(mode.id)}
                        className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl transition-all ${orderMode === mode.id ? 'bg-white text-brand-primary shadow-md shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <i className={`fa-solid ${mode.icon} text-sm ${orderMode === mode.id ? 'animate-bounce' : ''}`}></i>
                        <span className="text-[9px] font-black uppercase tracking-widest">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-white/95 backdrop-blur-2xl border-t border-slate-100 z-[270] shadow-[0_-20px_40px_-10px_rgba(0,0,0,0.03)]">
           <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-6">
              <div className="flex items-center justify-between gap-8 w-full sm:w-auto">
                 <div className="shrink-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Total</p>
                    <p className="text-3xl font-black text-brand-primary tracking-tighter leading-none">₱{(item.price * quantity).toLocaleString()}</p>
                 </div>
                 
                 <div className="flex items-center gap-4 bg-slate-100/80 p-2 rounded-2xl border border-slate-100">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-brand-primary transition-all active:scale-90 shadow-sm flex items-center justify-center border border-slate-50"><i className="fa-solid fa-minus text-[10px]"></i></button>
                    <span className="font-black text-slate-900 text-xl tabular-nums min-w-[1.5rem] text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-brand-primary transition-all active:scale-90 shadow-sm flex items-center justify-center border border-slate-50"><i className="fa-solid fa-plus text-[10px]"></i></button>
                 </div>
              </div>

              <div className="flex gap-3 w-full sm:flex-1 shrink-0">
                 <button 
                   onClick={handleAdd}
                   className="flex-1 bg-slate-900 text-white py-6 rounded-[2.2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all border border-white/10"
                 >
                   Add to cart
                 </button>
                 <button 
                   onClick={handleKitchen}
                   className="flex-[1.5] bg-brand-primary text-white py-6 rounded-[2.2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-brand-primary/20 active:scale-95 transition-all hover:bg-orange-600"
                 >
                   Order Now
                 </button>
              </div>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default DetailPanel;