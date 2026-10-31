export const yuan = (cents: number) =>
  '¥' + (cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const num = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n));

/** 相对时间：刚刚 / 3 小时前 / 2 天前 / 具体日期 */
export function fromNow(dateStr: string) {
  const t = new Date(dateStr.replace(' ', 'T')).getTime();
  if (Number.isNaN(t)) return dateStr;
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day} 天前`;
  return dateStr.slice(0, 10);
}

export const day = (d: string) => (d || '').slice(0, 10);

export const firstChar = (s: string) => (s || '·').trim().slice(0, 1);

export const STATUS_TEXT: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};
