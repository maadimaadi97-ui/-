
import React, { useState, useEffect } from 'react';
import { ref, onValue, set, onDisconnect, push } from 'firebase/database';
import { db } from './firebase';
import { UserProfile, UserRole, AppSettings, AppNotification } from './types';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import DailySales from './components/DailySales';
import SalesLog from './components/SalesLog';
import InventoryRegistration from './components/InventoryRegistration';
import InventoryLog from './components/InventoryLog';
import CompetitorPrices from './components/CompetitorPrices';
import CompetitorReports from './components/CompetitorReports';
import VacationBalanceView from './components/VacationBalance';
import Settings from './components/Settings';
import { THEMES } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    appName: "Soft Rose Modern Trade",
    tickerText: "أهلاً بكم في سوفت روز",
    tickerEnabled: true,
    whatsappNumber: "",
    styles: 'professional',
    sidebarItems: {}
  });
  const [activeTab, setActiveTab] = useState('daily-sales');
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Connection Monitoring
  useEffect(() => {
    const connectedRef = ref(db, ".info/connected");
    onValue(connectedRef, (snap) => {
      setIsConnected(snap.val() === true);
    });

    const settingsRef = ref(db, 'appSettings');
    onValue(settingsRef, (snap) => {
      if (snap.exists()) setSettings(snap.val());
    });
  }, []);

  // Presence logic
  useEffect(() => {
    if (user) {
      const userStatusRef = ref(db, `users/${user.uid}/isOnline`);
      set(userStatusRef, true);
      onDisconnect(userStatusRef).set(false);

      // Listen for notifications
      const notifRef = ref(db, `notifications/${user.uid}`);
      onValue(notifRef, (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          setNotifications(Object.values(data));
        } else {
          setNotifications([]);
        }
      });
    }
  }, [user]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const themeClass = THEMES[settings.styles as keyof typeof THEMES] || THEMES.professional;

  const renderContent = () => {
    switch (activeTab) {
      case 'daily-sales': return <DailySales user={user} />;
      case 'sales-log': return <SalesLog user={user} />;
      case 'inventory-reg': return <InventoryRegistration user={user} />;
      case 'inventory-log': return <InventoryLog user={user} />;
      case 'competitor-prices': return <CompetitorPrices user={user} />;
      case 'competitor-reports': return <CompetitorReports user={user} />;
      case 'vacation': return <VacationBalanceView user={user} />;
      case 'settings': return user.role === UserRole.ADMIN ? <Settings user={user} /> : <div className="p-10 text-center font-bold">غير مصرح لك بدخول هذا القسم</div>;
      default: return <DailySales user={user} />;
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 flex flex-col md:flex-row ${themeClass}`}>
      {/* Sidebar */}
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        settings={settings}
        onLogout={() => {
          set(ref(db, `users/${user.uid}/isOnline`), false);
          setUser(null);
        }}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="p-4 flex flex-col gap-2 bg-white/10 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{settings.appName}</h1>
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`} title={isConnected ? 'متصل' : 'غير متصل'}></div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowNotificationModal(true)}
                className="relative p-2 rounded-full hover:bg-white/10 transition"
              >
                <i className="fa-solid fa-bell text-lg"></i>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-[10px] flex items-center justify-center rounded-full text-white">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              {settings.whatsappNumber && (
                <a 
                  href={`https://wa.me/${settings.whatsappNumber}`} 
                  target="_blank"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-green-700 transition"
                >
                  <i className="fa-brands fa-whatsapp text-lg"></i>
                  <span>تواصل واتساب</span>
                </a>
              )}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-bold">{user.name}</span>
                <span className="text-[10px] opacity-70 uppercase tracking-widest">{user.role}</span>
              </div>
            </div>
          </div>

          {/* Ticker */}
          {settings.tickerEnabled && (
            <div className="ticker-wrap rounded-md bg-white/5 border border-white/10">
              <div className="ticker text-sm text-yellow-300 font-semibold px-4">
                {settings.tickerText}
              </div>
            </div>
          )}
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 overflow-y-auto">
          {renderContent()}
        </main>

        <footer className="p-2 text-center text-[10px] opacity-50 border-t border-white/5">
          مع تحيات المطور Amir Lamay
        </footer>
      </div>

      {/* Notifications Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white">
              <h3 className="font-bold flex items-center gap-2">
                <i className="fa-solid fa-message"></i> الرسائل والاشعارات
              </h3>
              <button onClick={() => setShowNotificationModal(false)} className="text-white hover:opacity-70">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-10 opacity-50 italic">لا توجد رسائل حالياً</div>
              ) : (
                notifications.slice().reverse().map(n => (
                  <div key={n.id} className={`p-4 rounded-xl border ${n.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-indigo-600">من: {String(n.fromUserName)}</span>
                      <span className="text-[10px] opacity-50">{new Date(n.timestamp).toLocaleString('ar-EG')}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{String(n.text)}</p>
                    <div className="mt-2 flex gap-2">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(String(n.text));
                          alert('تم نسخ الرسالة');
                        }}
                        className="text-[10px] text-blue-600 underline"
                      >نسخ</button>
                      {!n.read && (
                        <button 
                          onClick={() => set(ref(db, `notifications/${user.uid}/${n.id}/read`), true)}
                          className="text-[10px] text-green-600 font-bold"
                        >تمييز كمقروء</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
