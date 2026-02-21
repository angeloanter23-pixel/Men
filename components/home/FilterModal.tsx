import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  currentSort: 'asc' | 'desc' | 'none';
  currentLayout: 'grid' | 'list';
}

const FilterModal: React.FC<FilterModalProps> = ({ 
  isOpen, 
  onClose, 
  onApply, 
  currentSort,
  currentLayout
}) => {
  const [activeTab, setActiveTab] = useState<'filter' | 'layout'>('filter');
  const [tempSort, setTempSort] = useState(currentSort);
  const [tempLayout, setTempLayout] = useState(currentLayout);

  const handleApply = () => {
    onApply({ sort: tempSort, layout: tempLayout });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[101] max-w-xl mx-auto pb-10 shadow-2xl overflow-hidden"
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-6" />

            {/* Top Nav Bar */}
            <div className="px-8 mb-8">
              <div className="bg-slate-100 p-1 rounded-xl flex">
                <button 
                  onClick={() => setActiveTab('filter')}
                  className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${activeTab === 'filter' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Filter
                </button>
                <button 
                  onClick={() => setActiveTab('layout')}
                  className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${activeTab === 'layout' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Layout
                </button>
              </div>
            </div>

            <div className="px-8 space-y-8 min-h-[320px]">
              {activeTab === 'filter' ? (
                <div className="space-y-6">
                  <header>
                    <h4 className="text-xl font-black text-slate-900 tracking-tighter">Sorting</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Arrange items by price</p>
                  </header>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'none', label: 'Default Order', icon: 'fa-sort' },
                      { id: 'asc', label: 'Price: Low to High', icon: 'fa-arrow-up-wide-short' },
                      { id: 'desc', label: 'Price: High to Low', icon: 'fa-arrow-down-wide-short' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setTempSort(opt.id as any)}
                        className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${tempSort === opt.id ? 'bg-orange-50 border-orange-200 ring-4 ring-orange-500/5' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tempSort === opt.id ? 'bg-[#FF6B00] text-white' : 'bg-white text-slate-300'}`}>
                            <i className={`fa-solid ${opt.icon}`}></i>
                          </div>
                          <span className={`text-sm font-bold ${tempSort === opt.id ? 'text-slate-900' : ''}`}>{opt.label}</span>
                        </div>
                        {tempSort === opt.id && <i className="fa-solid fa-circle-check text-[#FF6B00] text-lg"></i>}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <header>
                    <h4 className="text-xl font-black text-slate-900 tracking-tighter">Display</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Choose your preferred view</p>
                  </header>

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'default', label: 'Default View', icon: 'fa-grip', desc: 'Large cards with details' },
                      { id: 'compact', label: 'Compact Grid', icon: 'fa-table-cells', desc: 'Smaller cards, more items' },
                      { id: 'minimal', label: 'Minimal List', icon: 'fa-list', desc: 'Simple list view' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setTempLayout(opt.id as any)}
                        className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${tempLayout === opt.id ? 'bg-orange-50 border-orange-200 ring-4 ring-orange-500/5' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tempLayout === opt.id ? 'bg-[#FF6B00] text-white' : 'bg-white text-slate-300'}`}>
                            <i className={`fa-solid ${opt.icon}`}></i>
                          </div>
                          <div className="text-left">
                            <span className={`block text-sm font-bold ${tempLayout === opt.id ? 'text-slate-900' : ''}`}>{opt.label}</span>
                            <span className="text-[10px] font-medium opacity-60">{opt.desc}</span>
                          </div>
                        </div>
                        {tempLayout === opt.id && <i className="fa-solid fa-circle-check text-[#FF6B00] text-lg"></i>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button 
                  onClick={handleApply}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;
