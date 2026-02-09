const defaultCategories = [
  { id: 1, name: 'Main Course' },
  { id: 2, name: 'Breakfast' },
  { id: 3, name: 'Beverages' },
  { id: 4, name: 'Desserts' },
  { id: 5, name: 'Snacks' }
];

const defaultMenuItems = [
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
    description: 'Crispy, golden-brown premium potatoes, double-fried for maximum crunch and seasoned to perfection.',
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800&h=800&auto=format&fit=crop',
    category_id: 5,
    cat_name: 'Snacks',
    is_popular: true,
    is_available: true,
    ingredients: ['Premium Potatoes', 'Vegetable Oil', 'Sea Salt'],
    pax: '1-2 Persons',
    serving_time: '8-10 mins',
    variations: [
      { name: 'Size', options: ['Regular', 'Large', 'XL'] },
      { name: 'Flavor', options: ['Plain Salted', 'Cheese', 'BBQ', 'Sour Cream'] }
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
    serving_time: '10-15 mins'
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
    serving_time: '5 mins'
  }
];

window.foodieData = {
    categories: defaultCategories,
    menuItems: defaultMenuItems
};