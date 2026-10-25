export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export const pad = (h) => String(h).padStart(2, '0') + ':00';

export const todayStr = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export const fmtDate = (s) =>
  new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const fmtShort = (s) =>
  new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export const fmtDateTime = (s) =>
  new Date(s).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const STATUS = {
  pending: { label: 'Menunggu Verifikasi', cls: 'bg-yellow-400/15 text-yellow-300' },
  verified: { label: 'Menunggu Pembayaran', cls: 'bg-sky-400/15 text-sky-300' },
  paid: { label: 'Lunas', cls: 'bg-brand/15 text-brand' },
  cancelled: { label: 'Dibatalkan', cls: 'bg-red-500/15 text-red-400' },
};

export const SPORTS = ['Padel', 'Futsal', 'Badminton', 'Tenis', 'Basket', 'Mini Soccer'];
