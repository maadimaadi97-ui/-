
import React, { useState } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../firebase';
import { UserProfile } from '../types';

const Login: React.FC<{ onLogin: (user: UserProfile) => void }> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) return;
    setLoading(true);
    setError('');

    try {
      // For demo purposes, we scan users node for matches (in real app, use Firebase Auth)
      const usersRef = ref(db, 'users');
      const snap = await get(usersRef);
      
      if (snap.exists()) {
        const users = Object.values(snap.val() as Record<string, UserProfile>);
        const found = users.find(u => (u.name === name || u.code === name) && u.password === password);
        
        if (found) {
          onLogin(found);
        } else if (name === 'admin' && password === 'admin') {
          onLogin({ uid: 'admin-1', name: 'المدير العام', code: 'ADMIN', role: 'admin' as any, phone: '' });
        } else {
          setError('خطأ في اسم المستخدم أو كلمة المرور');
        }
      } else if (name === 'admin' && password === 'admin') {
         onLogin({ uid: 'admin-1', name: 'المدير العام', code: 'ADMIN', role: 'admin' as any, phone: '' });
      } else {
        setError('لا توجد حسابات مسجلة. جرب admin/admin');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1964')] bg-cover bg-center">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[2.5rem] shadow-2xl relative animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-rose-500 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-5xl shadow-2xl shadow-rose-500/20 mb-6">
            <i className="fa-solid fa-flower text-white"></i>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">سوفت روز</h2>
          <p className="text-white/60 mt-2 font-medium">نظام التجارة الحديثة</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-white/70 px-2">اسم المستخدم أو الكود</label>
            <div className="relative">
              <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-white/30"></i>
              <input 
                type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-4 pl-12 text-white outline-none focus:ring-2 ring-indigo-500 transition-all font-medium"
                placeholder="أدخل الاسم"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-white/70 px-2">كلمة المرور</label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-white/30"></i>
              <input 
                type="password" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-4 pl-12 text-white outline-none focus:ring-2 ring-indigo-500 transition-all font-medium"
                placeholder="أدخل الرمز السري"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-rose-400 text-xs text-center font-bold bg-rose-400/10 py-2 rounded-lg">{error}</p>}

          <button 
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-right-to-bracket"></i>}
            <span>دخول النظام</span>
          </button>
        </form>

        <p className="mt-8 text-center text-white/30 text-[10px] uppercase tracking-widest font-bold">
          Soft Rose Modern Trade System
        </p>
      </div>
    </div>
  );
};

export default Login;
