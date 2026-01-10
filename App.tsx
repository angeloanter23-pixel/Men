
import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, CartItem, Category, Feedback, SalesRecord } from './types';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DetailPanel from './components/DetailPanel';
import FeedbackForm from './components/FeedbackForm';

// Views
import MenuView from './views/MenuView';
import CartView from './views/CartView';
import OrdersView from './views/OrdersView';
import QRVerifyView from './views/QRVerifyView';
import GroupView from './views/GroupView';
import LegalView from './views/LegalView';
import AdminView from './views/AdminView';
import FeedbackDataView from './views/FeedbackDataView';

export type ViewState = 'menu' | 'group' | 'favorites' | 'profile' | 'privacy' | 'terms' | 'cart' | 'orders' | 'qr-verify' | 'admin' | 'feedback' | 'feedback-data';

export interface OrderInstance extends CartItem {
  orderId: string;
  status: 'Pending' | 'Cooking' | 'Ready' | 'Served';
  timestamp: Date;
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('menu');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [salesHistory, setSalesHistory] = useState<SalesRecord[]>([]);
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderInstance[]>([]);
  const [pendingSingleItem, setPendingSingleItem] = useState<CartItem | null>(null);

  useEffect(() => {
    const savedMenu = localStorage.getItem('foodie_menu_items');
    const savedCats = localStorage.getItem('foodie_categories');
    const savedFeedbacks = localStorage.getItem('foodie_feedbacks');
    const savedSales = localStorage.getItem('foodie_sales_history');
    const savedAdmin = localStorage.getItem('foodie_admin_creds');

    if (savedMenu && savedCats) {
      setMenuItems(JSON.parse(savedMenu));
      setCategories(JSON.parse(savedCats));
    } else {
      fetch('./data/menu.json')
        .then(res => res.json())
        .then(data => {
          setMenuItems(data.menuItems);
          setCategories(data.categories);
        })
        .catch(err => console.error("Failed to load menu", err));
    }

    if (savedFeedbacks) {
      setFeedbacks(JSON.parse(savedFeedbacks));
    } else {
      fetch('./data/feedback.json')
        .then(res => res.json())
        .then(data => setFeedbacks(data))
        .catch(err => console.error("Failed to load feedbacks", err));
    }

    if (savedSales) {
      setSalesHistory(JSON.parse(savedSales));
    }

    if (savedAdmin) {
      setAdminCreds(JSON.parse(savedAdmin));
    } else {
      fetch('./data/admin.json')
        .then(res => res.json())
        .then(data => setAdminCreds(data))
        .catch(err => console.error("Failed to load admin", err));
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (menuItems.length > 0) localStorage.setItem('foodie_menu_items', JSON.stringify(menuItems));
    if (categories.length > 0) localStorage.setItem('foodie_categories', JSON.stringify(categories));
    if (feedbacks.length > 0) localStorage.setItem('foodie_feedbacks', JSON.stringify(feedbacks));
    if (salesHistory.length > 0) localStorage.setItem('foodie_sales_history', JSON.stringify(salesHistory));
    if (adminCreds.email) localStorage.setItem('foodie_admin_creds', JSON.stringify(adminCreds));
  }, [menuItems, categories, feedbacks, salesHistory, adminCreds]);

  useEffect(() => {
    if (orders.length === 0) return;
    const interval = setInterval(() => {
      setOrders(prev => prev.map(o => {
        if (o.status === 'Pending') return { ...o, status: 'Cooking' };
        if (o.status === 'Cooking') return { ...o, status: 'Ready' };
        if (o.status === 'Ready') return { ...o, status: 'Served' };
        return o;
      }));
    }, 12000);
    return () => clearInterval(interval);
  }, [orders.length]);

  const popularItems = useMemo(() => menuItems.filter(item => item.is_popular), [menuItems]);
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.cat_name === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, menuItems]);

  const finalizeOrder = () => {
    const itemsToProcess = pendingSingleItem ? [pendingSingleItem] : cart;
    if (itemsToProcess.length === 0) { setCurrentView('menu'); return; }

    const timestamp = new Date();
    const newOrders: OrderInstance[] = itemsToProcess.map((item, idx) => ({
      ...item,
      orderId: `ORD-${timestamp.getTime()}-${idx}`,
      status: 'Pending',
      timestamp
    }));
    
    const newSales: SalesRecord[] = itemsToProcess.map(item => ({
      timestamp: timestamp.toISOString(),
      amount: item.price * item.quantity,
      itemId: item.id,
      itemName: item.name,
      categoryName: item.cat_name,
      quantity: item.quantity
    }));
    
    setOrders(prev => [...prev, ...newOrders]);
    setSalesHistory(prev => [...prev, ...newSales]);
    
    if (pendingSingleItem) setPendingSingleItem(null); else setCart([]);
    setCurrentView('orders');
    setSelectedItem(null);
  };

  const handleSendToKitchenDirect = (item: CartItem) => {
    setPendingSingleItem({ ...item });
    setCurrentView('qr-verify');
  };

  const handleFeedbackSubmit = (feedback: Feedback) => {
    setFeedbacks(prev => [feedback, ...prev]);
    setOrders([]);
    setCurrentView('feedback-data');
    alert('Thank you for your feedback!');
  };

  const renderView = () => {
    if (isLoading) return <div className="flex items-center justify-center min-h-[80vh] font-black text-orange-600 animate-pulse uppercase tracking-widest text-xs">Initialising...</div>;

    switch (currentView) {
      case 'menu': return (
        <MenuView 
          popularItems={popularItems} categories={categories} filteredItems={filteredItems} 
          activeCategory={activeCategory} searchQuery={searchQuery}
          onSearchChange={setSearchQuery} onCategorySelect={setActiveCategory} onItemSelect={setSelectedItem}
        />
      );
      case 'cart': return (
        <CartView 
          cart={cart} onUpdateQuantity={(idx, d) => setCart(p => p.map((it, i) => i === idx ? {...it, quantity: Math.max(1, it.quantity + d)} : it))}
          onRemove={(idx) => setCart(p => p.filter((_, i) => i !== idx))} onCheckout={() => setCurrentView('qr-verify')}
          onGoBack={() => setCurrentView('menu')}
        />
      );
      case 'qr-verify': return <QRVerifyView onVerify={finalizeOrder} onCancel={() => { setPendingSingleItem(null); setCurrentView(cart.length > 0 ? 'cart' : 'menu'); }} />;
      case 'orders': return <OrdersView orders={orders} onPayNow={() => setCurrentView('feedback')} onGoToMenu={() => setCurrentView('menu')} />;
      case 'feedback': return <FeedbackForm onSubmit={handleFeedbackSubmit} onCancel={() => setCurrentView('menu')} />;
      case 'feedback-data': return <FeedbackDataView feedbacks={feedbacks} onAddFeedback={() => setCurrentView('feedback')} />;
      case 'admin': return (
        <AdminView 
          menuItems={menuItems} setMenuItems={setMenuItems} 
          categories={categories} setCategories={setCategories} 
          feedbacks={feedbacks} setFeedbacks={setFeedbacks}
          salesHistory={salesHistory} setSalesHistory={setSalesHistory}
          adminCreds={adminCreds} setAdminCreds={setAdminCreds}
        />
      );
      case 'group': return <GroupView />;
      case 'privacy': return <LegalView title="Privacy Policy" />;
      case 'terms': return <LegalView title="Terms & Agreement" />;
      default: return null;
    }
  };

  const showNavbar = !['admin', 'feedback', 'feedback-data'].includes(currentView);

  return (
    <div className="min-h-screen pb-24 max-w-xl mx-auto bg-white shadow-2xl relative overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={setCurrentView} currentView={currentView} />
      <DetailPanel item={selectedItem} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} onAddToCart={(item) => setCart(p => [...p, item])} onSendToKitchen={handleSendToKitchenDirect} />
      {showNavbar && <Navbar onMenuClick={() => setIsSidebarOpen(true)} onCartClick={() => setCurrentView('cart')} onLogoClick={() => setCurrentView('menu')} currentView={currentView} cartCount={cart.reduce((s, i) => s + i.quantity, 0)} />}
      <main className={showNavbar ? "min-h-[80vh]" : ""}>{renderView()}</main>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around py-4 max-w-xl mx-auto z-40">
        {[
          { v: 'orders', i: 'fa-receipt', l: 'Orders' },
          { v: 'feedback', i: 'fa-comment-dots', l: 'Feedback' },
          { v: 'feedback-data', i: 'fa-database', l: 'Data' },
          { v: 'admin', i: 'fa-user-gear', l: 'Admin' }
        ].map(btn => (
          <button key={btn.v} onClick={() => setCurrentView(btn.v as ViewState)} className={`flex flex-col items-center gap-1 transition ${currentView === btn.v ? 'text-indigo-600' : 'text-slate-300 hover:text-indigo-300'}`}>
            <i className={`fa-solid ${btn.i} text-xl`}></i>
            <span className="text-[10px] font-black uppercase tracking-widest">{btn.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
