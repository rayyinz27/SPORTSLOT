'use client';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { rupiah, fmtDateTime, fmtShort, pad } from '@/lib/utils';

export default function PaymentsPage() {
  const [pays, setPays] = useState([]);
  const [unpaid, setUnpaid] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([
        supabase.from('payments').select('*, reservations(code, customer_name, courts(name))').order('paid_at', { ascending: false }),
        supabase.from('reservations').select('*, courts(name)').eq('status', 'verified').order('created_at', { ascending: false }),
      ]);
      setPays(a.data || []); setUnpaid(b.data || []); setLoading(false);
    })();
  }, []);

  if (loading) return <div className="grid place-items-center py-24 text-neutral-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-extrabold">Status Pembayaran</h1><p className="text-sm text-neutral-400">Pantau tagihan yang belum dibayar dan pembayaran yang sudah masuk.</p></div>

      <section>
        <h2 className="mb-3 font-bold">Menunggu pembayaran <span className="text-sm font-normal text-neutral-500">({unpaid.length})</span></h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {unpaid.length === 0 && <p className="card col-span-full p-6 text-center text-sm text-neutral-500">Tidak ada tagihan tertunda.</p>}
          {unpaid.map((r) => (
            <div key={r.id} className="card flex items-center justify-between p-4">
              <div className="text-sm"><p className="text-xs text-neutral-500">{r.code}</p><p className="font-semibold">{r.customer_name}</p><p className="text-xs text-neutral-400">{r.courts?.name} · {fmtShort(r.booking_date)} · {pad(r.start_hour)}-{pad(r.end_hour)}</p></div>
              <p className="font-extrabold text-sky-300">{rupiah(r.total_price)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-bold">Pembayaran masuk <span className="text-sm font-normal text-neutral-500">({pays.length})</span></h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-neutral-500"><tr><th className="p-4">Invoice</th><th>Reservasi</th><th>Pemesan</th><th>Metode</th><th>Waktu</th><th className="pr-4 text-right">Jumlah</th></tr></thead>
            <tbody>
              {pays.map((p) => (
                <tr key={p.id} className="border-t border-white/5">
                  <td className="p-4 font-semibold">{p.invoice_no}</td><td>{p.reservations?.code}</td><td>{p.reservations?.customer_name}</td><td>{p.method}</td>
                  <td className="whitespace-nowrap text-neutral-400">{fmtDateTime(p.paid_at)}</td><td className="pr-4 text-right font-bold text-brand">{rupiah(p.amount)}</td>
                </tr>
              ))}
              {pays.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Belum ada pembayaran.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
