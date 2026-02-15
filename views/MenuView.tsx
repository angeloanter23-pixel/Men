
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MenuItem, Category } from '../types';

const Reveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms`, transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }} className="transition-all duration-[800ms] ease-out">
      {children}
    </div>
  );
};

interface MenuViewProps {
  popularItems: MenuItem[];
  categories: Category[];
  filteredItems: MenuItem[]; 
  activeCategory: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCategorySelect: (cat: string) => void;
  onItemSelect: (item: MenuItem) => void;
}

const MenuView: React.FC<MenuViewProps> = ({ 
  popularItems, categories, filteredItems, activeCategory, searchQuery, 
  onSearchChange, onCategorySelect, onItemSelect 
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const sessionRaw = localStorage.getItem('foodie_active_session') || localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const template = session?.theme?.template || 'classic';
  const isDemo = session?.qr_token?.startsWith('DEMO') || session?.qr_token?.includes('CAFE') || session?.qr_token?.includes('FINE') || session?.qr_token?.includes('BISTRO');

  const isMidnight = template === 'midnight';
  const isLoft = template === 'loft';

  const availableItems = useMemo(() => filteredItems.filter(item => item.is_available !== false && !item.parent_id), [filteredItems]);
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return availableItems;
    const query = searchQuery.toLowerCase().trim();
    return availableItems.filter(item => item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query) || item.cat_name.toLowerCase().includes(query));
  }, [availableItems, searchQuery]);

  const handleExitDemo = () => {
    localStorage.removeItem('foodie_active_session');
    window.location.hash = '#/landing';
    window.location.reload();
  };

  return (
    <div className={`animate-fade-in w-full min-h-screen pb-40 transition-colors duration-700 ${
        isMidnight ? 'bg-[#0A0A0B] text-white font-outfit' : 
        isLoft ? 'bg-[#FCFAF8] text-[#2D2926] font-playfair' : 
        'bg-[#FBFBFD] text-[#1D1D1F] font-jakarta'
    }`}>
      
      {/* HEADER & SEARCH SECTION */}
      <header className={`px-6 pt-16 md:pt-24 pb-12 max-w-[1200px] mx-auto ${isLoft ? 'text-center' : ''}`}>
        <Reveal>
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className={`text-[12px] font-black uppercase tracking-[0.4em] leading-none mb-4 ${
                  isMidnight ? 'text-indigo-400' : isLoft ? 'text-[#8B7E74]' : 'text-[#FF6B00]'
              }`}>
                  {isLoft ? 'Selection' : 'Explore Menu'}
              </h2>
              <h1 className={`text-[44px] md:text-[84px] font-black tracking-[-0.05em] leading-[1] uppercase ${
                  isMidnight ? 'text-white' : isLoft ? 'text-[#2D2926]' : 'text-[#1D1D1F]'
              }`}>
                {isLoft ? 'Fine Dining.' : <>Discover our <br className="md:hidden" /> <span className={isMidnight ? 'text-indigo-500' : 'text-[#86868B]'}>Dishes.</span></>}
              </h1>
            </div>

            {isDemo && (
              <button 
                onClick={handleExitDemo}
                className="px-6 py-3 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center gap-2"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                Exit Demo
              </button>
            )}
          </div>
        </Reveal>
        
        <Reveal delay={100}>
          <div className={`relative max-w-2xl ${isLoft ? 'mx-auto mt-4' : ''}`}>
            <div className={`flex items-center gap-4 px-6 py-5 transition-all border ${
                isMidnight ? `bg-white/5 backdrop-blur-2xl rounded-2xl border-white/10 ${isSearchFocused ? 'border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.2)]' : ''}` : 
                isLoft ? `bg-transparent border-b border-t-0 border-l-0 border-r-0 border-[#2D2926]/20 rounded-none ${isSearchFocused ? 'border-[#2D2926]' : ''}` :
                `bg-[#E8E8ED]/60 backdrop-blur-xl rounded-2xl border-transparent ${isSearchFocused ? 'bg-white border-[#007AFF] ring-4 ring-[#007AFF]/10' : ''}`
            }`}>
              <i className={`fa-solid fa-magnifying-glass text-[17px] ${isMidnight ? 'text-indigo-400' : isLoft ? 'text-[#2D2926]' : 'text-[#86868B]'}`}></i>
              <input 
                type="text" 
                placeholder={isLoft ? "Search our collection..." : "Find your favorite..."} 
                value={searchQuery} 
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`flex-1 bg-transparent border-none outline-none text-[17px] font-bold placeholder:opacity-50 ${
                    isMidnight ? 'text-white' : isLoft ? 'text-[#2D2926]' : 'text-[#1D1D1F]'
                }`}
              />
            </div>
          </div>
        </Reveal>
      </header>

      {/* CATEGORY UI */}
      <div className={`sticky top-[72px] z-40 backdrop-blur-2xl mb-12 ${
          isMidnight ? 'bg-[#0A0A0B]/80 border-b border-white/5' : 
          isLoft ? 'bg-[#FCFAF8]/80 border-y border-[#2D2926]/10' : 
          'bg-[#FBFBFD]/80 border-b border-slate-200/50'
      }`}>
        <div className="max-w-[1200px] mx-auto px-6 overflow-hidden">
          <div className={`flex overflow-x-auto no-scrollbar py-6 scroll-smooth gap-10 ${isLoft ? 'justify-center' : ''}`}>
            {['all', ...categories.map(c => c.name)].map((cat) => (
              <button 
                key={cat} 
                onClick={() => onCategorySelect(cat)}
                className={`text-[16px] font-black tracking-tight whitespace-nowrap transition-all relative uppercase ${
                    activeCategory === cat 
                    ? (isMidnight ? 'text-indigo-400' : isLoft ? 'text-[#2D2926]' : 'text-[#007AFF]') 
                    : (isMidnight ? 'text-white/30 hover:text-white' : 'text-[#86868B] hover:text-[#1D1D1F]')
                }`}
              >
                {cat === 'all' ? (isLoft ? 'Full Menu' : 'All') : cat}
                {activeCategory === cat && !isLoft && <div className={`absolute -bottom-6 left-0 right-0 h-[3px] rounded-full ${isMidnight ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-[#007AFF]'}`}></div>}
                {activeCategory === cat && isLoft && <div className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-[#8B7E74] rounded-full"></div>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MENU LIST GRID */}
      <div className="max-w-[1200px] mx-auto px-6">
        <Reveal delay={200}>
          <div className={`grid gap-8 ${
              isLoft ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-1 max-w-4xl mx-auto' : 
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {searchResults.map((item) => (
              <button 
                key={item.id} 
                onClick={() => onItemSelect(item)}
                className={`w-full group flex transition-all duration-500 text-left overflow-hidden ${
                    isMidnight ? 'bg-white/5 p-4 rounded-3xl border border-white/5 flex-col hover:bg-white/10 hover:border-indigo-500/30' : 
                    isLoft ? 'bg-transparent border-b border-[#2D2926]/10 p-0 rounded-none flex-row items-center py-10 hover:bg-black/[0.02]' : 
                    'bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex-col hover:shadow-xl'
                }`}
              >
                <div className={`relative overflow-hidden shrink-0 ${
                    isMidnight ? 'aspect-[4/3] w-full mb-6 rounded-2xl' : 
                    isLoft ? 'w-32 md:w-56 aspect-square rounded-none' : 
                    'aspect-[4/3] w-full mb-6 rounded-[1.8rem]'
                }`}>
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105" />
                  {item.is_popular && !isLoft && (
                      <div className={`absolute top-4 left-4 px-3 py-1 text-[8px] font-black uppercase tracking-widest ${
                          isMidnight ? 'bg-indigo-600 text-white' : 'bg-[#FF6B00] text-white'
                      }`}>Popular</div>
                  )}
                </div>
                
                <div className={`flex-1 flex flex-col ${isLoft ? 'pl-8 md:pl-12 pr-6' : 'px-2'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${
                        isMidnight ? 'text-indigo-400' : 'text-[#86868B]'
                    }`}>{item.cat_name}</p>
                    {/* Cooking Time & Pax displayed on card */}
                    <div className="flex items-center gap-3">
                       <span className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase">
                         <i className="fa-solid fa-clock opacity-40"></i> {item.serving_time}
                       </span>
                       <span className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase">
                         <i className="fa-solid fa-user-group opacity-40"></i> {item.pax}
                       </span>
                    </div>
                  </div>
                  
                  <h4 className={`font-black tracking-tight leading-tight mb-2 uppercase ${
                      isMidnight ? 'text-2xl text-white' : 
                      isLoft ? 'text-3xl md:text-4xl' : 
                      'text-[22px] text-[#1D1D1F]'
                  }`}>{item.name}</h4>
                  
                  <p className={`text-[14px] font-bold leading-relaxed line-clamp-2 mb-6 ${
                      isMidnight ? 'text-white/50' : 'text-[#86868B]'
                  }`}>{item.description}</p>
                  
                  <div className={`flex items-center justify-between pt-6 mt-auto border-t ${
                      isMidnight ? 'border-white/5' : 
                      isLoft ? 'border-none' : 
                      'border-slate-50'
                  }`}>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">
                          {item.has_variations ? 'Starts at' : 'Price'}
                        </span>
                        <span className={`text-[24px] font-black tracking-tighter ${
                            isMidnight ? 'text-white' : isLoft ? 'text-[28px] text-[#2D2926]' : 'text-[#1D1D1F]'
                        }`}>₱{item.price.toLocaleString()}</span>
                    </div>
                    <div className={`w-12 h-12 flex items-center justify-center transition-all ${
                        isMidnight ? 'bg-indigo-600 text-white rounded-xl' : 
                        isLoft ? 'border border-[#2D2926] text-[#2D2926] rounded-none group-hover:bg-[#2D2926] group-hover:text-white' : 
                        'bg-[#F5F5F7] text-[#1D1D1F] rounded-full'
                    }`}>
                        <i className={`fa-solid ${item.has_variations ? 'fa-arrow-right-long' : 'fa-plus'} text-xs`}></i>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default MenuView;
