
import React, { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../firebase';
import { UserProfile, UserRole, CompetitorPriceRecord } from '../types';
import { exportToCSV } from '../utils';

const CompetitorReports: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [reports, setReports] = useState<CompetitorPriceRecord[]>([]);
  const [filter, setFilter] = useState({ market: '', company: '' });

  useEffect(() => {
    onValue(ref(db, 'competitor_prices'), snap => {
      if (snap.exists()) {
        const raw = snap.val();
        setReports(Object.keys(raw).map(k => ({ id: k, ...raw[k] })));
      }
    });
  }, []);

  const filtered = reports.filter(r => {
    const isOwner = user.role === UserRole.ADMIN || r.userId === user.uid;
    return isOwner && (!filter.market || r.market === filter.market) && (!filter.company || r.company === filter.company);
  });

  const handleExport = () => {
    const header = ["الماركت", "الشركة", "المنتج", "السعر", "التاريخ"];
    const rows = filtered.flatMap(r => r.items.map(i => [r.market, r.company, i.name, i.price, r.date]));
    exportToCSV('تقارير_المنافسين', [header, ...rows]);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <i className="fa-solid fa-chart-line text-indigo-400"></i> تقارير المنافسين
        </h2>
        <button onClick={handleExport} className="bg-green-600 px-6 py-2 rounded-xl text-sm font-bold">
          <i className="fa-solid fa-file-excel ml-2"></i> تصدير Excel
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <select className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm" onChange={e => setFilter({...filter, market: e.target.value})}>
           <option value="">جميع الماركتات</option>
           {[...new Set(reports.map(r => String(r.market)))].map(m => <option key={m} value={m} className="bg-gray-800">{m}</option>)}
        </select>
        <select className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm" onChange={e => setFilter({...filter, company: e.target.value})}>
           <option value="">جميع الشركات</option>
           {[...new Set(reports.map(r => String(r.company)))].map(c => <option key={c} value={c} className="bg-gray-800">{c}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map(rep => (
          <div key={rep.id} className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-rose-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{String(rep.company)}</span>
                <h4 className="font-bold">{String(rep.market)}</h4>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {rep.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between border-b border-white/5 text-[11px] py-1">
                    <span className="opacity-60">{String(it.name)}</span>
                    <span className="font-bold">{it.price} ج.م</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-left flex flex-col justify-between items-end border-r border-white/5 pr-4">
              <span className="text-[10px] opacity-40">{rep.date}</span>
              {(user.role === UserRole.ADMIN || rep.userId === user.uid) && (
                 <button onClick={() => confirm('حذف؟') && remove(ref(db, `competitor_prices/${rep.id}`))} className="text-red-400 hover:text-red-300">
                   <i className="fa-solid fa-trash"></i>
                 </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompetitorReports;
