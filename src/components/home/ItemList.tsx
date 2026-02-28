import React from 'react';
import { MenuItem } from '../../../types';
import { Plus } from 'lucide-react';

interface ItemListProps {
  items: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  getPriceDisplay: (item: MenuItem) => string;
  Reveal: React.FC<{ children: React.ReactNode; delay?: number; noWait?: boolean }>;
  layout?: 'default' | 'compact' | 'minimal';
}

const ItemList: React.FC<ItemListProps> = ({ items, onItemSelect, getPriceDisplay, Reveal, layout = 'default' }) => {
  // Grid columns can be adjusted based on layout if needed, but the current responsive grid is good.
  const gridClass = layout === 'compact' 
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className={gridClass}>
        {items.map((item, idx) => (
          <Reveal key={item.id} noWait={idx < 4}>
            <button 
              onClick={() => onItemSelect(item)}
              className="group w-full bg-white rounded-2xl border border-slate-100 overflow-hidden text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full relative"
            >
              {/* Image Container */}
              <div className="aspect-[4/3] w-full overflow-hidden relative bg-slate-100">
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Price Tag */}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-bold text-slate-900 shadow-sm border border-slate-100/50 z-10">
                    {getPriceDisplay(item)}
                </div>

                {/* Popular Badge */}
                {item.is_popular && (
                  <div className="absolute top-3 left-3 bg-amber-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm z-10">
                    Popular
                  </div>
                )}

                {/* Quick Add Overlay Icon */}
                <div className="absolute bottom-4 right-4 bg-white text-slate-900 p-2 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
                  <Plus size={20} />
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-grow">
                <div className="mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                    {item.cat_name}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 group-hover:text-orange-600 transition-colors">
                  {item.name}
                </h3>
                
                <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-4 leading-relaxed flex-grow">
                  {item.description}
                </p>
                
                {/* Ingredients / Tags */}
                {item.ingredients && (item.ingredients as any).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(item.ingredients as any).slice(0, 3).map((ing: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[10px] font-semibold uppercase tracking-wide border border-slate-100">
                        {typeof ing === 'string' ? ing : (ing.label || ing.name)}
                      </span>
                    ))}
                    {(item.ingredients as any).length > 3 && (
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[10px] font-semibold uppercase tracking-wide border border-slate-100">
                        +{(item.ingredients as any).length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer Meta */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                    <div className="flex items-center gap-4 text-slate-400">
                        {(item.serving_time || item.pax) && (
                          <>
                            {item.serving_time && (
                              <div className="flex items-center gap-1.5" title="Serving Time">
                                <i className="fa-regular fa-clock text-xs"></i>
                                <span className="text-xs font-semibold">{item.serving_time}</span>
                              </div>
                            )}
                            {item.pax && (
                              <div className="flex items-center gap-1.5" title="Serving Size">
                                <i className="fa-solid fa-user-group text-xs"></i>
                                <span className="text-xs font-semibold">{item.pax}</span>
                              </div>
                            )}
                          </>
                        )}
                    </div>
                </div>
              </div>
            </button>
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default ItemList;
