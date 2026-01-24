
export interface Category {
  id: number;
  name: string;
  icon?: string;
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url: string;
  category_id: number | null;
  cat_name: string;
  is_popular: boolean;
  ingredients: any[];
  pax: string;
  serving_time: string;
  branch_ids?: string[];
}

export type OrderMode = 'Dine-in' | 'Takeout' | 'Delivery';

// ViewState defines the possible views/routes in the application
export type ViewState = 'landing' | 'menu' | 'cart' | 'orders' | 'favorites' | 'feedback' | 'feedback-data' | 'privacy' | 'terms' | 'admin' | 'create-menu' | 'payment' | 'qr-verify' | 'group' | 'test-supabase' | 'super-admin';

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
  branch: string;
  tableNumber?: string;
  paymentStatus: 'Paid' | 'Unpaid';
  orderStatus: 'Preparing' | 'Serving' | 'Served';
}
