const pad = (n) => String(n).padStart(2, '0');

/** Today's date in the viewer's local timezone as YYYY-MM-DD. */
export const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Shifts a YYYY-MM-DD string by whole days. */
export const shiftDate = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const longDateFmt = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Accepts an ISO timestamp or YYYY-MM-DD; shown as e.g. "07 Jun 2026". */
export const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(String(value).length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(d.getTime()) ? '-' : dateFmt.format(d);
};

export const formatLongDate = (value) => {
  if (!value) return '-';
  const d = new Date(String(value).length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(d.getTime()) ? '-' : longDateFmt.format(d);
};

/** ISO timestamp -> YYYY-MM-DD for <input type="date">. */
export const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

/** "14:05" -> "2:05 PM" */
export const formatTime = (hhmm) => {
  if (!hhmm) return '-';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${pad(m)} ${suffix}`;
};

/** Hours worked between two HH:mm strings, e.g. "8h 15m". */
export const workedHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return '-';
  const [h1, m1] = checkIn.split(':').map(Number);
  const [h2, m2] = checkOut.split(':').map(Number);
  const minutes = h2 * 60 + m2 - (h1 * 60 + m1);
  if (minutes <= 0) return '-';
  return `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`;
};

export const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const relativeTime = (value) => {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
};

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
