import React, { useState, useEffect, useMemo } from 'react';
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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setQuantity(1);
      setInstructions('');
      setOrderTo('');
      if (item?.option_groups) {
          const groupDefaults: Record<string, string[]> = {};
          item.option_groups.forEach(g => {
              if (g.required && g.max_choices === 1 && g.options.length > 0) {
                  groupDefaults[g.name] = [g.options[0].name];
              }
          });
          setSelectedOptions(groupDefaults);
      } else {
          setSelectedOptions({});
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
    pay_as_you_order: !!item.pay_as_you_order,
    price: totalPrice / quantity
  });

  return (
    <div className={`fixed inset-0 z-[1200] transition-transform duration-500 font-poppins flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="absolute inset-0 bg-[#D81B60]/95" />
      
      <div className="relative z-10 px-6 pt-12 pb-6 flex items-center justify-between text-white">
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i className="fa-solid fa-chevron-left"></i></button>
        <button className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i className="fa-regular fa-heart"></i></button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 min-h-0">
         <div className="w-full max-w-[240px] aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white/10 rotate-3 shrink-0">
            <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
         </div>
      </div>

      <div className="relative z-10 bg-white rounded-t-[3.5rem] p-8 pb-32 flex flex-col gap-8 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] overflow-y-auto no-scrollbar max-h-[75vh]">
         <div className="flex justify-between items-start">
            <div className="w-2/3">
               <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-1">{item.name}</h2>
               <p className="text-[10px] font-black text-[#D81B60] uppercase tracking-widest">{item.cat_name}</p>
            </div>
            <div className="text-right">
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
         </div>

         <div className="space-y-6">
            <div className="space-y-2">
                <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest">Description</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {item.description}
                </p>
            </div>

            {/* ADD-ONS SECTION */}
            {item.option_groups?.map((group, gIdx) => (
              <div key={gIdx} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest">{group.name}</h4>
                    <span className="text-[9px] font-bold text-slate-400 uppercase italic">
                        {group.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {group.options.map((opt, oIdx) => {
                      const isSelected = (selectedOptions[group.name] || []).includes(opt.name);
                      return (
                        <button 
                          key={oIdx} 
                          onClick={() => handleToggleOption(group.name, opt.name, group.max_choices)}
                          className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all text-left ${isSelected ? 'bg-[#D81B60]/5 border-[#D81B60]' : 'bg-slate-50 border-transparent'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-[#D81B60] border-[#D81B60]' : 'border-slate-300'}`}>
                              {isSelected && <i className="fa-solid fa-check text-[8px] text-white"></i>}
                            </div>
                            <span className={`text-xs font-bold ${isSelected ? 'text-[#D81B60]' : 'text-slate-600'}`}>{opt.name}</span>
                          </div>
                          {opt.price > 0 && <span className="text-[10px] font-bold text-slate-400">+₱{opt.price}</span>}
                        </button>
                      );
                    })}
                  </div>
              </div>
            ))}

            <div className="space-y-4 pt-4 border-t border-slate-50">
               <input 
                  type="text" 
                  value={orderTo} 
                  onChange={e => setOrderTo(e.target.value)} 
                  placeholder="Guest Name..." 
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold outline-none"
               />
               <textarea 
                  value={instructions} 
                  onChange={e => setInstructions(e.target.value)} 
                  placeholder="Special instructions..." 
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-medium outline-none h-24 resize-none"
               />
            </div>
         </div>

         <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-50 flex items-center gap-4 z-20">
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
              <div className="flex flex-col items-start leading-none">
                 <span className="text-[10px] opacity-70 mb-1">Add to selection</span>
                 <span className="text-sm">₱{totalPrice.toLocaleString()}</span>
              </div>
              <i className="fa-solid fa-cart-shopping"></i>
            </button>
         </div>
      </div>
    </div>
  );
};

export default ModernDetailPanel;