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
    <div ref={wrapperRef} className="px-6 mb-8 relative z-50">
      <div className="flex gap-4 relative items-center">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-slate-400 group-focus-within:text-slate-900 transition-colors text-sm"></i>
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
            className="w-full bg-white border-none py-4 pl-12 pr-4 rounded-2xl text-[15px] font-bold text-slate-900 outline-none shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] focus:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all placeholder:text-slate-300 placeholder:font-medium"
          />
        </div>
        {onFilterClick && (
          <button 
            onClick={onFilterClick}
            className="w-12 h-12 flex items-center justify-center text-slate-900 active:scale-90 transition-all hover:opacity-70"
          >
            <i className="fa-solid fa-sliders text-xl"></i>
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
