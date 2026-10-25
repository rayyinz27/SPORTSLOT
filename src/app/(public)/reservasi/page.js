'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2, Check, Printer, Wallet, QrCode, Landmark, Smartphone, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { rupiah, pad, fmtDate, fmtDateTime, STATUS } from '@/lib/utils';

const METHODS = [
  { v: 'QRIS', Icon: QrCode }, { v: 'Virtual Account', Icon: Landmark },
  { v: 'E-Wallet', Icon: Smartphone }, { v: 'Transfer Bank', Icon: CreditCard },
];

function Content() {
  const router = useRouter();
  const params = useSearchParams();
  const kode = params.get('kode') || '';
  const [input, setInput] = useState(kode);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [method, setMethod] = useState('QRIS');
  const [paying, setPaying] = useState(false);

  const load = useCallback(async (c) => {
    if (!c) return;
    setLoading(true); setErr('');
    const { data, error } = await supabase.rpc('get_reservation', { p_code: c });
    setLoading(false);
    if (error) setErr(error.message);
    else if (!data) { setData(null); setErr('Reservasi dengan kode tersebut tidak ditemukan.'); }
    else setData(data);
  }, []);

  useEffect(() => { setInput(kode); if (kode) load(kode); else setData(null); }, [kode, load]);

  const pay = async () => {
    setPaying(true); setErr('');
    const { data: d, error } = await supabase.rpc('pay_reservation', { p_code: data.code, p_method: method });
    setPaying(false);
    if (error) setErr(error.message); else setData(d);
  };

  const step = data ? { pending: 0, verified: 1, paid: 2, cancelled: -1 }[data.status] : 0;
  const steps = ['Reservasi dibuat', 'Diverifikasi admin', 'Lunas'];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">Cek <span className="text-brand">Reservasi</span></h1>
        <p className="mt-1 text-sm text-neutral-400">Masukkan kode reservasi untuk melihat status, membayar, dan mengunduh invoice.</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); input.trim() && router.push(`/reservasi?kode=${encodeURIComponent(input.trim())}`); }} className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-neutral-900 px-4 ring-1 ring-white/5 focus-within:ring-brand/60">
          <Search size={18} className="text-neutral-500" />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="RSV-XXXXXXXX" className="w-full bg-transparent py-3.5 text-sm uppercase outline-none placeholder:normal-case placeholder:text-neutral-500" />
        </div>
        <button className="btn-primary">Cek</button>
      </form>

      {loading && <div className="grid place-items-center py-10 text-neutral-500"><Loader2 className="animate-spin" /></div>}
      {err && <p className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">{err}</p>}

      {data && !loading && (
        <>
          <div className="card space-y-5 p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs text-neutral-500">Kode reservasi</p><p className="text-xl font-extrabold tracking-wide">{data.code}</p></div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${STATUS[data.status].cls}`}>{STATUS[data.status].label}</span>
            </div>

            {step >= 0 && (
              <div className="flex items-center">
                {steps.map((s, i) => (
                  <div key={s} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${i <= step ? 'bg-brand text-black' : 'bg-neutral-800 text-neutral-500'}`}>{i < step || (i === 2 && step === 2) ? <Check size={14} /> : i + 1}</span>
                      <span className="w-20 text-center text-[10px] text-neutral-400 sm:w-auto">{s}</span>
                    </div>
                    {i < steps.length - 1 && <div className={`mx-2 mb-5 h-0.5 flex-1 ${i < step ? 'bg-brand' : 'bg-neutral-800'}`} />}
                  </div>
                ))}
              </div>
            )}

            <dl className="grid gap-4 border-t border-white/5 pt-5 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-neutral-500">Lapangan</dt><dd className="font-semibold">{data.court_name} · {data.court_city}</dd></div>
              <div><dt className="text-xs text-neutral-500">Tanggal</dt><dd className="font-semibold">{fmtDate(data.booking_date)}</dd></div>
              <div><dt className="text-xs text-neutral-500">Jam</dt><dd className="font-semibold">{pad(data.start_hour)} - {pad(data.end_hour)} ({data.end_hour - data.start_hour} jam)</dd></div>
              <div><dt className="text-xs text-neutral-500">Pemesan</dt><dd className="font-semibold">{data.customer_name} · {data.customer_phone}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-neutral-500">Total tagihan</dt><dd className="text-2xl font-extrabold">{rupiah(data.total_price)}</dd></div>
            </dl>

            {data.status === 'pending' && <p className="rounded-xl bg-yellow-400/10 p-3 text-xs text-yellow-300">Reservasi Anda sedang menunggu verifikasi admin. Simpan kode di atas dan cek kembali beberapa saat lagi.</p>}
            {data.status === 'verified' && <p className="rounded-xl bg-sky-400/10 p-3 text-xs text-sky-300">✅ Konfirmasi: reservasi Anda telah diverifikasi{data.verified_at ? ` pada ${fmtDateTime(data.verified_at)}` : ''}. Silakan selesaikan pembayaran.</p>}
            {data.status === 'cancelled' && <p className="rounded-xl bg-red-500/10 p-3 text-xs text-red-400">Reservasi ini dibatalkan. Silakan buat reservasi baru.</p>}
          </div>

          {data.status === 'verified' && (
            <div className="card space-y-4 p-5 md:p-6">
              <h2 className="flex items-center gap-2 font-bold"><Wallet size={18} className="text-brand" />Pembayaran</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {METHODS.map(({ v, Icon }) => (
                  <button key={v} onClick={() => setMethod(v)} className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition ${method === v ? 'border-brand bg-brand/10 text-brand' : 'border-white/10 bg-neutral-900 text-neutral-300'}`}><Icon size={20} />{v}</button>
                ))}
              </div>
              <button onClick={pay} disabled={paying} className="btn-primary w-full py-4 text-base">{paying ? <Loader2 className="animate-spin" size={18} /> : `Bayar ${rupiah(data.total_price)}`}</button>
              <p className="text-center text-[11px] text-neutral-500">Pembayaran diproses melalui layanan pembayaran pihak ketiga (disimulasikan pada versi tugas ini).</p>
            </div>
          )}

          {data.payment && (
            <div id="invoice" className="card space-y-4 p-5 md:p-6">
              <div className="flex items-start justify-between">
                <div><p className="text-xs text-neutral-500">INVOICE</p><p className="text-lg font-extrabold">{data.payment.invoice_no}</p></div>
                <p className="text-xl font-extrabold">Sport<span className="text-brand">Slot</span></p>
              </div>
              <div className="grid gap-3 border-y border-white/5 py-4 text-sm sm:grid-cols-2">
                <div><span className="text-xs text-neutral-500">Dibayar oleh</span><p className="font-semibold">{data.customer_name}</p></div>
                <div><span className="text-xs text-neutral-500">Tanggal bayar</span><p className="font-semibold">{fmtDateTime(data.payment.paid_at)}</p></div>
                <div><span className="text-xs text-neutral-500">Metode</span><p className="font-semibold">{data.payment.method}</p></div>
                <div><span className="text-xs text-neutral-500">Ref. gateway</span><p className="font-semibold">{data.payment.gateway_ref}</p></div>
              </div>
              <div className="flex justify-between text-sm"><span>{data.court_name} · {fmtDate(data.booking_date)} · {pad(data.start_hour)}-{pad(data.end_hour)}</span><span className="font-bold">{rupiah(data.payment.amount)}</span></div>
              <div className="flex items-center justify-between"><span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-bold text-brand">LUNAS</span>
                <button onClick={() => window.print()} className="btn-ghost print:hidden"><Printer size={16} />Cetak / Simpan PDF</button></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ReservasiPage() {
  return <Suspense fallback={<div className="grid place-items-center py-24 text-neutral-500"><Loader2 className="animate-spin" /></div>}><Content /></Suspense>;
}
