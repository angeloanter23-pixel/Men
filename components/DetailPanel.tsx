import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MenuItem, CartItem, OrderMode } from '../types';

interface DetailPanelProps {
  item: MenuItem | null;
  isOpen: boolean;
  isProcessing?: boolean;
  restaurantName?: string;
  tableLabel?: string;
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
  const [orderMode, setOrderMode] = useState<OrderMode>('Dine-in');
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [footerVisible, setFooterVisible] = useState(true);
  const lastScrollTop = useRef(0);

  const sessionRaw = localStorage.getItem('foodie_active_session') || localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const template = session?.theme?.template || 'classic';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setFooterVisible(true);
      if (item?.variations) {
          const defaults: Record<string, string> = {};
          item.variations.forEach(v => { if (v.name.toLowerCase() !== 'size') defaults[v.name] = v.options[0]; });
          setSelectedVariations(defaults);
      }
      // Initialize required options
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    const scrollHeight = e.currentTarget.scrollHeight;
    const clientHeight = e.currentTarget.clientHeight;

    const isAtBottom = currentScrollTop + clientHeight >= scrollHeight - 60;

    if (isAtBottom) {
      setFooterVisible(true);
    } else if (currentScrollTop > lastScrollTop.current && currentScrollTop > 40) {
      if (footerVisible) setFooterVisible(false);
    } else {
      if (!footerVisible) setFooterVisible(true);
    }
    lastScrollTop.current = currentScrollTop;
  };

  const handleToggleOption = (groupName: string, optionName: string, maxChoices: number) => {
    const current = selectedOptions[groupName] || [];
    const group = item?.option_groups?.find(g => g.name === groupName);
    const isRequired = group?.required;
    
    let next;

    if (maxChoices === 1) {
        if (current.includes(optionName)) {
            // Deselect if already selected AND not required
            next = isRequired ? [optionName] : [];
        } else {
            next = [optionName];
        }
    } else {
        if (current.includes(optionName)) {
            next = current.filter(o => o !== optionName);
        } else {
            if (current.length < maxChoices) {
                next = [...current, optionName];
            } else {
                next = current; // Limit reached
            }
        }
    }

    setSelectedOptions(p => ({ ...p, [groupName]: next }));
  };

  const totalPrice = useMemo(() => {
    if (!item) return 0;
    let base = item.price;
    
    // Add option costs
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

  if (!item) return null;

  const resetState = () => {
    setQuantity(1);
    setInstructions('');
    setOrderTo('');
    setOrderMode('Dine-in');
    setSelectedVariations({});
    setSelectedOptions({});
    setFooterVisible(true);
  };

  const getFinalItem = (): CartItem => ({
    ...item,
    quantity,
    orderMode,
    customInstructions: instructions.trim(),
    orderTo: orderTo.trim() || 'Guest',
    selectedVariations,
    selectedOptions,
    price: totalPrice / quantity // Effective price per unit
  });

  const isMidnight = template === 'midnight';
  const isLoft = template === 'loft';

  const containerClass = `fixed inset-0 z-[1200] transition-all duration-500 flex flex-col ${
      isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
  } ${isMidnight ? 'bg-[#0A0A0B] text-white font-outfit' : isLoft ? 'bg-[#FCFAF8] text-[#2D2926] font-playfair' : 'bg-white font-jakarta'}`;

  return (
    <div className={containerClass}>
      {/* SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth" onScroll={handleScroll}>
        {/* TOP SECTION */}
        <div className="relative w-full animate-fade-in">
          <button onClick={onClose} className={`absolute top-6 left-6 z-20 w-11 h-11 flex items-center justify-center shadow-xl active:scale-90 transition-all ${
              isMidnight ? 'bg-white/10 text-white rounded-xl' : 
              isLoft ? 'bg-[#2D2926] text-white rounded-none' : 
              'bg-white rounded-full text-slate-800 border border-slate-100'
          }`}>
            <i className="fa-solid fa-chevron-left text-base"></i>
          </button>
          
          <div className={`w-full aspect-[4/3] md:aspect-[21/9] overflow-hidden ${
              isMidnight ? 'rounded-none border-b border-white/5' : 
              isLoft ? 'rounded-none grayscale-[0.2]' : 
              'p-0'
          }`}>
            <img src={item.image_url} alt="" className="w-full h-full object-cover transition-transform duration-[10s] hover:scale-105" />
          </div>
        </div>

        {/* CONTENT CORE */}
        <div className="px-6 py-6 space-y-10 max-w-2xl mx-auto w-full">
          <div className={`animate-fade-in-up delay-75 ${isLoft ? 'text-center' : 'space-y-3'}`}>
             <p className={`text-[10px] font-bold uppercase tracking-widest ${
                 isMidnight ? 'text-indigo-400' : isLoft ? 'text-[#8B7E74]' : 'text-[#FF6B00]'
             }`}>
                {isLoft ? 'Selected Choice' : 'The Dish'}
             </p>
             <h1 className={`font-black tracking-tight leading-none ${
                 isMidnight ? 'text-4xl' : isLoft ? 'text-5xl' : 'text-3xl'
             }`}>{item.name}</h1>
             <p className={`text-[15px] font-medium leading-relaxed mt-4 ${
                 isMidnight ? 'text-white/60' : 'text-slate-500'
             }`}>{item.description}</p>
          </div>

          {/* DYNAMIC OPTIONS */}
          {item.option_groups && item.option_groups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-4 animate-fade-in-up">
                  <div className="flex items-center justify-between">
                      <div>
                          <h3 className={`text-[10px] font-black uppercase tracking-widest ${isMidnight ? 'opacity-40' : 'text-slate-400'}`}>{group.name}</h3>
                          {group.required && <p className="text-[7px] font-bold text-rose-500 uppercase tracking-widest mt-1">Selection Required</p>}
                      </div>
                      <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                          {group.max_choices === 1 ? 'Single Choice' : `Pick up to ${group.max_choices}`}
                      </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.options.map((opt, oIdx) => {
                          const isSelected = (selectedOptions[group.name] || []).includes(opt.name);
                          return (
                              <button 
                                key={oIdx}
                                onClick={() => handleToggleOption(group.name, opt.name, group.max_choices)}
                                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left ${
                                    isSelected 
                                    ? (isMidnight ? 'bg-indigo-600/10 border-indigo-600 shadow-lg' : 'bg-white border-[#FF6B00] shadow-md ring-4 ring-[#FF6B00]/5') 
                                    : (isMidnight ? 'bg-white/5 border-white/5 opacity-50' : 'bg-[#F9F9FB] border-slate-100 opacity-80')
                                }`}
                              >
                                  <div className="flex items-center gap-4">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                          isSelected ? 'bg-[#FF6B00] border-[#FF6B00]' : 'border-slate-300'
                                      }`}>
                                          {isSelected && <i className="fa-solid fa-check text-[10px] text-white"></i>}
                                      </div>
                                      <span className={`text-sm font-bold ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{opt.name}</span>
                                  </div>
                                  {opt.price > 0 && (
                                      <span className={`text-[10px] font-black ${isSelected ? 'text-[#FF6B00]' : 'text-slate-400'}`}>+₱{opt.price}</span>
                                  )}
                              </button>
                          );
                      })}
                  </div>
              </div>
          ))}

          {/* INGREDIENTS */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div className="space-y-3 animate-fade-in-up">
              <h3 className={`text-[9px] font-bold uppercase tracking-widest ${isMidnight ? 'opacity-40' : 'text-slate-400'}`}>Ingredients</h3>
              <div className="flex flex-wrap gap-2">
                {item.ingredients.map((ing, i) => (
                  <span key={i} className={`px-4 py-2 text-[9px] font-bold border ${
                    isMidnight ? 'bg-white/5 border-white/10 text-white/50' : 'bg-slate-50 border-slate-100 text-slate-500'
                  } ${isLoft ? 'rounded-none' : 'rounded-xl'}`}>
                    {typeof ing === 'string' ? ing : (ing.label || ing.name)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* INPUTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8 border-t border-black/5 animate-fade-in-up delay-300">
              <div className="space-y-2">
                <h3 className={`text-[9px] font-bold uppercase tracking-widest ${isMidnight ? 'opacity-40' : 'text-slate-400'}`}>Guest</h3>
                <input 
                    type="text" value={orderTo} onChange={(e) => setOrderTo(e.target.value)} 
                    className={`w-full p-4 text-sm font-bold outline-none border transition-all ${
                        isMidnight ? 'bg-white/5 border-white/10 text-white rounded-xl' : isLoft ? 'bg-transparent border-[#2D2926]/20 rounded-none focus:border-[#2D2926]' : 'bg-slate-50 border-slate-100 rounded-xl'
                    }`}
                    placeholder="Guest name..." 
                />
              </div>
              <div className="space-y-2">
                <h3 className={`text-[9px] font-bold uppercase tracking-widest ${isMidnight ? 'opacity-40' : 'text-slate-400'}`}>Notes</h3>
                <textarea 
                    value={instructions} onChange={(e) => setInstructions(e.target.value)} 
                    className={`w-full p-4 text-xs font-bold outline-none border h-24 resize-none transition-all ${
                        isMidnight ? 'bg-white/5 border-white/10 text-white rounded-xl' : isLoft ? 'bg-transparent border-[#2D2926]/20 rounded-none h-24' : 'bg-slate-50 border-slate-100 rounded-xl'
                    }`}
                    placeholder="Preferences..." 
                />
              </div>
          </div>
          <div className="h-64" />
        </div>
      </div>

      {/* APPLE iOS STYLE STICKY FOOTER */}
      <footer className={`fixed bottom-0 left-0 right-0 z-30 transition-all duration-400 transform ${
          footerVisible ? 'translate-y-0' : 'translate-y-full'
      } ${
          isMidnight ? 'bg-[#0A0A0B]/90 border-t border-white/10' : isLoft ? 'bg-[#FCFAF8]/95 border-t border-[#2D2926]/10' : 'bg-white/80 border-t border-slate-200/50'
      } backdrop-blur-2xl shadow-[0_-15px_40px_rgba(0,0,0,0.08)]`}>
        <div className="max-w-2xl mx-auto px-6 py-4 space-y-4">
            
            {/* ROW 1: iOS STEPPER & PRICE */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <p className={`text-[8px] font-bold uppercase mb-0.5 ${isMidnight ? 'text-indigo-400/60' : 'text-slate-400'}`}>Total Amount</p>
                    <span className={`text-2xl font-bold tracking-tight leading-none ${isMidnight ? 'text-indigo-400' : 'text-slate-900'}`}>₱{totalPrice.toLocaleString()}</span>
                </div>

                {/* iOS Style Segmented Stepper */}
                <div className={`flex items-center gap-4 px-4 py-2 border ${
                    isMidnight ? 'bg-white/5 border-white/10 rounded-xl' : isLoft ? 'border-[#2D2926] rounded-none' : 'bg-slate-100/50 border-slate-200/60 rounded-full'
                }`}>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-slate-400 active:opacity-40 transition-opacity p-1"><i className="fa-solid fa-minus text-xs"></i></button>
                    <span className="text-lg font-bold tabular-nums min-w-[1.2rem] text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="text-slate-400 active:opacity-40 transition-opacity p-1"><i className="fa-solid fa-plus text-xs"></i></button>
                </div>
            </div>

            {/* ROW 2: SMALLENED SIDE-BY-SIDE BUTTONS */}
            <div className="grid grid-cols-2 gap-3 pb-2">
                <button 
                    onClick={() => { onAddToCart(getFinalItem()); onClose(); resetState(); }}
                    className={`py-3.5 text-[13px] font-bold whitespace-nowrap transition-all active:opacity-60 border ${
                        isMidnight ? 'bg-white/10 border-white/5 text-white rounded-xl' : 
                        isLoft ? 'border border-[#2D2926] text-[#2D2926] rounded-none' : 
                        'bg-slate-200/50 border-transparent text-slate-800 rounded-2xl'
                    }`}
                >
                    Add to Cart
                </button>
                <button 
                    onClick={() => { onSendToKitchen(getFinalItem()); onClose(); resetState(); }}
                    disabled={isProcessing}
                    className={`py-3.5 text-[13px] font-bold whitespace-nowrap transition-all shadow-md active:opacity-70 ${
                        isMidnight ? 'bg-indigo-600 text-white rounded-xl' : 
                        isLoft ? 'bg-[#2D2926] text-white rounded-none' : 
                        'bg-[#007AFF] text-white rounded-2xl'
                    }`}
                >
                    {isProcessing ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Order Now'}
                </button>
            </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .delay-75 { animation-delay: 75ms; }
        .delay-100 { animation-delay: 100ms; }
        .delay-150 { animation-delay: 150ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
      `}</style>
    </div>
  );
};

export default DetailPanel;