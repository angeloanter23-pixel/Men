import React, { useState } from 'react';

interface RichTextMenuProps {
  onFormat: (type: string, value?: string) => void;
  isVisible: boolean;
  onValueTrigger?: () => void;
  showPillars?: boolean;
}

type MenuCategory = 'format' | 'colors' | 'size' | null;

const RichTextMenu: React.FC<RichTextMenuProps> = ({ 
  onFormat, 
  isVisible, 
  onValueTrigger,
  showPillars = false
}) => {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>(null);

  if (!isVisible) return null;

  const toggleCategory = (cat: MenuCategory) => {
    setActiveCategory(activeCategory === cat ? null : cat);
  };

  return (
    <div className="w-full flex flex-col items-center pointer-events-none mb-4">
      {/* Sub-Menus */}
      <div className="mb-3 pointer-events-auto w-full flex justify-center">
        {activeCategory === 'format' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex items-center gap-1 shadow-xl animate-fade-in">
            <button onMouseDown={(e) => { e.preventDefault(); onFormat('bold'); }} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-700 transition-all active:scale-90" title="Bold"><i className="fa-solid fa-bold"></i></button>
            <button onMouseDown={(e) => { e.preventDefault(); onFormat('italic'); }} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-700 transition-all active:scale-90" title="Italic"><i className="fa-solid fa-italic"></i></button>
            <button onMouseDown={(e) => { e.preventDefault(); onFormat('underline'); }} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-700 transition-all active:scale-90" title="Underline"><i className="fa-solid fa-underline"></i></button>
          </div>
        )}

        {activeCategory === 'colors' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-2.5 flex items-center gap-3 shadow-xl animate-fade-in">
            <div className="flex gap-1.5">
              {['#000000', '#FF6B00', '#007AFF', '#D81B60', '#10B981'].map(c => (
                <button 
                  key={c} 
                  onMouseDown={(e) => { e.preventDefault(); onFormat('color', c); }}
                  className="w-7 h-7 rounded-full shadow-inner border border-black/5" 
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="w-px h-6 bg-slate-100"></div>
            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-slate-200">
               <input 
                type="color" 
                onMouseDown={(e) => e.stopPropagation()} 
                onChange={(e) => onFormat('color', e.target.value)}
                className="absolute -inset-2 w-12 h-12 cursor-pointer border-none p-0 bg-transparent" 
              />
            </div>
          </div>
        )}

        {activeCategory === 'size' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex items-center gap-1 shadow-xl animate-fade-in">
            <button onMouseDown={(e) => { e.preventDefault(); onFormat('size', '14px'); }} className="px-4 py-2 text-[10px] font-black text-slate-500 hover:text-orange-500 uppercase transition-colors">Small</button>
            <button onMouseDown={(e) => { e.preventDefault(); onFormat('size', '18px'); }} className="px-4 py-2 text-[12px] font-black text-slate-500 hover:text-orange-500 uppercase transition-colors">Regular</button>
            <button onMouseDown={(e) => { e.preventDefault(); onFormat('size', '24px'); }} className="px-4 py-2 text-[14px] font-black text-slate-500 hover:text-orange-500 uppercase transition-colors">Large</button>
            <button onMouseDown={(e) => { e.preventDefault(); onFormat('size', '32px'); }} className="px-4 py-2 text-[16px] font-black text-slate-500 hover:text-orange-500 uppercase transition-colors">XL</button>
          </div>
        )}
      </div>

      {/* Main Categories Bar */}
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 flex items-center gap-1 shadow-2xl pointer-events-auto">
        <button 
          onMouseDown={(e) => { e.preventDefault(); toggleCategory('format'); }}
          className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeCategory === 'format' ? 'bg-orange-500 text-white' : 'text-white/40 hover:text-white'}`}
          title="Text Style"
        >
          <i className="fa-solid fa-font text-sm"></i>
        </button>
        
        {showPillars && onValueTrigger && (
          <button 
            onMouseDown={(e) => { e.preventDefault(); onValueTrigger(); }}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all text-white/40 hover:text-white`}
            title="Add Pillars"
          >
            <i className="fa-solid fa-gem text-sm"></i>
          </button>
        )}
        
        <button 
          onMouseDown={(e) => { e.preventDefault(); toggleCategory('colors'); }}
          className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeCategory === 'colors' ? 'bg-orange-500 text-white' : 'text-white/40 hover:text-white'}`}
          title="Colors"
        >
          <i className="fa-solid fa-palette text-sm"></i>
        </button>
        
        <button 
          onMouseDown={(e) => { e.preventDefault(); toggleCategory('size'); }}
          className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeCategory === 'size' ? 'bg-orange-500 text-white' : 'text-white/40 hover:text-white'}`}
          title="Text Sizes"
        >
          <i className="fa-solid fa-text-height text-sm"></i>
        </button>
      </div>
    </div>
  );
};

export default RichTextMenu;