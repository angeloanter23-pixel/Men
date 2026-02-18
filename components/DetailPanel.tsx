import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MenuItem, CartItem, OrderMode } from '../types';

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

  return (
    <div className={`fixed inset-0 z-[1200] transition-all duration-500 flex flex-col bg-white font-jakarta ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        <div className="relative w-full animate-fade-in">
          <button onClick={onClose} className="absolute top-6 left-6 z-20 w-11 h-11 flex items-center justify-center bg-white rounded-full text-slate-800 border border-slate-100 shadow-xl active:scale-90 transition-all">
            <i className="fa-solid fa-chevron-left text-base"></i>
          </button>
          <div className="w-full aspect-[4/3] overflow-hidden">
            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="px-6 py-10 space-y-10 max-w-2xl mx-auto w-full">
          <div className="space-y-4">
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00]">{item.cat_name}</p>
             <h1 className="text-4xl font-black tracking-tighter leading-none">{item.name}</h1>
             <p className="text-[16px] font-medium leading-relaxed text-slate-500 italic">"{item.description}"</p>
          </div>

          {item.ingredients && item.ingredients.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Composition</h3>
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
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Guest</h3>
                <input type="text" value={orderTo} onChange={e => setOrderTo(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all" placeholder="Enter name..." />
              </div>
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Notes</h3>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none h-24 resize-none focus:bg-white transition-all" placeholder="Any preferences?" />
              </div>
          </div>
        </div>
      </div>

      <footer className="p-6 bg-white border-t border-slate-100 backdrop-blur-3xl shadow-2xl shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-6">
            <div className="flex flex-col">
                <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Total Payable</p>
                <span className="text-3xl font-black tracking-tighter text-slate-900 leading-none">₱{totalPrice.toLocaleString()}</span>
            </div>
            <button onClick={() => { onAddToCart({...item, quantity, customInstructions: instructions, orderTo: orderTo || 'Guest', selectedOptions, price: totalPrice/quantity}); onClose(); }} className="flex-1 py-5 bg-[#FF6B00] text-white rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-xl active:scale-95 transition-all">Add to Selection</button>
        </div>
      </footer>
    </div>
  );
};

export default DetailPanel;