
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

type SortType = 'popular' | 'price-low' | 'price-high' | 'alpha' | 'default';
type LayoutMode = 'detailed' | 'compact' | 'minimal';
type SettingsTab = 'sort' | 'layout';

const MenuView: React.FC<MenuViewProps> = ({ 
  popularItems, categories, filteredItems, activeCategory, searchQuery, 
  onSearchChange, onCategorySelect, onItemSelect 
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('sort');
  const [sortType, setSortType] = useState<SortType>('default');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('detailed');
  
  const sessionRaw = localStorage.getItem('foodie_active_session') || localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const template = session?.theme?.template || 'classic';
  const isDemo = session?.qr_token?.startsWith('DEMO') || session?.qr_token?.includes('CAFE') || session?.qr_token?.includes('FINE') || session?.qr_token?.includes('BISTRO');

  const isMidnight = template === 'midnight';
  const isLoft = template === 'loft';

  const availableItems = useMemo(() => filteredItems.filter(item => item.is_available !== false && !item.parent_id), [filteredItems]);
  
  const searchResults = useMemo(() => {
    let list = [...availableItems];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(item => item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query) || item.cat_name.toLowerCase().includes(query));
    }

    switch (sortType) {
      case 'popular':
        list.sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0));
        break;
      case 'price-low':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'alpha':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return list;
  }, [availableItems, searchQuery, sortType]);

  const handleExitDemo = () => {
    localStorage.removeItem('foodie_active_session');
    window.location.hash = '#/landing';
    window.location.reload();
  };

  const getCatIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'all': return 'fa-border-all';
      case 'main course': return 'fa-bowl-food';
      case 'breakfast': return 'fa-mug-saucer';
      case 'beverages': return 'fa-glass-water';
      case 'desserts': return 'fa-ice-cream';
      case 'snacks': return 'fa-hamburger';
      default: return 'fa-tag';
    }
  };

  const categoryList = useMemo(() => {
    return [
      { id: 'all', name: 'all', icon: 'fa-border-all' },
      ...categories
    ];
  }, [categories]);

  const SORT_OPTIONS: { id: SortType; label: string; icon: string }[] = [
    { id: 'popular', label: 'Trending', icon: 'fa-fire' },
    { id: 'price-low', label: 'Price Low', icon: 'fa-arrow-down-short-wide' },
    { id: 'price-high', label: 'Price High', icon: 'fa-arrow-up-wide-short' },
    { id: 'alpha', label: 'A to Z', icon: 'fa-arrow-down-a-z' }
  ];

  const LAYOUT_OPTIONS: { id: LayoutMode; label: string; icon: string }[] = [
    { id: 'detailed', label: 'Detailed View', icon: 'fa-table-cells-large' },
    { id: 'compact', label: 'Compact Grid', icon: 'fa-table-cells' },
    { id: 'minimal', label: 'Minimal List', icon: 'fa-list' }
  ];

  const SectionLabel: React.FC<{ children: string }> = ({ children }) => (
    <div className={`flex items-center gap-3 mb-6 px-2`}>
        <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isMidnight ? 'text-white/30' : 'text-slate-400'}`}>{children}</h3>
        <div className={`h-px flex-1 ${isMidnight ? 'bg-white/5' : 'bg-slate-100'}`}></div>
    </div>
  );

  return (
    <div className={`animate-fade-in w-full min-h-screen pb-40 transition-colors duration-700 ${
        isMidnight ? 'bg-[#0A0A0B] text-white font-outfit' : 
        isLoft ? 'bg-[#FCFAF8] text-[#2D2926] font-playfair' : 
        'bg-[#FBFBFD] text-[#1D1D1F] font-jakarta'
    }`}>
      
      {/* HEADER SECTION */}
      <header className={`px-6 pt-16 md:pt-24 pb-8 max-w-[1200px] mx-auto ${isLoft ? 'text-center' : ''}`}>
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className={`text-[12px] font-black uppercase tracking-[0.4em] leading-none mb-4 ${
                  isMidnight ? 'text-indigo-400' : isLoft ? 'text-[#8B7E74]' : 'text-[#FF6B00]'
              }`}>
                  {isLoft ? 'Selection' : 'Explore Catalog'}
              </h2>
              <h1 className={`text-[44px] md:text-[84px] font-black tracking-[-0.05em] leading-[1] uppercase ${
                  isMidnight ? 'text-white' : isLoft ? 'text-[#2D2926]' : 'text-[#1D1D1F]'
              }`}>
                {isLoft ? 'Fine Dining.' : <>Discover our <br className="md:hidden" /> Menu</>}
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
      </header>

      {/* POPULAR SCROLLER SECTION */}
      {popularItems.length > 0 && (
          <div className="max-w-[1200px] mx-auto px-6 mb-12">
            <Reveal delay={100}>
                <SectionLabel>Trending Picks</SectionLabel>
                <div className="flex overflow-x-auto no-scrollbar gap-5 pb-4 -mx-6 px-6 scroll-smooth">
                    {popularItems.map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => onItemSelect(item)}
                            className={`flex-shrink-0 w-[180px] md:w-[220px] rounded-2xl overflow-hidden group text-left relative transition-all duration-500 hover:scale-[1.02] shadow-sm hover:shadow-xl ${
                                isMidnight ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-50'
                            }`}
                        >
                            <div className="aspect-square w-full overflow-hidden relative">
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-[8s] group-hover:scale-110" />
                                <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xl px-2.5 py-1.5 rounded-xl border border-white shadow-lg">
                                    <span className="text-[11px] font-black text-slate-900 tracking-tighter">₱{item.price.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="p-4">
                                <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isMidnight ? 'text-indigo-400' : 'text-[#FF6B00]'}`}>{item.cat_name}</p>
                                <h4 className={`text-[14px] font-bold tracking-tight mb-2 leading-tight line-clamp-1 ${isMidnight ? 'text-white' : 'text-slate-900'}`}>{item.name}</h4>
                                <div className="flex items-center gap-3 opacity-50">
                                    <span className="text-[8px] font-bold uppercase flex items-center gap-1"><i className="fa-solid fa-clock text-[7px]"></i> {item.serving_time}</span>
                                    <span className="text-[8px] font-bold uppercase flex items-center gap-1"><i className="fa-solid fa-user-group text-[7px]"></i> {item.pax}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </Reveal>
          </div>
      )}

      {/* SEARCH SECTION */}
      <div className={`px-6 mb-12 max-w-[1200px] mx-auto ${isLoft ? 'text-center' : ''}`}>
        <Reveal delay={150}>
          <div className={`relative max-w-2xl flex items-center gap-1 ${isLoft ? 'mx-auto' : ''}`}>
            <div className={`flex-1 flex items-center h-16 gap-4 px-6 transition-all border ${
                isMidnight ? `bg-white/5 backdrop-blur-2xl rounded-2xl border-white/10 ${isSearchFocused ? 'border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.2)]' : ''}` : 
                isLoft ? `bg-transparent border-b border-t-0 border-l-0 border-r-0 border-[#2D2926]/20 rounded-none ${isSearchFocused ? 'border-[#2D2926]' : ''}` :
                `bg-[#E8E8ED]/60 backdrop-blur-xl rounded-2xl border-transparent ${isSearchFocused ? 'bg-white border-[#FF6B00] ring-4 ring-[#FF6B00]/10 shadow-lg' : ''}`
            }`}>
              <i className={`fa-solid fa-magnifying-glass text-[17px] ${isMidnight ? 'text-indigo-400' : isLoft ? 'text-[#2D2926]' : 'text-[#86868B]'}`}></i>
              <input 
                type="text" 
                placeholder={isLoft ? "Explore the collection..." : "Search for something delicious..."} 
                value={searchQuery} 
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`flex-1 bg-transparent border-none outline-none text-[17px] font-bold placeholder:opacity-50 ${
                    isMidnight ? 'text-white' : isLoft ? 'text-[#2D2926]' : 'text-[#1D1D1F]'
                }`}
              />
            </div>
            
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className={`w-16 h-16 shrink-0 flex items-center justify-center transition-all active:scale-90 ${
                isMidnight ? 'text-indigo-400' : 
                isLoft ? 'text-[#2D2926]' : 
                'text-[#FF6B00]'
              }`}
            >
              <i className="fa-solid fa-sliders text-xl"></i>
            </button>
          </div>
        </Reveal>
      </div>

      {/* CATEGORY UI */}
      <div className={`sticky top-[72px] z-40 backdrop-blur-2xl mb-12 ${
          isMidnight ? 'bg-[#0A0A0B]/80 border-b border-white/5' : 
          isLoft ? 'bg-[#FCFAF8]/80 border-y border-[#2D2926]/10' : 
          'bg-[#FBFBFD]/80 border-b border-slate-200/50'
      }`}>
        <div className="max-w-[1200px] mx-auto px-6 overflow-hidden">
          <SectionLabel>Categories</SectionLabel>
          <div className={`flex overflow-x-auto no-scrollbar py-6 scroll-smooth gap-4 ${isLoft ? 'justify-center' : ''}`}>
            {categoryList.map((catObj) => {
              const cat = catObj.name;
              const icon = catObj.icon || getCatIcon(cat);
              const isActive = activeCategory === cat;
              return (
                <button 
                  key={cat} 
                  onClick={() => onCategorySelect(cat)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[15px] font-black tracking-tight whitespace-nowrap transition-all relative uppercase ${
                      isActive 
                      ? 'text-[#FF6B00]' 
                      : (isMidnight ? 'text-white/30 hover:text-white' : 'text-[#86868B] hover:text-[#1D1D1F]')
                  }`}
                >
                  <i className={`fa-solid ${icon} text-[13px] transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}></i>
                  <span>{cat === 'all' ? (isLoft ? 'Full Menu' : 'All') : cat}</span>
                  {isActive && <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#FF6B00] rounded-full"></div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MENU LIST GRID */}
      <div className="max-w-[1200px] mx-auto px-6">
        <Reveal delay={200}>
          <div className={`grid ${
              layoutMode === 'compact' ? 'grid-cols-2 gap-4' : 
              layoutMode === 'minimal' ? 'grid-cols-1 gap-1' : 
              isLoft ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-1 max-w-4xl mx-auto gap-8' : 
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'
          }`}>
            {searchResults.map((item) => (
              <button 
                key={item.id} 
                onClick={() => onItemSelect(item)}
                className={`w-full group flex transition-all duration-500 text-left overflow-hidden ${
                    layoutMode === 'minimal' ? 'bg-white p-4 items-center justify-between border-b border-slate-100/50' :
                    layoutMode === 'compact' ? 'bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex-col hover:shadow-md' :
                    isMidnight ? 'bg-white/5 p-4 rounded-2xl border border-white/5 flex-col hover:bg-white/10 hover:border-indigo-500/30' : 
                    isLoft ? 'bg-transparent border-b border-[#2D2926]/10 p-0 rounded-none flex-row items-center py-10 hover:bg-black/[0.02]' : 
                    'bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex-col hover:shadow-xl'
                }`}
              >
                {/* MINIMAL LAYOUT DESIGN */}
                {layoutMode === 'minimal' ? (
                   <>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[16px] font-bold text-slate-900 leading-tight truncate uppercase tracking-tight">{item.name}</h4>
                        <p className="text-[12px] font-medium text-slate-400 line-clamp-1 truncate">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-[17px] font-black text-slate-900 tracking-tighter">₱{item.price.toLocaleString()}</span>
                      <i className="fa-solid fa-chevron-right text-[10px] text-slate-200"></i>
                    </div>
                   </>
                ) : (
                  <>
                    <div className={`relative overflow-hidden shrink-0 ${
                        layoutMode === 'compact' ? 'aspect-square w-full mb-3 rounded-xl' :
                        isMidnight ? 'aspect-[4/3] w-full mb-6 rounded-xl' : 
                        isLoft ? 'w-32 md:w-56 aspect-square rounded-none' : 
                        'aspect-[4/3] w-full mb-6 rounded-xl'
                    }`}>
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105" />
                      {item.is_popular && !isLoft && (
                          <div className={`absolute top-4 left-4 px-3 py-1 text-[8px] font-black uppercase tracking-widest ${
                              isMidnight ? 'bg-indigo-600 text-white' : 'bg-[#FF6B00] text-white shadow-lg'
                          }`}>Popular</div>
                      )}
                    </div>
                    
                    <div className={`flex-1 flex flex-col ${layoutMode === 'compact' ? 'px-1' : isLoft ? 'pl-8 md:pl-12 pr-6' : 'px-2'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                            isMidnight ? 'text-indigo-400' : 'text-[#86868B]'
                        }`}>{item.cat_name}</p>
                        {layoutMode === 'detailed' && (
                          <div className="flex items-center gap-3">
                             <span className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase">
                               <i className="fa-solid fa-clock opacity-40"></i> {item.serving_time}
                             </span>
                          </div>
                        )}
                      </div>
                      
                      <h4 className={`font-black tracking-tight leading-tight ${
                          layoutMode === 'compact' ? 'text-[15px] text-[#1D1D1F] normal-case mb-1' :
                          isMidnight ? 'text-2xl text-white normal-case mb-2' : 
                          isLoft ? 'text-3xl md:text-4xl normal-case mb-2' : 
                          'text-[22px] text-[#1D1D1F] normal-case mb-2'
                      }`}>{item.name}</h4>
                      
                      {layoutMode === 'detailed' && (
                        <p className={`text-[14px] font-bold leading-relaxed line-clamp-2 mb-6 ${
                            isMidnight ? 'text-white/50' : 'text-[#86868B]'
                        }`}>{item.description}</p>
                      )}
                      
                      <div className={`flex items-center justify-between ${
                          layoutMode === 'compact' ? 'pt-2 mt-auto border-t border-slate-50' :
                          isMidnight ? 'pt-6 mt-auto border-t border-white/5' : 
                          isLoft ? 'pt-6 mt-auto border-none' : 
                          'pt-6 mt-auto border-t border-slate-50'
                      }`}>
                        <div className="flex flex-col">
                            {layoutMode === 'detailed' && (
                              <span className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">
                                {item.has_variations ? 'Starts at' : 'Price'}
                              </span>
                            )}
                            <span className={`font-black tracking-tighter ${
                                layoutMode === 'compact' ? 'text-base text-[#FF6B00]' :
                                isMidnight ? 'text-white text-[24px]' : 
                                isLoft ? 'text-[28px] text-[#2D2926]' : 
                                'text-[24px] text-[#1D1D1F]'
                            }`}>₱{item.price.toLocaleString()}</span>
                        </div>
                        {layoutMode === 'detailed' && (
                          <div className={`w-12 h-12 flex items-center justify-center transition-all ${
                              isMidnight ? 'bg-indigo-600 text-white rounded-xl' : 
                              isLoft ? 'border border-[#2D2926] text-[#2D2926] rounded-none group-hover:bg-[#2D2926] group-hover:text-white' : 
                              'bg-[#F5F5F7] text-[#1D1D1F] rounded-full'
                          }`}>
                              <i className={`fa-solid ${item.has_variations ? 'fa-arrow-right-long' : 'fa-plus'} text-xs`}></i>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      {/* APPLE STYLE SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center font-jakarta animate-fade-in">
          <div onClick={() => setIsSettingsOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
          <div className={`relative bg-white w-full max-w-lg rounded-t-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up pb-12 transition-colors ${isMidnight ? 'bg-[#1C1C1E]' : 'bg-white'}`}>
            <div className={`w-12 h-1 rounded-full mx-auto my-5 shrink-0 ${isMidnight ? 'bg-white/10' : 'bg-slate-200'}`} />
            
            <header className="px-10 pb-4 flex justify-between items-center">
                <div>
                    <h3 className={`text-[22px] font-black tracking-tighter uppercase leading-none ${isMidnight ? 'text-white' : 'text-slate-900'}`}>Menu Filters</h3>
                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 ${isMidnight ? 'text-white/40' : 'text-slate-400'}`}>Customize your view</p>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className={`w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all shadow-sm border border-slate-100 shrink-0`}><i className="fa-solid fa-xmark"></i></button>
            </header>

            {/* SEGMENTED CONTROL TABS */}
            <div className="px-8 mt-6">
              <div className={`p-1 rounded-[1.5rem] flex border shadow-inner ${isMidnight ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                <button 
                  onClick={() => setSettingsTab('sort')}
                  className={`flex-1 py-3.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${settingsTab === 'sort' ? (isMidnight ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-400'}`}
                >
                  <i className="fa-solid fa-sort-amount-down mr-2 opacity-50"></i>
                  Sort
                </button>
                <button 
                  onClick={() => setSettingsTab('layout')}
                  className={`flex-1 py-3.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${settingsTab === 'layout' ? (isMidnight ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-400'}`}
                >
                  <i className="fa-solid fa-grip mr-2 opacity-50"></i>
                  Layout
                </button>
              </div>
            </div>

            {/* MODAL CONTENT GRID */}
            <div className="px-8 pb-4 mt-8">
                {settingsTab === 'sort' ? (
                  <div className="grid grid-cols-2 gap-3 animate-fade-in">
                      {SORT_OPTIONS.map((opt) => {
                          const isActive = sortType === opt.id;
                          return (
                            <button 
                                key={opt.id}
                                onClick={() => { setSortType(opt.id); setIsSettingsOpen(false); }}
                                className={`flex items-center gap-4 px-6 py-5 rounded-[1.8rem] border transition-all group ${
                                    isActive 
                                    ? 'bg-[#FF6B00]/10 border-[#FF6B00]/20 text-[#FF6B00] shadow-sm'
                                    : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200'
                                }`}
                            >
                                <i className={`fa-solid ${opt.icon} text-base transition-transform group-hover:scale-110 ${isActive ? 'text-[#FF6B00]' : 'opacity-40'}`}></i>
                                <span className={`text-[11px] font-black uppercase tracking-tight truncate ${isActive ? 'text-[#FF6B00]' : 'text-slate-400'}`}>{opt.label}</span>
                            </button>
                          );
                      })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 animate-fade-in bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100">
                      {LAYOUT_OPTIONS.map((opt, idx) => {
                          const isActive = layoutMode === opt.id;
                          return (
                            <button 
                                key={opt.id}
                                onClick={() => { setLayoutMode(opt.id); setIsSettingsOpen(false); }}
                                className={`flex items-center justify-between px-8 py-6 transition-all group border-none bg-transparent ${
                                    idx !== LAYOUT_OPTIONS.length - 1 ? 'border-b border-slate-100/50' : ''
                                } ${isActive ? 'text-[#FF6B00]' : 'text-slate-500 hover:bg-white/50'}`}
                            >
                                <div className="flex items-center gap-5">
                                  <i className={`fa-solid ${opt.icon} text-lg transition-transform group-hover:scale-110 ${isActive ? 'text-[#FF6B00]' : 'text-slate-300'}`}></i>
                                  <span className={`text-[14px] font-black uppercase tracking-widest ${isActive ? 'text-[#FF6B00]' : 'text-slate-900'}`}>{opt.label}</span>
                                </div>
                                {isActive && <i className="fa-solid fa-check text-xs text-[#FF6B00]"></i>}
                            </button>
                          );
                      })}
                  </div>
                )}
            </div>

            <div className="px-8 pt-8">
                <button onClick={() => { setSortType('default'); setLayoutMode('detailed'); setIsSettingsOpen(false); }} className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all ${isMidnight ? 'text-white/20 hover:text-white' : 'text-slate-200 hover:text-slate-900'}`}>Restore Defaults</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MenuView;
