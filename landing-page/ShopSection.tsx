import React from 'react';

export const ShopSection: React.FC = () => {
  const products = [
    {
      id: 1,
      name: 'Titanium QR Stand',
      material: 'Metal',
      price: '$129.00',
      description: 'Precision-milled aerospace grade titanium. Indestructible and timeless.',
      image: 'https://images.unsplash.com/photo-1618423771880-2c6b1b2d4f8d?auto=format&fit=crop&q=80&w=800',
      badge: 'Best Seller'
    },
    {
      id: 2,
      name: 'Walnut Block',
      material: 'Wood',
      price: '$89.00',
      description: 'Hand-finished American black walnut. Warm, organic, and unique.',
      image: 'https://images.unsplash.com/photo-1610374792793-f016b423810c?auto=format&fit=crop&q=80&w=800',
      badge: 'New'
    },
    {
      id: 3,
      name: 'Crystal Prism',
      material: 'Glass',
      price: '$149.00',
      description: 'Optical grade K9 crystal glass. Heavy, clear, and absolutely stunning.',
      image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 4,
      name: 'Matte Acrylic',
      material: 'Plastic',
      price: '$49.00',
      description: 'High-density matte acrylic. Modern, minimal, and durable.',
      image: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 5,
      name: 'Brushed Brass',
      material: 'Metal',
      price: '$119.00',
      description: 'Solid brass with a hand-brushed finish. Develops a beautiful patina over time.',
      image: 'https://images.unsplash.com/photo-1615615228002-890bb61cac6e?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 6,
      name: 'Carbon Fiber',
      material: 'Composite',
      price: '$199.00',
      description: 'Real twill-weave carbon fiber. Ultra-lightweight and incredibly strong.',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
      badge: 'Limited'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 font-jakarta">
      <div className="text-center mb-16">
        <h2 className="text-[10px] font-bold text-orange-600 uppercase tracking-[0.3em] mb-3">Hardware Store</h2>
        <h3 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">Physical Touchpoints</h3>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
          Premium QR code stands designed to match your venue's aesthetic. 
          Built to last and designed to impress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <div key={product.id} className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col">
            <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {product.badge && (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-900 shadow-sm">
                  {product.badge}
                </div>
              )}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-bold text-slate-900 shadow-sm">
                {product.price}
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{product.material}</p>
                <h4 className="text-xl font-bold text-slate-900 tracking-tight mb-2">{product.name}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{product.description}</p>
              </div>
              
              <div className="mt-auto pt-4 border-t border-slate-50">
                <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-orange-600 transition-colors active:scale-95">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 p-8 bg-slate-50 rounded-3xl border border-slate-100 text-center">
        <h4 className="text-xl font-bold text-slate-900 mb-2">Bulk Orders & Custom Branding</h4>
        <p className="text-slate-500 mb-6 max-w-xl mx-auto">
          Need more than 10 units or want your logo engraved? We offer volume discounts and custom laser etching for enterprise clients.
        </p>
        <button className="px-8 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:border-slate-900 transition-colors">
          Contact Sales
        </button>
      </div>
    </div>
  );
};
