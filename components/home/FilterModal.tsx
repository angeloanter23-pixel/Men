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
            <div className="flex px-8 mb-8 border-b border-slate-50">
              <button 
                onClick={() => setActiveTab('filter')}
                className={`flex-1 py-4 text-[15px] font-bold transition-all relative ${activeTab === 'filter' ? 'text-slate-900' : 'text-slate-300'}`}
              >
                Filter
                {activeTab === 'filter' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF6B00] rounded-t-full" />}
              </button>
              <button 
                onClick={() => setActiveTab('layout')}
                className={`flex-1 py-4 text-[15px] font-bold transition-all relative ${activeTab === 'layout' ? 'text-slate-900' : 'text-slate-300'}`}
              >
                Layout
                {activeTab === 'layout' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF6B00] rounded-t-full" />}
              </button>
            </div>

            <div className="px-8 space-y-8">
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
                        className={`w-full p-5 rounded-2xl border flex items-center justify-between transition-all ${tempSort === opt.id ? 'bg-orange-50 border-orange-200 ring-4 ring-orange-500/5' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                      >
                        <div className="flex items-center gap-4">
                          <i className={`fa-solid ${opt.icon} ${tempSort === opt.id ? 'text-[#FF6B00]' : 'text-slate-300'}`}></i>
                          <span className={`text-sm font-bold ${tempSort === opt.id ? 'text-slate-900' : ''}`}>{opt.label}</span>
                        </div>
                        {tempSort === opt.id && <i className="fa-solid fa-circle-check text-[#FF6B00]"></i>}
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

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'default', label: 'Default', icon: 'fa-grip' },
                      { id: 'compact', label: 'Compact', icon: 'fa-table-cells' },
                      { id: 'minimal', label: 'Minimal', icon: 'fa-list' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setTempLayout(opt.id as any)}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${tempLayout === opt.id ? 'bg-orange-50 border-orange-200 ring-4 ring-orange-500/5' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                      >
                        <i className={`fa-solid ${opt.icon} text-xl ${tempLayout === opt.id ? 'text-[#FF6B00]' : 'text-slate-200'}`}></i>
                        <span className={`text-[10px] font-bold ${tempLayout === opt.id ? 'text-slate-900' : ''}`}>{opt.label}</span>
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
