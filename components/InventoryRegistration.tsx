
import React, { useState, useEffect } from 'react';
import { ref, push, onValue } from 'firebase/database';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { SOFT_ROSE_PRODUCTS, DEFAULT_MARKETS } from '../constants';

const InventoryRegistration: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [markets, setMarkets] = useState<string[]>(DEFAULT_MARKETS);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [items, setItems] = useState<{name: string, quantity: number}[]>([]);

  useEffect(() => {
    const marketsRef = ref(db, 'markets');
    onValue(marketsRef, (snap) => {
      if (snap.exists()) {
        const raw = snap.val();
        const customMarkets = Object.values(raw).map((m: any) => 
          typeof m === 'string' ? m : (m?.name || String(m))
        );
        setMarkets([...DEFAULT_MARKETS, ...customMarkets]);
      }
    });
  }, []);

  const handleSave = () => {
    if (!selectedMarket || items.length === 0) return alert('يرجى تعبئة البيانات');
    push(ref(db, 'inventory'), {
      userId: user.uid,
      userName: user.name,
      market: selectedMarket,
      items: items.filter(i => i.quantity > 0),
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    });
    setItems([]);
    alert('تم حفظ المخزون بنجاح');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <i className="fa-solid fa-boxes-stacked text-indigo-400"></i> تسجيل المخزون
        </h2>

        <div className="mb-8">
          <label className="block text-sm font-bold opacity-70 mb-2">الماركت</label>
          <select 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500 text-sm"
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
          >
            <option value="">-- اختر الماركت --</option>
            {markets.map((m, i) => <option key={i} value={m} className="bg-gray-800">{m}</option>)}
          </select>
        </div>

        <div className="space-y-6">
          {SOFT_ROSE_PRODUCTS.map(cat => (
            <div key={cat.category} className="space-y-3">
              <h4 className="bg-white/10 px-4 py-2 rounded-lg text-xs font-bold opacity-60 uppercase">{cat.category}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cat.items.map(product => (
                  <div key={product} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="flex-1 text-xs">{product}</span>
                    <input 
                      type="number" 
                      placeholder="الكمية" 
                      className="w-20 bg-white/10 border-none rounded-lg p-2 text-xs text-center outline-none"
                      onChange={e => {
                        const q = parseInt(e.target.value);
                        const existing = items.find(i => i.name === product);
                        if (existing) {
                          setItems(items.map(i => i.name === product ? { ...i, quantity: q } : i));
                        } else {
                          setItems([...items, { name: product, quantity: q }]);
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <button 
            onClick={handleSave}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
          >حفظ المخزون</button>
        </div>
      </div>
    </div>
  );
};

export default InventoryRegistration;
