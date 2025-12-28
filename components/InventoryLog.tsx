
import React, { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../firebase';
import { UserProfile, UserRole, InventoryRecord } from '../types';
import { exportToCSV } from '../utils';

const InventoryLog: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [logs, setLogs] = useState<InventoryRecord[]>([]);
  const [filterMarket, setFilterMarket] = useState('');

  useEffect(() => {
    onValue(ref(db, 'inventory'), snap => {
      if (snap.exists()) {
        const raw = snap.val();
        const data = Object.keys(raw).map(k => ({ id: k, ...raw[k] }));
        setLogs(data);
      }
    });
  }, []);

  const filtered = logs.filter(l => {
    const isOwner = user.role === UserRole.ADMIN || l.userId === user.uid;
    return isOwner && (!filterMarket || l.market === filterMarket);
  }).sort((a,b) => b.timestamp - a.timestamp);

  const handleExport = () => {
    const header = ["الماركت", "التاريخ", "الموظف", "الصنف", "الكمية"];
    const rows = filtered.flatMap(l => l.items.map(i => [l.market, l.date, l.userName, i.name, i.quantity]));
    exportToCSV('سجل_المخزون', [header, ...rows]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-clipboard-list text-emerald-400"></i> سجل المخزون السابق
          </h2>
          <button onClick={handleExport} className="bg-green-600 px-6 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition">
            <i className="fa-solid fa-file-excel ml-2"></i> تصدير Excel
          </button>
        </div>

        <select 
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6 outline-none text-sm"
          value={filterMarket}
          onChange={e => setFilterMarket(e.target.value)}
        >
          <option value="">جميع الماركتات</option>
          {[...new Set(logs.map(l => String(l.market)))].map(m => <option key={m} value={m} className="bg-gray-800">{m}</option>)}
        </select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(log => (
            <div key={log.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg">{String(log.market)}</h4>
                  <p className="text-[10px] opacity-60">{log.date} | سجل بواسطة: {log.userName}</p>
                </div>
                {(user.role === UserRole.ADMIN || log.userId === user.uid) && (
                   <button onClick={() => confirm('حذف؟') && remove(ref(db, `inventory/${log.id}`))} className="text-red-400">
                     <i className="fa-solid fa-trash"></i>
                   </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {log.items.map((i,idx) => (
                  <div key={idx} className="flex justify-between bg-white/5 px-3 py-1 rounded-lg text-xs">
                    <span className="opacity-70">{String(i.name)}</span>
                    <span className="font-bold">{i.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-full py-20 text-center opacity-30 italic">لا توجد بيانات مسجلة</div>}
        </div>
      </div>
    </div>
  );
};

export default InventoryLog;
