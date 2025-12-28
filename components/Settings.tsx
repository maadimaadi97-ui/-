
import React, { useState, useEffect } from 'react';
import { ref, onValue, set, push, update, remove } from 'firebase/database';
import { db } from '../firebase';
import { UserProfile, UserRole, AppSettings, VacationBalance } from '../types';

const Settings: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<UserProfile> | null>(null);
  const [message, setMessage] = useState({ to: '', text: '' });

  useEffect(() => {
    onValue(ref(db, 'appSettings'), snap => { if (snap.exists()) setSettings(snap.val()); });
    onValue(ref(db, 'users'), snap => {
      if (snap.exists()) {
        const raw = snap.val();
        setUsers(Object.keys(raw).map(k => ({ uid: k, ...raw[k] })));
      }
    });
  }, []);

  const saveSettings = () => {
    if (settings) {
      set(ref(db, 'appSettings'), settings);
      alert('تم حفظ الإعدادات');
    }
  };

  const handleBackup = () => {
    onValue(ref(db, '/'), (snap) => {
      const data = JSON.stringify(snap.val());
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `soft-rose-backup-${new Date().toISOString()}.json`;
      link.click();
    }, { onlyOnce: true });
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (confirm('هل أنت متأكد من استعادة البيانات؟ سيتم مسح البيانات الحالية.')) {
            set(ref(db, '/'), data);
            alert('تم استعادة البيانات بنجاح');
          }
        } catch (err) {
          alert('ملف غير صالح');
        }
      };
      reader.readAsText(file);
    }
  };

  const toggleSidebarItem = (key: string) => {
    if (!settings) return;
    const items = { ...settings.sidebarItems };
    items[key] = !items[key];
    setSettings({ ...settings, sidebarItems: items });
  };

  const sendNotification = () => {
    if (!message.to || !message.text) return alert('أكمل بيانات الرسالة');
    const notifId = Date.now().toString();
    set(ref(db, `notifications/${message.to}/${notifId}`), {
      id: notifId,
      toUserId: message.to,
      fromUserName: user.name,
      text: message.text,
      timestamp: Date.now(),
      read: false
    });
    alert('تم إرسال الرسالة للموظف المختار');
    setMessage({ to: '', text: '' });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* App Info & Appearance */}
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <i className="fa-solid fa-display text-blue-400"></i> إعدادات البرنامج الأساسية
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1 opacity-60">اسم البرنامج بالكامل</label>
              <input 
                type="text" 
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl"
                value={settings?.appName || ''}
                onChange={e => settings && setSettings({...settings, appName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 opacity-60">تغيير المظهر (Styles)</label>
              <select 
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl"
                value={settings?.styles || 'professional'}
                onChange={e => settings && setSettings({...settings, styles: e.target.value as any})}
              >
                <option value="standard" className="bg-gray-800">Standard</option>
                <option value="glass" className="bg-gray-800">Glass (Windows 10)</option>
                <option value="dark" className="bg-gray-800">Dark Mode</option>
                <option value="professional" className="bg-gray-800">Professional</option>
              </select>
            </div>
            <button onClick={saveSettings} className="w-full bg-indigo-600 py-3 rounded-xl font-bold">حفظ المعلومات والمظهر</button>
          </div>
        </div>

        {/* Ticker Management */}
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <i className="fa-solid fa-scroll text-yellow-400"></i> شريط الإعلانات (Ticker)
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
              <span className="text-sm">تفعيل الشريط المتحرك</span>
              <button 
                onClick={() => settings && setSettings({...settings, tickerEnabled: !settings.tickerEnabled})}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings?.tickerEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings?.tickerEnabled ? 'right-7' : 'right-1'}`}></div>
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 opacity-60">نص الإعلان (حتى 1000 حرف)</label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl h-24"
                value={settings?.tickerText || ''}
                onChange={e => settings && setSettings({...settings, tickerText: e.target.value})}
              />
            </div>
            <button onClick={saveSettings} className="w-full bg-yellow-600 py-3 rounded-xl font-bold">تحديث نص الشريط</button>
          </div>
        </div>

        {/* Notifications & Messaging */}
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <i className="fa-solid fa-paper-plane text-indigo-400"></i> إرسال رسالة خاصة لموظف
          </h3>
          <div className="space-y-4">
            <select 
              className="w-full bg-white/5 border border-white/10 p-3 rounded-xl"
              value={message.to}
              onChange={e => setMessage({...message, to: e.target.value})}
            >
              <option value="">-- اختر الموظف المستلم --</option>
              {users.map(u => <option key={u.uid} value={u.uid} className="bg-gray-800">{String(u.name)}</option>)}
            </select>
            <textarea 
              className="w-full bg-white/5 border border-white/10 p-3 rounded-xl h-24"
              placeholder="اكتب الرسالة هنا..."
              value={message.text}
              onChange={e => setMessage({...message, text: e.target.value})}
            />
            <button onClick={sendNotification} className="w-full bg-indigo-600 py-3 rounded-xl font-bold">إرسال الرسالة الآن</button>
          </div>
        </div>

        {/* Visibility Controls */}
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <i className="fa-solid fa-eye text-emerald-400"></i> صلاحيات العرض (إظهار/إخفاء)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {id: 'sales-log', label: 'سجل المبيعات'},
              {id: 'inventory-log', label: 'سجل المخزون'},
              {id: 'competitor-reports', label: 'تقارير المنافسين'}
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => toggleSidebarItem(item.id)}
                className={`p-3 rounded-xl text-xs font-bold border transition ${settings?.sidebarItems?.[item.id] === false ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={saveSettings} className="w-full mt-4 bg-emerald-600 py-3 rounded-xl font-bold">حفظ الصلاحيات للجميع</button>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <i className="fa-solid fa-database text-rose-400"></i> النسخ الاحتياطي والاستعادة
        </h3>
        <div className="flex flex-wrap gap-4">
          <button onClick={handleBackup} className="bg-white/10 border border-white/20 px-6 py-4 rounded-2xl font-bold hover:bg-white/20 transition">
            <i className="fa-solid fa-download ml-2"></i> تحميل نسخة احتياطية
          </button>
          <label className="bg-white/10 border border-white/20 px-6 py-4 rounded-2xl font-bold hover:bg-white/20 transition cursor-pointer">
            <i className="fa-solid fa-upload ml-2"></i> استعادة البيانات (Recovery)
            <input type="file" className="hidden" onChange={handleRestore} />
          </label>
        </div>
      </div>

      {/* Account Management & Online Status */}
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-users text-indigo-400"></i> الموظفون وحالة الاتصال (Online)
          </h3>
          <button onClick={() => { setSelectedUser({ role: UserRole.USER }); setShowUserModal(true); }} className="bg-indigo-600 px-6 py-2 rounded-xl text-sm font-bold shadow-lg">
            إضافة حساب جديد
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => (
            <div key={u.uid} className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${u.isOnline ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-red-500'}`} title={u.isOnline ? 'متصل الآن' : 'غير متصل'}></div>
                  <div>
                    <div className="font-bold text-sm">{String(u.name)}</div>
                    <div className="text-[10px] opacity-60 uppercase">كود: {String(u.code)} | {u.role}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedUser(u); setShowUserModal(true); }} className="p-2 hover:bg-white/10 rounded-lg text-blue-400"><i className="fa-solid fa-pen"></i></button>
                  <button onClick={() => {
                    if (confirm('هل أنت متأكد من حذف هذا الحساب نهائياً؟')) remove(ref(db, `users/${u.uid}`));
                  }} className="p-2 hover:bg-white/10 rounded-lg text-red-400"><i className="fa-solid fa-trash"></i></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">{selectedUser.uid ? 'تعديل بيانات الحساب' : 'إنشاء حساب موظف جديد'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-60">الاسم بالكامل</label>
                  <input type="text" className="w-full border p-3 rounded-xl" value={selectedUser.name || ''} onChange={e => setSelectedUser({...selectedUser, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-60">كود الموظف</label>
                  <input type="text" className="w-full border p-3 rounded-xl" value={selectedUser.code || ''} onChange={e => setSelectedUser({...selectedUser, code: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-60">كلمة المرور (الباسورد)</label>
                  <input type="text" className="w-full border p-3 rounded-xl" value={selectedUser.password || ''} onChange={e => setSelectedUser({...selectedUser, password: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 opacity-60">نوع الصلاحية</label>
                  <select className="w-full border p-3 rounded-xl" value={selectedUser.role} onChange={e => setSelectedUser({...selectedUser, role: e.target.value as any})}>
                    <option value={UserRole.USER}>مستخدم عادي</option>
                    <option value={UserRole.ADMIN}>مدير النظام (Admin)</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => {
                    const uid = selectedUser.uid || `user_${Date.now()}`;
                    set(ref(db, `users/${uid}`), { ...selectedUser, uid });
                    if (!selectedUser.uid) {
                        // Init vacation balance for new users
                        set(ref(db, `vacationBalances/${uid}`), { annual: 21, casual: 7, sick: 15 });
                    }
                    setShowUserModal(false);
                  }}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg"
                >حفظ الحساب</button>
                <button onClick={() => setShowUserModal(false)} className="flex-1 bg-gray-100 py-4 rounded-xl font-bold hover:bg-gray-200">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
