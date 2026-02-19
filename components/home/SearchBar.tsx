import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onFilterClick }) => {
  return (
    <div className="px-6 mb-8 max-w-2xl mx-auto">
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-slate-300 group-focus-within:text-[#FF6B00] transition-colors text-sm"></i>
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search for dishes, drinks..."
            className="w-full bg-slate-50 border border-slate-100 py-4 pl-11 pr-4 rounded-lg text-[15px] font-medium text-slate-900 outline-none focus:ring-4 ring-[#FF6B00]/5 focus:bg-white transition-all placeholder:text-slate-300"
          />
        </div>
        {onFilterClick && (
          <button 
            onClick={onFilterClick}
            className="px-2 flex items-center justify-center text-[#FF6B00] transition-all active:scale-90"
          >
            <i className="fa-solid fa-sliders text-xl"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
