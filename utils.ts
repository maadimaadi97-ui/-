
import { SaleRecord } from './types';

/**
 * Calculates highest sales for the current month.
 */
export const getHighestMonthlySales = (sales: SaleRecord[]) => {
  if (!sales || sales.length === 0) return 0;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlySales = sales.filter(s => {
    const d = new Date(s.timestamp);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  if (monthlySales.length === 0) return 0;
  return Math.max(...monthlySales.map(s => s.total));
};

/**
 * Formats a date for display.
 */
export const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('ar-EG');
};

/**
 * Excel-like export utility.
 */
export const exportToCSV = (filename: string, data: any[][]) => {
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
    + data.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
