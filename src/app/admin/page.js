'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { rupiah, pad, fmtShort, STATUS } from '@/lib/utils';

const ym = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), d.getDate(), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()]; };

export default function ReportPage() {
  const [y, m, , last] = ym();
  const [from, setFrom] = useState(`${y}-${m}-01`);
  const [to, setTo] = useState(`${y}-${m}-${last}`);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('reservations').select('*, courts(name)')
      .gte('booking_date', from).lte('booking_date', to).order('booking_date', { ascending: false }).order('start_hour');
    setRows(data || []); setLoading(false);
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  const s = useMemo(() => {
    const paid = rows.filter((r) => r.status === 'paid');
    const per = {};
    rows.filter((r) => r.status !== 'cancelled').forEach((r) => {
      const n = r.courts?.name || '-';
      per[n] = per[n] || { count: 0, revenue: 0 };
      per[n].count++; if (r.status === 'paid') per[n].revenue += r.total_price;
    });
    return {
      total: rows.length, paid: paid.length,
      waiting: rows.filter((r) => r.status === 'pending' || r.status === 'verified').length,
      revenue: paid.reduce((a, r) => a + r.total_price, 0),
      per: Object.entries(per).sort((a, b) => b[1].revenue - a[1].revenue),
    };
  }, [rows]);
  const maxRev = Math.max(1, ...s.per.map(([, v]) => v.revenue));

  const exportCsv = () => {
    const head = ['Kode', 'Tanggal', 'Lapangan', 'Jam', 'Pemesan', 'Kontak', 'Status', 'Total'];
    const body = rows.map((r) => [r.code, r.booking_date, r.courts?.name, `${pad(r.start_hour)}-${pad(r.end_hour)}`, r.customer_name, r.customer_phone, STATUS[r.status].label, r.total_price]);
    const csv = [head, ...body].map((l) => l.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `laporan-${from}_${to}.csv`; a.click();
  };

  const Stat = ({ label, value, accent }) => (
    <div className="card p-4 md:p-5"><p className="text-xs text-neutral-400">{label}</p><p className={`mt-1 text-xl font-extrabold md:text-2xl ${accent ? 'text-brand' : ''}`}>{value}</p></div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-2xl font-extrabold">Laporan</h1><p className="text-sm text-neutral-400">Ringkasan reservasi dan pendapatan.</p></div>
        <div className="flex flex-wrap items-end gap-2">
          <div><label className="label">Dari</label><input type="date" className="input !py-2" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label className="label">Sampai</label><input type="date" className="input !py-2" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <button onClick={exportCsv} disabled={!rows.length} className="btn-ghost !py-2.5"><Download size={16} />CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total reservasi" value={s.total} />
        <Stat label="Lunas" value={s.paid} />
        <Stat label="Menunggu" value={s.waiting} />
        <Stat label="Pendapatan" value={rupiah(s.revenue)} accent />
      </div>

      {loading ? <div className="grid place-items-center py-16 text-neutral-500"><Loader2 className="animate-spin" /></div> : (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="card space-y-4 p-5 xl:col-span-1">
            <h2 className="font-bold">Pendapatan per lapangan</h2>
            {s.per.length === 0 && <p className="text-sm text-neutral-500">Belum ada data.</p>}
            {s.per.map(([n, v]) => (
              <div key={n}>
                <div className="flex justify-between text-xs"><span className="font-medium">{n}</span><span className="text-neutral-400">{v.count}x · {rupiah(v.revenue)}</span></div>
                <div className="mt-1.5 h-2 rounded-full bg-neutral-800"><div className="h-2 rounded-full bg-brand" style={{ width: `${(v.revenue / maxRev) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="card overflow-x-auto xl:col-span-2">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-neutral-500"><tr><th className="p-4">Tanggal</th><th>Lapangan</th><th>Jam</th><th>Pemesan</th><th>Status</th><th className="pr-4 text-right">Total</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-white/5">
                    <td className="p-4 whitespace-nowrap">{fmtShort(r.booking_date)}</td><td>{r.courts?.name}</td><td className="whitespace-nowrap">{pad(r.start_hour)}-{pad(r.end_hour)}</td><td>{r.customer_name}</td>
                    <td><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span></td>
                    <td className="pr-4 text-right font-semibold">{rupiah(r.total_price)}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Tidak ada data pada periode ini.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
