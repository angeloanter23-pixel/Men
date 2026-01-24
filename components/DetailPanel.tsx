
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
  const [orderMode, setOrderMode] = useState<OrderMode>('Dine-in');
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [orderTo, setOrderTo] = useState('');

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
    orderMode,
    customInstructions: instructions.trim(),
    orderTo: orderTo.trim() || 'Me'
  });

  const handleAdd = () => { onAddToCart(getFinalItem()); onClose(); resetState(); };
  const handleKitchen = () => { onSendToKitchen(getFinalItem()); onClose(); resetState(); };

  return (
    <>
      {/* Backdrop - Only visible during mobile transition or if small screen */}
      <div 
        onClick={onClose} 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] transition-opacity duration-500 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
      />

      {/* Main Panel/Page Container */}
      <aside 
        className={`fixed z-[130] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] bg-white
          /* Mobile: Bottom Sheet */
          bottom-0 left-0 right-0 h-[92vh] rounded-t-[3.5rem] transform 
          /* Desktop/Tablet: Full-Screen Page Overlay */
          md:inset-0 md:h-screen md:w-screen md:rounded-none md:flex-row
          ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
        `}
      >
        {/* Page-Like Header (PC only) */}
        <div className="hidden md:flex absolute top-0 left-0 right-0 h-24 items-center justify-between px-12 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
           <div className="flex items-center gap-6">
              <button 
                onClick={onClose} 
                className="group flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                <i className="fa-solid fa-arrow-left transition-transform group-hover:-translate-x-1"></i>
                Back to Menu
              </button>
              <div className="h-6 w-px bg-slate-200"></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
                Menu <span className="mx-2 text-slate-200">/</span> <span className="text-slate-900">{item.name}</span>
              </p>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                <i className="fa-solid fa-star"></i> 4.9 Premium Verified
              </div>
           </div>
        </div>

        {/* Mobile Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md px-6 py-5 flex items-center justify-between border-b border-slate-50 md:hidden">
          <button onClick={onClose} className="p-2 bg-slate-50 text-slate-600 rounded-full w-10 h-10 flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition">
            <i className="fa-solid fa-chevron-down text-sm"></i>
          </button>
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.3em] italic">Dish Configuration</h3>
          <div className="w-10"></div>
        </div>

        {/* Immersive Layout Split */}
        <div className="flex flex-col md:flex-row h-full overflow-y-auto no-scrollbar md:overflow-hidden">
          
          {/* Left Side: Fixed Visual (Desktop) */}
          <div className="w-full md:w-1/2 h-[45vh] md:h-full relative shrink-0">
            <img 
              src={item.image_url} 
              alt={item.name} 
              className="w-full h-full object-cover md:h-screen md:sticky md:top-0 shadow-2xl" 
            />
            {/* Desktop Image Overlay */}
            <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none"></div>
            {item.is_popular && (
              <div className="absolute top-28 left-12 hidden md:block">
                 <span className="bg-orange-500 text-white px-8 py-3 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl animate-pulse">
                   Guest Favorite
                 </span>
              </div>
            )}
            
            {/* Mobile Image Overlay Price */}
            <div className="md:hidden absolute bottom-8 right-8 bg-white/95 backdrop-blur px-6 py-3 rounded-2xl font-black text-xl text-indigo-600 shadow-xl border border-white/50 italic">
              ₱{item.price}
            </div>
          </div>

          {/* Right Side: Scrollable Details (Desktop) */}
          <div className="w-full md:w-1/2 bg-white flex flex-col md:pt-24 h-full relative">
            <div className="p-8 md:p-20 md:pb-40 overflow-y-auto no-scrollbar flex-1">
              
              {/* Desktop-Only Title Area */}
              <div className="hidden md:block mb-16 animate-fade-in-up">
                 <h1 className="text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[0.85] italic uppercase mb-8">
                   {item.name.split(' ').slice(0, -1).join(' ')} <br/>
                   <span className="text-orange-500">{item.name.split(' ').slice(-1)}</span>
                 </h1>
                 <div className="flex gap-10 items-center">
                    <span className="text-4xl font-black text-indigo-600 italic">₱{item.price}</span>
                    <div className="h-10 w-px bg-slate-100"></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Kitchen Prep Time</p>
                      <p className="text-sm font-black text-slate-600 uppercase italic">{item.serving_time}</p>
                    </div>
                 </div>
              </div>

              {/* Mobile-Only Title area (handled in common layout if needed, but let's keep it consistent) */}
              <div className="md:hidden mb-10">
                <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase leading-none mb-4">{item.name}</h2>
              </div>

              <div className="max-w-2xl">
                <p className="text-slate-500 text-lg lg:text-xl leading-relaxed font-medium mb-16 border-l-8 border-indigo-50 pl-10 italic">
                  {item.description}
                </p>

                {/* Specs Section */}
                <div className="grid grid-cols-2 gap-6 mb-16">
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 group hover:bg-indigo-50 transition-colors">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Yield</p>
                      <p className="text-xl font-black text-slate-800 italic uppercase">{item.pax}</p>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 group hover:bg-orange-50 transition-colors">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Composition</p>
                      <p className="text-xl font-black text-slate-800 italic uppercase">Premium</p>
                  </div>
                </div>

                {/* Ingredients */}
                {item.ingredients && item.ingredients.length > 0 && (
                  <div className="mb-20">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 italic">Source Ingredients</label>
                    <div className="flex flex-wrap gap-4">
                      {item.ingredients.map((ing: any, i) => (
                        <span key={i} className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase italic border border-slate-100 shadow-sm transition-all hover:bg-slate-900 hover:text-white cursor-default">
                          {typeof ing === 'object' ? (ing.label || ing.key) : ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Config Controls */}
                <div className="space-y-10 bg-slate-50/50 p-10 rounded-[4rem] border border-slate-100 mb-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Guest Reference</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Table Captain" 
                          value={orderTo} 
                          onChange={(e) => setOrderTo(e.target.value)} 
                          className="w-full bg-white border border-slate-100 rounded-[2rem] py-6 px-8 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm" 
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Quantity Select</label>
                        <div className="flex items-center justify-between bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm h-[68px] px-6">
                           <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-all active:scale-90"><i className="fa-solid fa-minus"></i></button>
                           <span className="font-black text-slate-900 text-2xl tabular-nums">{quantity}</span>
                           <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-all active:scale-90"><i className="fa-solid fa-plus"></i></button>
                        </div>
                      </div>
                   </div>
                   
                   <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Kitchen Directives</label>
                      <textarea 
                        placeholder="Specify allergies or modifications..." 
                        value={instructions} 
                        onChange={(e) => setInstructions(e.target.value)} 
                        className="w-full bg-white border border-slate-100 rounded-[3rem] py-8 px-10 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none min-h-[140px] shadow-sm resize-none italic leading-relaxed" 
                      />
                   </div>
                </div>
              </div>
            </div>

            {/* Desktop Page Sticky Footer Actions */}
            <div className="hidden md:flex absolute bottom-0 right-0 left-0 p-12 bg-white/90 backdrop-blur-2xl border-t border-slate-100 gap-6 z-50">
               <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic leading-none">Subtotal Estimate</p>
                  <p className="text-3xl font-black text-indigo-600 italic tracking-tighter">₱{(item.price * quantity).toLocaleString()}</p>
               </div>
               <div className="flex gap-4 w-2/3">
                  <button 
                    onClick={handleAdd} 
                    className="flex-1 bg-slate-900 text-white py-6 rounded-3xl font-black text-[12px] uppercase tracking-[0.5em] hover:bg-indigo-600 active:scale-95 transition-all shadow-2xl shadow-slate-200"
                  >
                    Add to Cart
                  </button>
                  <button 
                    onClick={handleKitchen} 
                    className="flex-1 bg-indigo-600 text-white py-6 rounded-3xl font-black text-[12px] uppercase tracking-[0.5em] hover:bg-orange-500 active:scale-95 transition-all shadow-2xl shadow-indigo-100"
                  >
                    Send to Kitchen
                  </button>
               </div>
            </div>

            {/* Mobile Footer Actions */}
            <div className="md:hidden p-6 space-y-3 bg-white border-t border-slate-50 sticky bottom-0">
               <button onClick={handleAdd} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest">ADD TO CART</button>
               <button onClick={handleKitchen} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest">DIRECT ORDER</button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DetailPanel;
