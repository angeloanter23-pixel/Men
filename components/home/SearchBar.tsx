import React, { useState, useEffect, useRef } from 'react';
import { MenuItem } from '../../types';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
  suggestions?: MenuItem[];
  onSuggestionClick?: (item: MenuItem) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onFilterClick, suggestions = [], onSuggestionClick }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = value.trim() 
    ? suggestions.filter(item => 
        item.name.toLowerCase().includes(value.toLowerCase()) || 
        item.cat_name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div ref={wrapperRef} className="px-6 mb-4 relative z-50">
      <div className="flex gap-4 relative items-center">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-slate-400 group-focus-within:text-slate-600 transition-colors text-xs"></i>
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search menu..."
            className="w-full bg-[#F2F2F7] border border-white/50 py-2.5 pl-9 pr-4 rounded-xl text-[13px] font-bold text-slate-600 outline-none shadow-[inset_2px_2px_5px_#d1d1d6,inset_-2px_-2px_5px_#ffffff] focus:bg-[#F2F2F7] transition-all placeholder:text-slate-400 placeholder:font-medium"
          />
        </div>
        {onFilterClick && (
          <button 
            onClick={onFilterClick}
            className="w-10 h-10 flex items-center justify-center text-slate-500 bg-[#F2F2F7] rounded-xl border border-white/50 shadow-[3px_3px_6px_#d1d1d6,-3px_-3px_6px_#ffffff] hover:shadow-[5px_5px_10px_#d1d1d6,-5px_-5px_10px_#ffffff] active:shadow-[inset_2px_2px_5px_#d1d1d6,inset_-2px_-2px_5px_#ffffff] active:scale-[0.98] transition-all"
          >
            <i className="fa-solid fa-magnifying-glass text-sm"></i>
          </button>
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-6 right-6 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden">
          {filteredSuggestions.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSuggestionClick?.(item);
                setShowSuggestions(false);
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-none"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.cat_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
