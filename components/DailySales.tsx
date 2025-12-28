
import React, { useState, useEffect } from 'react';
import { ref, push, onValue } from 'firebase/database';
import { db } from '../firebase';
import { UserProfile, SaleItem } from '../types';
import { SOFT_ROSE_PRODUCTS, DEFAULT_MARKETS } from '../constants';

const DailySales: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [markets, setMarkets] = useState<string[]>(DEFAULT_MARKETS);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [customProducts, setCustomProducts] = useState<string[]>([]);
  const [salesList, setSalesList] = useState<SaleItem[]>([]);
  const [currentItem, setCurrentItem] = useState({ name: '', price: 0, quantity: 0 });

  useEffect(() => {
    onValue(ref(db, 'markets'), (snap) => {
      if (snap.exists()) {
        const raw = snap.val();
        setMarkets([...DEFAULT_MARKETS, ...Object.values(raw).map((m: any) => typeof m === 'string' ? m : m.name)]);
      }
    });
    onValue(ref(db, `user_custom_products/${user.uid}`), (snap) => {
      if (snap.exists()) setCustomProducts(Object.values(snap.val()));
    });
  }, [user.uid]);

  const addMarket = () => {
    const name = prompt('أدخل اسم الماركت الجديد:');
    if (name) push(ref(db, 'markets'), { name });
  };

  const addCustomProduct = () => {
    if (customProducts.length >= 50) return alert('وصلت للحد الأقصى (50 صنف)');
    const name = prompt('أدخل اسم الصنف الجديد:');
    if (name) push(ref(db, `user_custom_products/${user.uid}`), name);
  };

  const addToSales = () => {
    if (!currentItem.name || currentItem.quantity <= 0) return alert('يرجى اختيار صنف وإدخال كمية');
    setSalesList([...salesList, { ...currentItem }]);
    setCurrentItem({ name: '', price: 0, quantity: 0 });
  };

  const handleSave = () => {
    if (!selectedMarket || salesList.length === 0) return alert('يرجى اختيار ماركت وإضافة أصناف');
    const total = salesList.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const saleData = {
      userId: user.uid,
      userName: user.name,
      market: selectedMarket,
      items: salesList,
      total,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    push(ref(db, 'sales'), saleData);
    setSalesList([]);
    alert('تم الحفظ والترحيل بنجاح');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <i className="fa-solid fa-cash-register text-rose-500"></i> تسجيل مبيعات اليوم
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm mb-2 font-bold opacity-70">الماركت</label>
            <div className="flex gap-2">
              <select 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-rose-500 transition-all text-sm"
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
              >
                <option value="">-- اختر الماركت --</option>
                {markets.map((m, i) => <option key={i} value={String(m)} className="bg-gray-800">{String(m)}</option>)}
              </select>
              <button onClick={addMarket} className="bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-all" title="إضافة ماركت">
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs mb-1 font-bold opacity-60">الصنف</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-rose-500 text-sm"
                value={currentItem.name}
                onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
              >
                <option value="">-- اختر الصنف --</option>
                {SOFT_ROSE_PRODUCTS.map(cat => (
                  <React.Fragment key={cat.category}>
                    <option disabled className="bg-gray-300 text-gray-800 font-bold">{cat.category}</option>
                    {cat.items.map(item => <option key={item} value={item} className="text-white">{item}</option>)}
                  </React.Fragment>
                ))}
                {customProducts.length > 0 && (
                  <>
                    <option disabled className="bg-gray-300 text-gray-800 font-bold">أصناف مضافة</option>
                    {customProducts.map((item, i) => <option key={i} value={item} className="text-white">{item}</option>)}
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1 font-bold opacity-60">السعر</label>
              <input 
                type="number" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-rose-500 text-sm"
                placeholder="السعر"
                value={currentItem.price || ''}
                onChange={(e) => setCurrentItem({...currentItem, price: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-bold opacity-60">الكمية</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-rose-500 text-sm"
                  placeholder="الكمية"
                  value={currentItem.quantity || ''}
                  onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value)})}
                />
                <button 
                  onClick={addToSales}
                  className="bg-indigo-600 px-4 rounded-xl hover:bg-indigo-700 transition"
                >إضافة</button>
              </div>
            </div>
          </div>
          <button onClick={addCustomProduct} className="text-xs text-indigo-400 underline hover:text-indigo-300">أضف صنف جديد للقائمة (بحد أقصى 50)</button>
        </div>

        {/* Sales Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm text-right">
            <thead className="bg-white/5 font-bold">
              <tr>
                <th className="px-4 py-3">الصنف</th>
                <th className="px-4 py-3">السعر</th>
                <th className="px-4 py-3">الكمية</th>
                <th className="px-4 py-3">الإجمالي</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {salesList.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">{String(item.name)}</td>
                  <td className="px-4 py-3">{item.price} ج.م</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3 font-bold">{item.price * item.quantity} ج.م</td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => setSalesList(salesList.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-300"
                    ><i className="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {salesList.length === 0 && <div className="p-10 text-center opacity-40 italic">لم يتم إضافة أصناف بعد</div>}
        </div>

        <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-indigo-600/20 p-6 rounded-2xl border border-indigo-500/30">
          <div className="text-xl font-bold">إجمالي المبيعات: <span className="text-indigo-400">{salesList.reduce((acc, item) => acc + (item.price * item.quantity), 0)} ج.م</span></div>
          <button 
            onClick={handleSave}
            className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 text-white font-bold px-10 py-4 rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95"
          >حفظ وترحيل</button>
        </div>
      </div>
    </div>
  );
};

export default DailySales;
