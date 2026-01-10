
import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, CartItem, Category } from './types';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DetailPanel from './components/DetailPanel';

// Views
import MenuView from './views/MenuView';
import CartView from './views/CartView';
import OrdersView from './views/OrdersView';
import QRVerifyView from './views/QRVerifyView';
import GroupView from './views/GroupView';
import LegalView from './views/LegalView';
import AdminView from './views/AdminView';

export type ViewState = 'menu' | 'group' | 'favorites' | 'profile' | 'privacy' | 'terms' | 'cart' | 'orders' | 'qr-verify' | 'admin';

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
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderInstance[]>([]);
  const [pendingSingleItem, setPendingSingleItem] = useState<CartItem | null>(null);

  // Load Menu Data with LocalStorage Persistence
  useEffect(() => {
    const savedMenu = localStorage.getItem('foodie_menu_items');
    const savedCats = localStorage.getItem('foodie_categories');

    if (savedMenu && savedCats) {
      setMenuItems(JSON.parse(savedMenu));
      setCategories(JSON.parse(savedCats));
      setIsLoading(false);
    } else {
      fetch('./data/menu.json')
        .then(res => res.json())
        .then(data => {
          setMenuItems(data.menuItems);
          setCategories(data.categories);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to load menu", err);
          setIsLoading(false);
        });
    }
  }, []);

  // Persist changes to LocalStorage
  useEffect(() => {
    if (menuItems.length > 0) {
      localStorage.setItem('foodie_menu_items', JSON.stringify(menuItems));
    }
    if (categories.length > 0) {
      localStorage.setItem('foodie_categories', JSON.stringify(categories));
    }
  }, [menuItems, categories]);

  // Simulated status progression
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

    const newOrders: OrderInstance[] = itemsToProcess.map((item, idx) => ({
      ...item,
      orderId: `ORD-${Date.now()}-${idx}`,
      status: 'Pending',
      timestamp: new Date()
    }));
    
    const friends = ['Sarah', 'Mark', 'Elena'];
    const friendOrder: OrderInstance = {
      ...menuItems[Math.floor(Math.random() * menuItems.length)],
      quantity: 1,
      orderMode: 'Dine-in',
      orderTo: friends[Math.floor(Math.random() * friends.length)],
      orderId: `ORD-F-${Date.now()}`,
      status: 'Pending',
      timestamp: new Date()
    };

    setOrders(prev => [...prev, ...newOrders, friendOrder]);
    if (pendingSingleItem) setPendingSingleItem(null); else setCart([]);
    setCurrentView('orders');
    setSelectedItem(null);
  };

  const handleSendToKitchenDirect = (item: CartItem) => {
    setPendingSingleItem({ ...item });
    setCurrentView('qr-verify');
  };

  const renderView = () => {
    if (isLoading) return <div className="flex items-center justify-center min-h-[80vh] font-black text-orange-600 animate-pulse uppercase tracking-widest text-xs">Loading Menu...</div>;

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
      case 'orders': return <OrdersView orders={orders} onPayNow={() => alert('Secure payment processed!')} onGoToMenu={() => setCurrentView('menu')} />;
      case 'group': return <GroupView />;
      case 'privacy': return <LegalView title="Privacy Policy" />;
      case 'terms': return <LegalView title="Terms & Agreement" />;
      case 'favorites': return <div className="p-6 text-center py-32 font-bold text-slate-300">No favorites yet.</div>;
      case 'profile': return <div className="p-6 text-center py-32 font-bold text-slate-300">Profile view under construction.</div>;
      case 'admin': return (
        <AdminView 
          menuItems={menuItems} 
          setMenuItems={setMenuItems} 
          categories={categories} 
          setCategories={setCategories} 
        />
      );
      default: return null;
    }
  };

  const showNavbar = currentView !== 'admin';

  return (
    <div className="min-h-screen pb-24 max-w-xl mx-auto bg-white shadow-2xl relative overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={setCurrentView} currentView={currentView} />
      <DetailPanel item={selectedItem} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} onAddToCart={(item) => setCart(p => [...p, item])} onSendToKitchen={handleSendToKitchenDirect} />
      {showNavbar && <Navbar onMenuClick={() => setIsSidebarOpen(true)} onCartClick={() => setCurrentView('cart')} onLogoClick={() => setCurrentView('menu')} currentView={currentView} cartCount={cart.reduce((s, i) => s + i.quantity, 0)} />}
      <main className={showNavbar ? "min-h-[80vh]" : ""}>{renderView()}</main>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around py-4 max-w-xl mx-auto z-40">
        {[
          { v: 'menu', i: 'fa-house', l: 'Menu' },
          { v: 'orders', i: 'fa-receipt', l: 'Orders' },
          { v: 'favorites', i: 'fa-heart', l: 'Hearts' },
          { v: 'admin', i: 'fa-user-gear', l: 'Admin' }
        ].map(btn => (
          <button key={btn.v} onClick={() => setCurrentView(btn.v as ViewState)} className={`flex flex-col items-center gap-1 transition ${currentView === btn.v ? 'text-orange-500' : 'text-slate-300 hover:text-orange-300'}`}>
            <i className={`fa-solid ${btn.i} text-xl`}></i>
            <span className="text-[10px] font-black uppercase tracking-widest">{btn.l}</span>
          </button>
        ))}
      </div>

      <style>{` .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } `}</style>
    </div>
  );
}
