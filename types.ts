
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface UserProfile {
  uid: string;
  name: string;
  code: string;
  phone: string;
  role: UserRole;
  password?: string;
  isOnline?: boolean;
  permissions?: {
    viewAllSales?: boolean;
    viewAllReports?: boolean;
    viewAllInventory?: boolean;
  };
}

export interface SaleItem {
  name: string;
  price: number;
  quantity: number;
}

export interface SaleRecord {
  id: string;
  userId: string;
  userName: string;
  market: string;
  items: SaleItem[];
  total: number;
  timestamp: number;
  date: string;
}

export interface InventoryRecord {
  id: string;
  userId: string;
  userName: string;
  market: string;
  items: { name: string; quantity: number }[];
  timestamp: number;
  date: string;
}

export interface CompetitorPriceRecord {
  id: string;
  userId: string;
  userName: string;
  market: string;
  company: string;
  items: { name: string; price: number }[];
  timestamp: number;
  date: string;
  ownerId: string; // ID of user who created this report
}

export interface VacationBalance {
  annual: number;
  casual: number;
  sick: number;
}

export interface VacationEntry {
  id: string;
  userId: string;
  userName: string;
  date: string;
  days: number;
  type: 'annual' | 'casual' | 'sick' | 'exams';
  timestamp: number;
}

export interface AppNotification {
  id: string;
  toUserId: string;
  fromUserName: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface AppSettings {
  appName: string;
  tickerText: string;
  tickerEnabled: boolean;
  whatsappNumber: string;
  styles: 'standard' | 'glass' | 'dark' | 'professional';
  sidebarItems: { [key: string]: boolean };
}
