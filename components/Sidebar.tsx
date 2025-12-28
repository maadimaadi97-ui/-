
import React from 'react';
import { UserProfile, UserRole, AppSettings } from '../types';

interface SidebarProps {
  user: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  settings: AppSettings;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, onLogout, settings }) => {
  const menuItems = [
    { id: 'daily-sales', label: 'المبيعات اليومية', icon: 'fa-cart-plus', adminOnly: false },
    { id: 'sales-log', label: 'سجل المبيعات', icon: 'fa-receipt', adminOnly: false, visibilityKey: 'viewAllSales' },
    { id: 'inventory-reg', label: 'تسجيل المخزون', icon: 'fa-boxes-stacked', adminOnly: false },
    { id: 'inventory-log', label: 'سجل المخزون', icon: 'fa-clipboard-list', adminOnly: false, visibilityKey: 'viewAllInventory' },
    { id: 'competitor-prices', label: 'أسعار المنافسين', icon: 'fa-tags', adminOnly: false },
    { id: 'competitor-reports', label: 'تقارير المنافسين', icon: 'fa-chart-line', adminOnly: false, visibilityKey: 'viewAllReports' },
    { id: 'vacation', label: 'رصيد الإجازات', icon: 'fa-calendar-day', adminOnly: false },
    { id: 'settings', label: 'الإعدادات', icon: 'fa-gears', adminOnly: true },
  ];

  const visibleItems = menuItems.filter(item => {
    if (item.adminOnly && user.role !== UserRole.ADMIN) return false;
    
    // Check global admin-defined visibility in settings
    if (settings.sidebarItems && settings.sidebarItems[item.id] === false && user.role !== UserRole.ADMIN) {
        return false;
    }

    return true;
  });

  return (
    <nav className="w-full md:w-72 bg-white/5 backdrop-blur-xl border-l border-white/10 flex flex-col shrink-0">
      <div className="p-6 text-center border-b border-white/5">
        <div className="w-20 h-20 bg-gradient-to-tr from-rose-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-4xl shadow-xl shadow-indigo-500/20 mb-3">
          <i className="fa-solid fa-rose text-white"></i>
        </div>
        <h2 className="text-xl font-black tracking-tight">{settings.appName}</h2>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {visibleItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group
              ${activeTab === item.id 
                ? 'bg-white text-indigo-900 shadow-lg shadow-white/10 scale-[1.02] font-bold' 
                : 'hover:bg-white/10 text-white/70 hover:text-white'}`}
          >
            <i className={`fa-solid ${item.icon} text-lg transition-transform group-hover:scale-110`}></i>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <i className="fa-solid fa-power-off text-lg"></i>
          <span className="text-sm font-bold">تسجيل الخروج</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
