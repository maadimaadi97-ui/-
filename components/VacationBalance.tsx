
import React, { useState, useEffect } from 'react';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import { db } from '../firebase';
import { UserProfile, UserRole, VacationBalance, VacationEntry } from '../types';

const VacationBalanceView: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [balance, setBalance] = useState<VacationBalance | null>(null);
  const [history, setHistory] = useState<VacationEntry[]>([]);
  const [allBalances, setAllBalances] = useState<Record<string, VacationBalance>>({});
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newEntry, setNewEntry] = useState<Partial<VacationEntry>>({
    userId: user.uid,
    userName: user.name,
    type: 'annual',
    days: 1,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Current user balance
    onValue(ref(db, `vacationBalances/${user.uid}`), (snap) => {
      if (snap.exists()) setBalance(snap.val());
    });

    // Vacation history with per-user isolation
    onValue(ref(db, 'vacationHistory'), (snap) => {
      if (snap.exists()) {
        const raw = snap.val();
        const data = Object.keys(raw).map(k => ({ id: k, ...raw[k] }));
        // Filter: Admin sees everyone, User sees only self
        setHistory(data.filter(h => user.role === UserRole.ADMIN || h.userId === user.uid));
      } else {
        setHistory([]);
      }
    });

    if (user.role === UserRole.ADMIN) {
      onValue(ref(db, 'vacationBalances'), (snap) => {
        if (snap.exists()) setAllBalances(snap.val());
      });
      onValue(ref(db, 'users'), (snap) => {
        if (snap.exists()) {
          const raw = snap.val();
          setUsers(Object.keys(raw).map(k => ({ uid: k, ...raw[k] })));
        }
      });
    }
  }, [user]);

  const handleAddVacation = () => {
    if (!newEntry.userId || !newEntry.date || !newEntry.days || !newEntry.type) return;

    // Deduction logic
    const currentBal = allBalances[newEntry.userId] || balance || { annual: 0, casual: 0, sick: 0 };
    const typeKey = newEntry.type as keyof VacationBalance;
    
    if (newEntry.type !== 'exams') {
      const remaining = (currentBal[typeKey] || 0) - (newEntry.days || 0);
      if (remaining < 0 && user.role !== UserRole.ADMIN) {
        return alert('الرصيد غير كافي');
      }
      update(ref(db, `vacationBalances/${newEntry.userId}`), { [typeKey]: remaining });
    }

    push(ref(db, 'vacationHistory'), {
      ...newEntry,
      timestamp: Date.now()
    });

    setShowAddModal(false);
    alert('تم إضافة الإجازة وخصمها من الرصيد بنجاح');
  };

  // Period Logic: 21st of prev month to 20th of current month
  const getPeriodLabel = () => {
    const d = new Date();
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const prevM = m === 1 ? 12 : m - 1;
    const prevY = m === 1 ? y - 1 : y;
    return `إجازات الفترة من 21/${prevM}/${prevY} حتى 20/${m}/${y}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-indigo-400">{getPeriodLabel()}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-500/20">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm opacity-80">سنوية</span>
            <i className="fa-solid fa-umbrella-beach text-2xl opacity-40"></i>
          </div>
          <div className="text-4xl font-black">{balance?.annual || 0} <span className="text-sm">يوم</span></div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-3xl text-white shadow-xl shadow-rose-500/20">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm opacity-80">عارضة</span>
            <i className="fa-solid fa-bolt text-2xl opacity-40"></i>
          </div>
          <div className="text-4xl font-black">{balance?.casual || 0} <span className="text-sm">يوم</span></div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-500/20">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm opacity-80">مرضي</span>
            <i className="fa-solid fa-house-medical text-2xl opacity-40"></i>
          </div>
          <div className="text-4xl font-black">{balance?.sick || 0} <span className="text-sm">يوم</span></div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">سجل التواريخ</h3>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg transition-all"
          >
            <i className="fa-solid fa-plus ml-2"></i> تسجيل إجازة
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-right text-sm">
            <thead className="bg-white/5 font-bold">
              <tr>
                <th className="px-4 py-4">التاريخ</th>
                <th className="px-4 py-4">النوع</th>
                <th className="px-4 py-4">الأيام</th>
                {user.role === UserRole.ADMIN && <th className="px-4 py-4">الموظف</th>}
                {user.role === UserRole.ADMIN && <th className="px-4 py-4">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map(h => (
                <tr key={h.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-4">{h.date}</td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase
                      ${h.type === 'annual' ? 'bg-blue-500/20 text-blue-400' : 
                        h.type === 'casual' ? 'bg-rose-500/20 text-rose-400' :
                        h.type === 'sick' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-purple-500/20 text-purple-400'}`}>
                      {h.type === 'annual' ? 'سنوية' : h.type === 'casual' ? 'عارضة' : h.type === 'sick' ? 'مرضي' : 'امتحانات'}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-bold">{h.days}</td>
                  {user.role === UserRole.ADMIN && <td className="px-4 py-4 opacity-70">{h.userName}</td>}
                  {user.role === UserRole.ADMIN && (
                    <td className="px-4 py-4">
                       <button onClick={() => {
                         if(confirm('هل تريد حذف الإجازة وإعادة الرصيد؟')) {
                            const currentBal = allBalances[h.userId];
                            const typeKey = h.type as keyof VacationBalance;
                            if (typeKey !== 'exams' as any) {
                              update(ref(db, `vacationBalances/${h.userId}`), { [typeKey]: (currentBal?.[typeKey] || 0) + h.days });
                            }
                            remove(ref(db, `vacationHistory/${h.id}`));
                         }
                       }} className="text-red-400"><i className="fa-solid fa-trash"></i></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && <div className="p-10 text-center opacity-40">لا يوجد سجل إجازات للفترة الحالية</div>}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">تسجيل إجازة جديدة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 opacity-60">الموظف</label>
                <input type="text" readOnly value={user.name} className="w-full bg-gray-100 border p-3 rounded-xl" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-60">التاريخ</label>
                  <input 
                    type="date" 
                    className="w-full border p-3 rounded-xl"
                    value={newEntry.date}
                    onChange={e => setNewEntry({...newEntry, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-60">الأيام</label>
                  <input 
                    type="number" 
                    className="w-full border p-3 rounded-xl"
                    value={newEntry.days}
                    onChange={e => setNewEntry({...newEntry, days: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 opacity-60">نوع الإجازة</label>
                <select 
                  className="w-full border p-3 rounded-xl"
                  value={newEntry.type}
                  onChange={e => setNewEntry({...newEntry, type: e.target.value as any})}
                >
                  <option value="annual">سنوية</option>
                  <option value="casual">عارضة</option>
                  <option value="sick">مرضي</option>
                  <option value="exams">امتحانات</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleAddVacation}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition"
                >إضافة الإجازة</button>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 py-4 rounded-xl font-bold hover:bg-gray-200 transition"
                >إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VacationBalanceView;
