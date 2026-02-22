import React from 'react';
import { MenuItem } from '../../types';
import MinimalItem from './MinimalItem';
import CompactItem from './CompactItem';
import DetailedItem from './DetailedItem';

interface ItemListProps {
  items: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  getPriceDisplay: (item: MenuItem) => string;
  Reveal: React.FC<{ children: React.ReactNode; delay?: number; noWait?: boolean }>;
  layout?: 'default' | 'compact' | 'minimal';
}

const ItemList: React.FC<ItemListProps> = ({ items, onItemSelect, getPriceDisplay, Reveal, layout = 'default' }) => {
  return (
    <div className="max-w-2xl mx-auto px-3">
      <div className={
        layout === 'default' ? "flex flex-col gap-6" : 
        layout === 'compact' ? "grid grid-cols-2 gap-3" : 
        "flex flex-col gap-4"
      }>
        {items.map((item, idx) => (
          <Reveal key={item.id} noWait={idx < 4}>
            {layout === 'minimal' && (
              <MinimalItem item={item} onItemSelect={onItemSelect} getPriceDisplay={getPriceDisplay} />
            )}
            {layout === 'compact' && (
              <CompactItem item={item} onItemSelect={onItemSelect} getPriceDisplay={getPriceDisplay} />
            )}
            {layout === 'default' && (
              <DetailedItem item={item} onItemSelect={onItemSelect} getPriceDisplay={getPriceDisplay} />
            )}
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default ItemList;
