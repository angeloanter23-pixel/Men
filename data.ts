import { Category, MenuItem } from './types';

export const categories: Category[] = [
  { id: 1, name: 'Main Course' },
  { id: 2, name: 'Breakfast' },
  { id: 3, name: 'Beverages' },
  { id: 4, name: 'Desserts' },
  { id: 5, name: 'Snacks' }
];

export const menuItems: MenuItem[] = [
  {
    id: 1,
    name: 'Classic Chicken Adobo',
    price: 250,
    description: 'Tender chicken simmered in a rich blend of soy sauce, vinegar, garlic, and peppercorns. A Filipino household staple perfected for you.',
    image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&h=800&auto=format&fit=crop',
    category_id: 1,
    cat_name: 'Main Course',
    is_popular: true,
    is_available: true,
    ingredients: ['Chicken Thighs', 'Soy Sauce', 'Cane Vinegar', 'Garlic', 'Bay Leaves', 'Peppercorns'],
    pax: '1-2 Persons',
    serving_time: '15-20 mins'
  },
  {
    id: 7,
    name: 'French Fries',
    price: 120,
    description: 'Golden, crispy premium potatoes seasoned with your choice of savory house-blended flavors. Double-fried for maximum crunch.',
    image_url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?q=80&w=800&h=800&auto=format&fit=crop',
    category_id: 5,
    cat_name: 'Snacks',
    is_popular: true,
    is_available: true,
    ingredients: ['Premium Potatoes', 'Sea Salt', 'Vegetable Oil'],
    pax: '1 Person',
    serving_time: '5-8 mins',
    variations: [
      { name: 'Size', options: ['Regular', 'Large', 'Bucket'] },
      { name: 'Flavoring', options: ['Classic Salt', 'Cheese', 'Spicy BBQ', 'Sour Cream'] }
    ]
  },
  {
    id: 2,
    name: 'Wagyu Beef Burger',
    price: 450,
    description: 'Juicy Wagyu patty, aged cheddar, caramelized onions, and our secret truffle aioli on a toasted brioche bun.',
    image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=800&h=800&auto=format&fit=crop',
    category_id: 5,
    cat_name: 'Snacks',
    is_popular: true,
    is_available: true,
    ingredients: ['Wagyu Beef', 'Brioche Bun', 'Truffle Aioli', 'Cheddar Cheese', 'Onions'],
    pax: '1 Person',
    serving_time: '10-15 mins',
    variations: [
      { name: 'Doneness', options: ['Medium Rare', 'Medium', 'Well Done'] },
      { name: 'Cheese', options: ['Cheddar', 'Swiss', 'No Cheese'] }
    ]
  },
  {
    id: 3,
    name: 'Spanish Latte',
    price: 180,
    description: 'Double shot of Arabica beans with sweetened condensed milk and creamy steamed milk for a silky finish.',
    image_url: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=800&h=800&auto=format&fit=crop',
    category_id: 3,
    cat_name: 'Beverages',
    is_popular: true,
    is_available: true,
    ingredients: ['Arabica Coffee', 'Condensed Milk', 'Fresh Milk', 'Cinnamon'],
    pax: '1 Person',
    serving_time: '5 mins',
    variations: [
      { name: 'Temperature', options: ['Hot', 'Iced'] },
      { name: 'Sweetness', options: ['Regular', 'Less Sugar', 'No Sugar'] }
    ]
  },
  {
    id: 4,
    name: 'Tapsilog Special',
    price: 220,
    description: 'Cured beef tapa, garlic fried rice, and a sunny-side-up egg. Served with spicy vinegar dip.',
    image_url: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?q=80&w=800&h=800&auto=format&fit=crop',
    category_id: 2,
    cat_name: 'Breakfast',
    is_popular: false,
    is_available: true,
    ingredients: ['Beef Tapa', 'Garlic Rice', 'Fresh Egg', 'Vinegar'],
    pax: '1 Person',
    serving_time: '10 mins',
    variations: [
        { name: 'Egg Style', options: ['Sunny Side Up', 'Scrambled', 'Boiled'] }
    ]
  },
  {
    id: 5,
    name: 'Mango Dessert Slice',
    price: 320,
    description: 'Layered meringue and chocolate mousse with fresh mangoes and premium whipped cream.',
    image_url: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=800&h=800&auto=format&fit=crop',
    category_id: 4,
    cat_name: 'Desserts',
    is_popular: true,
    is_available: true,
    ingredients: ['Mango', 'Meringue', 'Chocolate Mousse', 'Cashews'],
    pax: '1 Person',
    serving_time: 'Immediate'
  },
  {
    id: 6,
    name: 'Pork Sinigang',
    price: 380,
    description: 'Sour soup with pork belly and local vegetables. Made with real tamarind for that authentic kick.',
    image_url: 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?q=80&w=800&h=800&auto=format&fit=crop',
    category_id: 1,
    cat_name: 'Main Course',
    is_popular: false,
    is_available: true,
    ingredients: ['Pork Belly', 'Tamarind', 'Radish', 'Kangkong', 'Tomatoes'],
    pax: '2-3 Persons',
    serving_time: '20-25 mins'
  }
];