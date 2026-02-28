import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MenuItem, CartItem } from '../types';
import StickyFooter from './home/StickyFooter';

interface DetailPanelProps {
  item: MenuItem | null;
  isOpen: boolean;
  isProcessing?: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onSendToKitchen: (item: CartItem) => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ 
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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [showFooter, setShowFooter] = useState(true);
  const [nameError, setNameError] = useState(false);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setQuantity(1);
      setInstructions('');
      setShowFooter(true);
      setNameError(false);
      
      // Load saved name
      const savedName = localStorage.getItem('foodie_guest_name');
      if (savedName) setOrderTo(savedName);
      else setOrderTo('');

      if (item?.option_groups) {
          const groupDefaults: Record<string, string[]> = {};
          item.option_groups.forEach(g => {
              if (g.required && g.max_choices === 1 && g.options.length > 0) {
                  groupDefaults[g.name] = [g.options[0].name];
              }
          });
          setSelectedOptions(groupDefaults);
      }
    } else { 
      document.body.style.overflow = 'unset'; 
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, item]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const currentScrollY = scrollContainerRef.current.scrollTop;
    
    if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
      setShowFooter(false);
    } else {
      setShowFooter(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const handleToggleOption = (groupName: string, optionName: string, maxChoices: number) => {
    const current = selectedOptions[groupName] || [];
    const group = item?.option_groups?.find(g => g.name === groupName);
    const isRequired = group?.required;
    
    let next;
    if (maxChoices === 1) {
        next = isRequired && current.includes(optionName) ? [optionName] : [optionName];
    } else {
        next = current.includes(optionName) ? current.filter(o => o !== optionName) : (current.length < maxChoices ? [...current, optionName] : current);
    }
    setSelectedOptions(p => ({ ...p, [groupName]: next }));
  };

  const totalPrice = useMemo(() => {
    if (!item) return 0;
    let base = item.price;
    if (item.option_groups) {
        item.option_groups.forEach(g => {
            const selectedInGroup = selectedOptions[g.name] || [];
            selectedInGroup.forEach(optName => {
                const opt = g.options.find(o => o.name === optName);
                if (opt) base += opt.price;
            });
        });
    }
    return base * quantity;
  }, [item, quantity, selectedOptions]);

  const validateAndExecute = (callback: (item: CartItem) => void) => {
    if (!orderTo.trim()) {
      setNameError(true);
      // Scroll to name input
      const input = document.getElementById('guest-name-input');
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    // Save name
    localStorage.setItem('foodie_guest_name', orderTo.trim());
    
    callback({
      ...item!,
      quantity,
      customInstructions: instructions,
      orderTo: orderTo.trim(),
      selectedOptions,
      price: totalPrice / quantity
    });
    onClose();
  };

  if (!item) return null;

  const mockReviews = [
    { name: "James Wilson", comment: "The flavors are perfectly balanced. Highly recommended!", rating: 5 },
    { name: "Maria Garcia", comment: "Fresh ingredients and great presentation. Will order again.", rating: 4 },
    { name: "David Chen", comment: "Good portion size and very tasty.", rating: 5 }
  ];

  return (
    <div className={`fixed inset-0 z-[1200] transition-all duration-500 bg-white font-jakarta ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto no-scrollbar scroll-smooth pb-60"
      >
        <div className="relative w-full animate-fade-in">
          <button onClick={onClose} className="absolute top-6 left-6 z-20 w-11 h-11 flex items-center justify-center bg-white rounded-full text-slate-800 border border-slate-100 shadow-xl active:scale-90 transition-all">
            <i className="fa-solid fa-chevron-left text-base"></i>
          </button>
          <div className="w-full aspect-[4/3] overflow-hidden">
            <img src={item.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>

        <div className="px-6 py-10 space-y-10 max-w-2xl mx-auto w-full">
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00]">{item.cat_name}</p>
                <div className="flex items-center gap-4 text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <i className="fa-solid fa-clock text-[10px]"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.serving_time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <i className="fa-solid fa-user-group text-[10px]"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.pax}</span>
                  </div>
                </div>
             </div>
             <h1 className="text-4xl font-black tracking-tighter leading-none">{item.name}</h1>
             <p className="text-[16px] font-medium leading-relaxed text-slate-500">{item.description}</p>
          </div>

          {item.ingredients && item.ingredients.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ingredients</h3>
              <div className="flex flex-wrap gap-2">
                {item.ingredients.map((ing, i) => (
                  <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl text-[11px] font-bold">
                    {typeof ing === 'string' ? ing : (ing.label || ing.name)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.option_groups?.map((group, gIdx) => (
              <div key={gIdx} className="space-y-4">
                  <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{group.name}</h3>
                      <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                          {group.max_choices === 1 ? 'Select One' : `Pick Up to ${group.max_choices}`}
                      </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.options.map((opt, oIdx) => {
                          const isSelected = (selectedOptions[group.name] || []).includes(opt.name);
                          return (
                              <button key={oIdx} onClick={() => handleToggleOption(group.name, opt.name, group.max_choices)} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left ${isSelected ? 'bg-white border-[#FF6B00] shadow-md ring-4 ring-orange-50' : 'bg-slate-50 border-transparent opacity-80'}`}>
                                  <div className="flex items-center gap-4">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-[#FF6B00] border-[#FF6B00]' : 'border-slate-300'}`}>
                                          {isSelected && <i className="fa-solid fa-check text-[10px] text-white"></i>}
                                      </div>
                                      <span className={`text-[15px] font-bold ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{opt.name}</span>
                                  </div>
                                  {opt.price > 0 && <span className="text-[10px] font-black text-slate-400">+₱{opt.price}</span>}
                              </button>
                          );
                      })}
                  </div>
              </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-100">
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Order for <span className="text-rose-500">*</span></h3>
                <input 
                  id="guest-name-input"
                  type="text" 
                  value={orderTo} 
                  onChange={e => { setOrderTo(e.target.value); if(e.target.value.trim()) setNameError(false); }} 
                  className={`w-full p-4 rounded-2xl text-sm font-bold outline-none transition-all border ${nameError ? 'bg-rose-50 border-rose-200 ring-4 ring-rose-500/5' : 'bg-slate-50 border-slate-100 focus:bg-white'}`} 
                  placeholder="Enter your name..." 
                />
                {nameError && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest ml-1">Please enter your name to continue</p>}
              </div>
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Special Instructions</h3>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none h-24 resize-none focus:bg-white transition-all" placeholder="Any preferences?" />
              </div>
          </div>

          {/* REVIEWS SECTION */}
          <div className="pt-10 border-t border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Guest Reviews</h3>
              <div className="flex items-center gap-1">
                <i className="fa-solid fa-star text-[#FF6B00] text-[10px]"></i>
                <span className="text-[11px] font-black text-slate-900">4.8</span>
              </div>
            </div>
            <div className="space-y-4">
              {mockReviews.map((rev, i) => (
                <div key={i} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-black text-slate-900">{rev.name}</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, starI) => (
                        <i key={starI} className={`fa-solid fa-star text-[8px] ${starI < rev.rating ? 'text-[#FF6B00]' : 'text-slate-200'}`}></i>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <StickyFooter 
        totalPrice={totalPrice}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAddToCart={() => validateAndExecute(onAddToCart)}
        onSendToKitchen={() => validateAndExecute(onSendToKitchen)}
        isVisible={showFooter}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default DetailPanel;
