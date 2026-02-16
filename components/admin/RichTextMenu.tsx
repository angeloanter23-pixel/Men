
import React, { useState, useEffect, forwardRef } from 'react';

interface RichTextMenuProps {
  onFormat: (type: string, value?: string) => void;
  isVisible: boolean;
}

const RichTextMenu = forwardRef<HTMLDivElement, RichTextMenuProps>(({ 
  onFormat, 
  isVisible
}, ref) => {
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;
    
    const handleViewport = () => {
      const offset = window.innerHeight - window.visualViewport!.height;
      setKeyboardOffset(offset);
    };

    window.visualViewport.addEventListener('resize', handleViewport);
    window.visualViewport.addEventListener('scroll', handleViewport);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewport);
      window.visualViewport?.removeEventListener('scroll', handleViewport);
    };
  }, []);

  if (!isVisible) return null;

  const SIZES = [
    { label: 'XS', val: '12px' },
    { label: 'S', val: '14px' },
    { label: 'M', val: '16px' },
    { label: 'L', val: '20px' },
    { label: 'XL', val: '28px' }
  ];

  const ActionButton = ({ icon, label, onClick, className = "" }: { icon?: string, label?: string, onClick: (e: React.MouseEvent) => void, className?: string }) => (
    <button 
      onMouseDown={(e) => { 
        // preventDefault is crucial to prevent focus loss from editor
        e.preventDefault(); 
        onClick(e); 
      }}
      className={`shrink-0 flex flex-col items-center justify-center gap-1 min-w-[52px] h-14 rounded-xl transition-all active:scale-90 hover:bg-slate-100 ${className}`}
    >
      {icon && <i className={`fa-solid ${icon} text-[15px]`}></i>}
      {label && <span className="text-[10px] font-black uppercase tracking-tighter opacity-40 leading-none">{label}</span>}
    </button>
  );

  return (
    <div 
      ref={ref}
      className="fixed left-0 right-0 z-[2500] flex flex-col items-center pointer-events-none px-4 transition-all duration-300 ease-out animate-fade-in"
      style={{ bottom: `${keyboardOffset + 12}px` }}
    >
      <div 
        className="bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] pointer-events-auto flex items-center overflow-x-auto no-scrollbar max-w-full w-full sm:w-auto p-1.5 gap-1"
        onMouseDown={(e) => e.stopPropagation()} 
      >
        
        {/* Basic Formatting */}
        <ActionButton icon="fa-bold" label="Bold" onClick={() => onFormat('bold')} className="text-slate-900" />
        <ActionButton icon="fa-italic" label="Italic" onClick={() => onFormat('italic')} className="text-slate-900" />
        <ActionButton icon="fa-underline" label="Line" onClick={() => onFormat('underline')} className="text-slate-900" />
        
        <div className="w-px h-6 bg-slate-200 mx-1 shrink-0" />

        {/* Lists */}
        <ActionButton icon="fa-list-ul" label="Bullet" onClick={() => onFormat('bullet')} className="text-slate-600" />
        <ActionButton icon="fa-list-ol" label="Order" onClick={() => onFormat('number')} className="text-slate-600" />

        <div className="w-px h-6 bg-slate-200 mx-1 shrink-0" />

        {/* Size Presets */}
        <div className="flex items-center gap-1 px-1">
          {SIZES.map((s) => (
            <button
              key={s.label}
              onMouseDown={(e) => { e.preventDefault(); onFormat('size', s.val); }}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-100 transition-all active:scale-90"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
});

export default RichTextMenu;
