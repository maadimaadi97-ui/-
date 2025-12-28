
import React, { useState, useEffect } from 'react';
import { ref, push, onValue, set } from 'firebase/database';
import { db } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { COMPANIES, DEFAULT_MARKETS } from '../constants';

const CompetitorPrices: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [markets, setMarkets] = useState<string[]>(DEFAULT_MARKETS);
  const [companies, setCompanies] = useState<string[]>(COMPANIES);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [items, setItems] = useState<{name: string, price: number}[]>([]);

  useEffect(() => {
    onValue(ref(db, 'markets'), snap => {
      if (snap.exists()) {
        const raw = snap.val();
        const custom = Object.values(raw).map((m: any) => typeof m === 'string' ? m : (m?.name || String(m)));
        setMarkets([...DEFAULT_MARKETS, ...custom]);
      }
    });
    onValue(ref(db, 'companies'), snap => {
      if (snap.exists()) {
        const raw = snap.val();
        const custom = Object.values(raw).map((c: any) => typeof c === 'string' ? c : (c?.name || String(c)));
        setCompanies([...COMPANIES, ...custom]);
      }
    });
  }, []);

  const handleSave = () => {
    if (!selectedMarket || !selectedCompany || items.length === 0) return alert('أكمل البيانات');
    push(ref(db, 'competitor_prices'), {
      userId: user.uid,
      userName: user.name,
      market: selectedMarket,
      company: selectedCompany,
      items: items.filter(i => i.price > 0),
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    });
    setItems([]);
    alert('تم الترحيل لتقارير المنافسين');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-[2rem] border border-white/20 shadow-xl">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <i className="fa-solid fa-tags text-rose-400"></i> تسجيل أسعار المنافسين
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-bold mb-2 opacity-60">الماركت</label>
            <select className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl" value={selectedMarket} onChange={e => setSelectedMarket(e.target.value)}>
              <option value="">-- اختر --</option>
              {markets.map(m => <option key={m} value={m} className="bg-gray-800">{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 opacity-60">الشركة</label>
            <select className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl" value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
              <option value="">-- اختر --</option>
              {companies.map(c => <option key={c} value={c} className="bg-gray-800">{c}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-6">
          {["Facial", "Kitchen", "Toilet"].map(cat => (
            <div key={cat} className="space-y-4">
              <h4 className="text-indigo-400 font-bold border-r-4 border-rose-500 pr-3">{cat === "Facial" ? 'مناديل سحب' : cat === "Kitchen" ? 'مناديل مطبخ' : 'تواليت'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex gap-3 bg-white/5 p-3 rounded-2xl">
                    <input 
                      className="flex-1 bg-transparent border-none outline-none text-xs" 
                      placeholder="اسم المنتج"
                      onBlur={e => {
                        const name = e.target.value;
                        if(name) setItems([...items.filter(it => it.name !== name), { name, price: 0 }]);
                      }}
                    />
                    <input 
                      type="number" 
                      className="w-20 bg-white/10 rounded-xl p-2 text-xs text-center" 
                      placeholder="السعر"
                      onChange={e => {
                        const p = parseFloat(e.target.value);
                        const last = items[items.length - 1];
                        if(last) {
                            const newItems = [...items];
                            newItems[newItems.length -1].price = p;
                            setItems(newItems);
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSave} className="w-full mt-10 bg-rose-600 hover:bg-rose-700 py-4 rounded-2xl font-bold shadow-lg transition-all">حفظ الأسعار والترحيل</button>
      </div>
    </div>
  );
};

export default CompetitorPrices;
