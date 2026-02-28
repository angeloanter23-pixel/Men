import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onFilterClick }) => {
  return (
    <div className="px-6 mb-8 w-full">
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <i className="fa-solid fa-magnifying-glass text-slate-300 group-focus-within:text-[#FF6B00] transition-colors"></i>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search for dishes, drinks..."
          className="w-full bg-slate-50 border border-slate-100 py-5 pl-14 pr-14 rounded-[2rem] text-[15px] font-medium text-slate-900 outline-none focus:ring-4 ring-[#FF6B00]/5 focus:bg-white transition-all placeholder:text-slate-300"
        />
        {onFilterClick && (
          <button 
            onClick={onFilterClick}
            className="absolute inset-y-2 right-2 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#FF6B00] transition-all shadow-sm border border-slate-50 active:scale-90"
          >
            <i className="fa-solid fa-sliders"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
