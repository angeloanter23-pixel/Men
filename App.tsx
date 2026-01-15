
import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, CartItem, Category, Feedback, SalesRecord, ViewState } from './types';
import { menuItems as defaultMenuItems, categories as defaultCategories } from './data';

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
import LandingView from './views/LandingView';
import PaymentView from './views/PaymentView';
import CreateMenuView from './views/CreateMenuView';
import TestSupabaseView from './views/TestSupabaseView';
import SuperAdminView from './views/SuperAdminView';

export interface OrderInstance extends CartItem {
  orderId: string;
  status: 'Pending' | 'Cooking' | 'Ready' | 'Served';
  timestamp: Date;
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [salesHistory, setSalesHistory] = useState<SalesRecord[]>([]);
  const [adminCreds, setAdminCreds] = useState({ email: 'admin@foodie.com', password: 'password123' });
  const [logo, setLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderInstance[]>([]);
  const [pendingSingleItem, setPendingSingleItem] = useState<CartItem | null>(null);

  useEffect(() => {
    // Load data from localStorage or fallback to data.ts constants
    const savedMenu = localStorage.getItem('foodie_menu_items');
    const savedCats = localStorage.getItem('foodie_categories');
    const savedFeedbacks = localStorage.getItem('foodie_feedbacks');
    const savedSales = localStorage.getItem('foodie_sales_history');
    const savedAdmin = localStorage.getItem('foodie_admin_creds');
    const savedLogo = localStorage.getItem('foodie_business_logo');

    if (savedMenu && savedCats) {
      setMenuItems(JSON.parse(savedMenu));
      setCategories(JSON.parse(savedCats));
    } else {
      setMenuItems(defaultMenuItems);
      setCategories(defaultCategories);
    }

    if (savedFeedbacks) {
      setFeedbacks(JSON.parse(savedFeedbacks));
    } else {
      setFeedbacks([
        {
          id: 'fb-1',
          name: 'James Wilson',
          scores: { Cleanliness: 5, "Food Quality": 5, Speed: 4, Service: 5, Value: 4, Experience: 5 },
          note: "Offline mode works perfectly! Great UX.",
          date: new Date().toISOString().split('T')[0]
        }
      ]);
    }

    if (savedSales) {
      setSalesHistory(JSON.parse(savedSales));
    }

    if (savedAdmin) {
      setAdminCreds(JSON.parse(savedAdmin));
    }

    if (savedLogo) {
      setLogo(savedLogo);
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('foodie_menu_items', JSON.stringify(menuItems));
      localStorage.setItem('foodie_categories', JSON.stringify(categories));
      localStorage.setItem('foodie_feedbacks', JSON.stringify(feedbacks));
      localStorage.setItem('foodie_sales_history', JSON.stringify(salesHistory));
      localStorage.setItem('foodie_admin_creds', JSON.stringify(adminCreds));
      if (logo) localStorage.setItem('foodie_business_logo', logo);
    }
  }, [menuItems, categories, feedbacks, salesHistory, adminCreds, logo, isLoading]);

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
      quantity: item.quantity,
      branch: 'Main' 
    }));
    
    setOrders(prev => [...prev, ...newOrders]);
    setSalesHistory(prev => [...prev, ...newSales]);
    
    if (pendingSingleItem) setPendingSingleItem(null); else setCart([]);
    setCurrentView('orders');
    setSelectedItem(null);
  };

  const handleSendToKitchenDirect = (item: CartItem) => {
    setPendingSingleItem({ ...item });
    setCurrentView('qr-verify' as ViewState);
  };

  const handleFeedbackSubmit = (feedback: Feedback) => {
    setFeedbacks(prev => [feedback, ...prev]);
    setOrders([]);
    setCurrentView('feedback-data' as ViewState);
    alert('Thank you for your feedback!');
  };

  const handleImportConfig = (config: any) => {
    console.log("App: Importing configuration", config);
    if (config.menu?.categories) setCategories(config.menu.categories);
    if (config.menu?.items) setMenuItems(config.menu.items);
    if (config.business?.name) {
       localStorage.setItem('foodie_business_name', config.business.name);
    }
    if (config.business?.logo) {
      setLogo(config.business.logo);
      localStorage.setItem('foodie_business_logo', config.business.logo);
    }
    alert('Configuration Imported Successfully!');
    setCurrentView('menu');
  };

  const renderView = () => {
    if (isLoading) return <div className="flex items-center justify-center min-h-[80vh] font-black text-orange-600 animate-pulse uppercase tracking-widest text-xs">Initialising...</div>;

    switch (currentView) {
      case 'landing': return (
        <LandingView 
          onStart={() => setCurrentView('menu')} 
          onCreateMenu={() => setCurrentView('create-menu' as ViewState)} 
          onImportMenu={handleImportConfig}
        />
      );
      case 'create-menu': return (
        <CreateMenuView 
          onCancel={() => setCurrentView('landing')} 
          onComplete={(config) => {
            handleImportConfig(config);
            setCurrentView('admin');
          }}
        />
      );
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
          onRemove={(idx) => setCart(p => p.filter((_, i) => i !== idx))} onCheckout={() => setCurrentView('qr-verify' as ViewState)}
          onGoBack={() => setCurrentView('menu')}
        />
      );
      case 'payment': return (
        <PaymentView 
          total={orders.reduce((sum, o) => sum + (o.price * o.quantity), 0)}
          onClose={() => setCurrentView('orders')}
          onSuccess={() => {
            alert("Payment Successful! Your digital receipt has been sent.");
            setCurrentView('feedback');
          }}
        />
      );
      case 'qr-verify': return <QRVerifyView onVerify={finalizeOrder} onCancel={() => { setPendingSingleItem(null); setCurrentView(cart.length > 0 ? 'cart' : 'menu'); }} />;
      case 'orders': return <OrdersView orders={orders} onPayNow={() => setCurrentView('payment' as ViewState)} onGoToMenu={() => setCurrentView('menu')} />;
      case 'feedback': return <FeedbackForm onSubmit={handleFeedbackSubmit} onCancel={() => setCurrentView('menu')} />;
      case 'feedback-data': return <FeedbackDataView feedbacks={feedbacks} onAddFeedback={() => setCurrentView('feedback')} />;
      case 'test-supabase': return <TestSupabaseView />;
      case 'super-admin': return <SuperAdminView onBack={() => setCurrentView('menu')} />;
      case 'admin': return (
        <AdminView 
          menuItems={menuItems} setMenuItems={setMenuItems} 
          categories={categories} setCategories={setCategories} 
          feedbacks={feedbacks} setFeedbacks={setFeedbacks}
          salesHistory={salesHistory} setSalesHistory={setSalesHistory}
          adminCreds={adminCreds} setAdminCreds={setAdminCreds}
          onExit={() => setCurrentView('menu')}
          onLogoUpdate={setLogo}
        />
      );
      case 'privacy': return <LegalView title="Privacy Policy" />;
      case 'terms': return <LegalView title="Terms & Agreement" />;
      default: return null;
    }
  };

  const showNavbar = !['admin', 'payment', 'landing', 'create-menu', 'super-admin'].includes(currentView);

  return (
    <div className="min-h-screen pb-24 max-w-xl mx-auto bg-white shadow-2xl relative overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={setCurrentView} currentView={currentView} />
      <DetailPanel item={selectedItem} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} onAddToCart={(item) => setCart(p => [...p, item])} onSendToKitchen={handleSendToKitchenDirect} />
      {showNavbar && <Navbar logo={logo} onMenuClick={() => setIsSidebarOpen(true)} onCartClick={() => setCurrentView('cart')} onLogoClick={() => setCurrentView('menu')} onImport={handleImportConfig} currentView={currentView} cartCount={cart.reduce((s, i) => s + i.quantity, 0)} />}
      <main className={showNavbar ? "min-h-[80vh]" : ""}>{renderView()}</main>
      
      {!['landing', 'admin', 'payment', 'create-menu', 'super-admin'].includes(currentView) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around py-4 max-w-xl mx-auto z-40">
          {[
            { v: 'menu', i: 'fa-house', l: 'Menu' },
            { v: 'group', i: 'fa-users', l: 'Group' },
            { v: 'favorites', i: 'fa-heart', l: 'Favorites' },
            { v: 'orders', i: 'fa-receipt', l: 'Orders' }
          ].map(btn => (
            <button key={btn.v} onClick={() => setCurrentView(btn.v as ViewState)} className={`flex flex-col items-center gap-1 transition ${currentView === btn.v ? 'text-orange-500' : 'text-slate-300 hover:text-orange-300'}`}>
              <i className={`fa-solid ${btn.i} text-xl`}></i>
              <span className="text-[10px] font-black uppercase tracking-widest">{btn.l}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
