export interface Category {
  id: number | string;
  name: string;
  icon?: string;
}

export interface Variation {
  name: string;
  options: string[];
}

export interface ItemOption {
  id?: string;
  name: string;
  price: number;
}

export interface ItemOptionGroup {
  id?: string;
  name: string;
  required: boolean;
  min_choices: number;
  max_choices: number;
  options: ItemOption[];
}

export interface Theme {
  primary_color: string;
  secondary_color: string;
  font_family: string;
  template?: 'classic' | 'midnight' | 'loft' | 'premium' | 'modern';
  logo_url?: string;
}

export interface MenuItem {
  id: number | string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  category_id: number | string | null;
  cat_name: string;
  is_popular: boolean;
  is_available: boolean;
  pay_as_you_order?: boolean;
  ingredients: any[];
  pax: string;
  serving_time: string;
  variations?: Variation[];
  parent_id?: number | string | null;
  has_variations?: boolean;
  has_options?: boolean;
  option_groups?: ItemOptionGroup[];
}

export type OrderMode = 'Dine-in' | 'Takeout' | 'Delivery';

export type ViewState = 'landing' | 'menu' | 'cart' | 'orders' | 'favorites' | 'feedback' | 'feedback-data' | 'privacy' | 'terms' | 'admin' | 'create-menu' | 'payment' | 'qr-verify' | 'about' | 'test-supabase' | 'super-admin' | 'accept-invite' | 'ai-assistant' | 'admin-faq' | 'demo' | 'articles' | 'article' | 'verification-barcode';

export interface CartItem extends MenuItem {
  quantity: number;
  customInstructions?: string;
  orderTo?: string;
  orderMode: OrderMode;
  selectedVariations?: Record<string, string>;
  selectedOptions?: Record<string, string[]>; // groupId -> optionNames
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
  itemId: number | string;
  itemName: string;
  categoryName: string;
  quantity: number;
  tableNumber?: string;
  paymentStatus: 'Paid' | 'Unpaid';
  orderStatus: 'Preparing' | 'Serving' | 'Served';
  pay_as_you_order?: boolean;
  verification_code?: string;
}