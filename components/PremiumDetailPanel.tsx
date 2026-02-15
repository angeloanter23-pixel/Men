
import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, CartItem, OrderMode } from '../types';

interface PremiumDetailPanelProps {
  item: MenuItem | null;
  isOpen: boolean;
  isProcessing?: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onSendToKitchen: (item: CartItem) => void;
}

const PremiumDetailPanel: React.FC<PremiumDetailPanelProps> = ({ 
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
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

  if (!item) return null;

  const getFinalItem = (): CartItem => ({
    ...item,
    quantity,
    orderMode: 'Dine-in',
    customInstructions: instructions.trim(),
    orderTo: orderTo.trim() || 'Guest',
    selectedOptions,
    price: totalPrice / quantity
  });

  return (
    <div className={`fixed inset-0 z-[1200] transition-all duration-700 bg-[#0A0A0B] text-white font-['Outfit'] flex flex-col ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
      
      <div className="relative h-[45vh] w-full shrink-0 group">
          <img src={item.image_url} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[10s]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-black/30"></div>
          
          <button onClick={onClose} className="absolute top-8 left-8 w-14 h-14 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all shadow-2xl">
             <i className="fa-solid fa-xmark text-xl"></i>
          </button>

          <div className="absolute bottom-8 left-8 pr-8">
              <p className="text-[11px] font-black uppercase tracking-[0.6em] text-indigo-400 mb-3">{item.cat_name}</p>
              <h2 className="text-[44px] font-black tracking-tight leading-none italic uppercase">{item.name}</h2>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-10 space-y-12 pb-48">
          <div className="max-w-2xl mx-auto space-y-10">
              
              <div className="p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                  <p className="text-lg font-medium leading-relaxed text-white/60 italic">"{item.description}"</p>
                  
                  {/* METADATA CHIPS */}
                  <div className="flex items-center gap-4 mt-8">
                    <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-full flex items-center gap-2">
                       <i className="fa-solid fa-clock text-[10px] text-indigo-400"></i>
                       <span className="text-[11px] font-black uppercase tracking-widest text-indigo-100">{item.serving_time}</span>
                    </div>
                    <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-full flex items-center gap-2">
                       <i className="fa-solid fa-user-group text-[10px] text-indigo-400"></i>
                       <span className="text-[11px] font-black uppercase tracking-widest text-indigo-100">{item.pax}</span>
                    </div>
                  </div>
              </div>

              {item.option_groups?.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-6">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-indigo-400">{group.name}</h3>
                        <span className="text-[10px] font-bold text-white/30 uppercase">{group.max_choices === 1 ? 'Select one' : `Up to ${group.max_choices}`}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {group.options.map((opt, oIdx) => {
                              const isSelected = (selectedOptions[group.name] || []).includes(opt.name);
                              return (
                                  <button 
                                    key={oIdx}
                                    onClick={() => handleToggleOption(group.name, opt.name, group.max_choices)}
                                    className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-300 text-left ${
                                        isSelected 
                                        ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.2)]' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                    }`}
                                  >
                                      <span className={`font-bold uppercase tracking-tight ${isSelected ? 'text-white' : 'text-white/40'}`}>{opt.name}</span>
                                      {opt.price > 0 && <span className="text-[11px] font-black text-indigo-400">+₱{opt.price}</span>}
                                  </button>
                              );
                          })}
                      </div>
                  </div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-white/5">
                  <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 ml-4">Reserved For</p>
                    <input type="text" value={orderTo} onChange={e => setOrderTo(e.target.value)} className="w-full bg-white/5 border border-white/5 p-6 rounded-[2rem] text-sm font-bold outline-none focus:bg-white/10 transition-all" placeholder="Guest name..." />
                  </div>
                  <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 ml-4">Special Requests</p>
                    <textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="w-full bg-white/5 border border-white/5 p-6 rounded-[2rem] text-sm font-bold outline-none h-32 resize-none focus:bg-white/10 transition-all" placeholder="Preferences..." />
                  </div>
              </div>
          </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-[1250] p-8 bg-[#0A0A0B]/90 backdrop-blur-3xl border-t border-white/5">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-8">
              <div className="flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Estate Total</p>
                  <span className="text-[36px] font-black tracking-tighter text-indigo-500 leading-none">₱{totalPrice.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-3xl">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center active:scale-90 transition-all"><i className="fa-solid fa-minus text-xs"></i></button>
                  <span className="text-xl font-black w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center active:scale-90 transition-all"><i className="fa-solid fa-plus text-xs"></i></button>
              </div>

              <button 
                onClick={() => { onSendToKitchen(getFinalItem()); onClose(); }}
                disabled={isProcessing}
                className="flex-1 py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isProcessing ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Place Order'}
              </button>
          </div>
      </footer>
    </div>
  );
};

export default PremiumDetailPanel;
