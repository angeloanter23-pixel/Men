
export interface Category {
  id: number;
  name: string;
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url: string;
  category_id: number;
  cat_name: string;
  is_popular: boolean;
  ingredients: string[];
  pax: string;
  serving_time: string;
}

export type OrderMode = 'Dine-in' | 'Takeout' | 'Delivery';

export interface CartItem extends MenuItem {
  quantity: number;
  customInstructions?: string;
  orderTo?: string;
  orderMode: OrderMode;
}

export interface Feedback {
  id: string;
  name: string;
  scores: Record<string, number>;
  note: string;
  date: string;
}

export interface SalesRecord {
  timestamp: string;
  amount: number;
  itemId: number;
  itemName: string;
  categoryName: string;
  quantity: number;
}
