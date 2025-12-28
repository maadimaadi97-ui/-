
import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update } from 'firebase/database';
import { db } from '../firebase';
import { UserProfile, UserRole, SaleRecord } from '../types';
import { exportToCSV } from '../utils';

const SalesLog: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [filteredSales, setFilteredSales] = useState<SaleRecord[]>([]);
  const [filters, setFilters] = useState({ date: '', employee: '', market: '' });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [editSale, setEditSale] = useState<SaleRecord | null>(null);

  useEffect(() => {
    onValue(ref(db, 'sales'), (snap) => {
      if (snap.exists()) {
        const raw = snap.val();
        const data = Object.keys(raw).map(k => ({ id: k, ...raw[k] }));
        setSales(data);
      } else {
        setSales([]);
      }
    });

    onValue(ref(db, 'users'), (snap) => {
      if (snap.exists()) {
        const raw = snap.val();
        setUsers(Object.keys(raw).map(k => ({ uid: k, ...raw[k] })));
      }
    });
  }, []);

  useEffect(() => {
    let result = sales;
    
    // User permission check: show only own data unless admin OR granted permission
    if (user.role !== UserRole.ADMIN && !user.permissions?.viewAllSales) {
      result = result.filter(s => s.userId === user.uid);
    }

    if (filters.date) result = result.filter(s => s.date.includes(filters.date));
    if (filters.employee) result = result.filter(s => s.userName === filters.employee);
    if (filters.market) result = result.filter(s => s.market === filters.market);

    setFilteredSales(result.sort((a, b) => b.timestamp - a.timestamp));
  }, [sales, filters, user]);

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      remove(ref(db, `sales/${id}`));
    }
  };

  const handleUpdate = () => {
    if (editSale) {
      const total = editSale.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      update(ref(db, `sales/${editSale.id}`), { ...editSale, total });
      setEditSale(null);
    }
  };

  const handleExportExcel = () => {
    // Advanced Monthly Export logic
    const header = ["الشركة", "الموظف", "اليوم والتاريخ", "الماركت", "الصنف", "سعر القطعة", "الكمية", "إجمالي الصنف"];
    const rows = filteredSales.flatMap(s => 
      s.items.map(item => [
        "سوفت روز", s.userName, s.date, s.market, item.name, item.price, item.quantity, item.price * item.quantity
      ])
    );
    
    // Summary row
    const totalSales = filteredSales.reduce((acc, s) => acc + s.total, 0);
    rows.push(["", "", "", "", "", "", "المجموع الكلي", totalSales]);

    exportToCSV(`سجل_مبيعات_${filters.date || 'تقرير'}`, [header, ...rows]);
  };

  const currentMonthSales = filteredSales.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <i className="fa-solid fa-receipt text-indigo-400"></i> سجل المبيعات
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2"
            >
              <i className="fa-solid fa-file-excel"></i> تصدير Excel (تقرير مفصل)
            </button>
            <div className="bg-indigo-600/40 px-4 py-2 rounded-xl text-xs flex flex-col items-center justify-center">
              <span className="opacity-70">إجمالي الفترة المحددة</span>
              <span className="font-bold text-lg">{currentMonthSales} ج.م</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input 
            type="month" 
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none text-sm"
            onChange={e => setFilters({...filters, date: e.target.value})}
          />
          <select 
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none text-sm"
            onChange={e => setFilters({...filters, employee: e.target.value})}
          >
            <option value="">كل الموظفين</option>
            {users.map(u => <option key={u.uid} value={String(u.name)} className="bg-gray-800">{String(u.name)}</option>)}
          </select>
          <select 
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none text-sm"
            onChange={e => setFilters({...filters, market: e.target.value})}
          >
            <option value="">كل الماركتات</option>
            {[...new Set(sales.map(s => s.market))].map(m => <option key={String(m)} value={String(m)} className="bg-gray-800">{String(m)}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-right text-sm">
            <thead className="bg-white/5 font-bold">
              <tr>
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3">الموظف</th>
                <th className="px-4 py-3">الماركت</th>
                <th className="px-4 py-3">الأصناف</th>
                <th className="px-4 py-3">الإجمالي</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3">{String(sale.date)}</td>
                  <td className="px-4 py-3">{String(sale.userName)}</td>
                  <td className="px-4 py-3 font-semibold">{String(sale.market)}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {sale.items.map((it, i) => (
                        <div key={i} className="text-[10px] bg-white/5 px-2 py-0.5 rounded-md inline-block mr-1">
                          {String(it.name)} ({it.quantity})
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-indigo-400">{sale.total} ج.م</td>
                  <td className="px-4 py-3 space-x-2 space-x-reverse">
                    {(user.role === UserRole.ADMIN || sale.userId === user.uid) && (
                      <>
                        <button 
                          onClick={() => setEditSale(sale)}
                          className="text-blue-400 hover:text-blue-300"
                        ><i className="fa-solid fa-pen-to-square"></i></button>
                        <button 
                          onClick={() => handleDelete(sale.id)}
                          className="text-red-400 hover:text-red-300"
                        ><i className="fa-solid fa-trash"></i></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSales.length === 0 && <div className="p-10 text-center opacity-40">لا توجد بيانات متاحة للعرض</div>}
        </div>
      </div>

      {/* Edit Modal */}
      {editSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 w-full max-w-2xl rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">تعديل مبيعات: {editSale.market}</h3>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto mb-6">
              {editSale.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl">
                  <span className="flex-1 font-bold text-sm">{String(item.name)}</span>
                  <input 
                    type="number" 
                    className="w-20 border rounded-lg p-2" 
                    value={item.price}
                    onChange={e => {
                      const newItems = [...editSale.items];
                      newItems[idx].price = parseFloat(e.target.value);
                      setEditSale({...editSale, items: newItems});
                    }}
                  />
                  <input 
                    type="number" 
                    className="w-20 border rounded-lg p-2" 
                    value={item.quantity}
                    onChange={e => {
                      const newItems = [...editSale.items];
                      newItems[idx].quantity = parseInt(e.target.value);
                      setEditSale({...editSale, items: newItems});
                    }}
                  />
                  <button onClick={() => {
                    const newItems = editSale.items.filter((_, i) => i !== idx);
                    setEditSale({...editSale, items: newItems});
                  }} className="text-red-500"><i className="fa-solid fa-trash"></i></button>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleUpdate} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">حفظ التغييرات</button>
              <button onClick={() => setEditSale(null)} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesLog;
