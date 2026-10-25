'use client';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Check, X, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { rupiah, pad, fmtShort, STATUS } from '@/lib/utils';

const TABS = [['all', 'Semua'], ['pending', 'Menunggu Verifikasi'], ['verified', 'Menunggu Bayar'], ['paid', 'Lunas'], ['cancelled', 'Dibatalkan']];

export default function ReservationsPage() {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('reservations').select('*, courts(name)').order('created_at', { ascending: false });
    setRows(data || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const update = async (r, patch, msg) => {
    if (msg && !confirm(msg)) return;
    setBusyId(r.id); setErr('');
    const { error } = await supabase.from('reservations').update(patch).eq('id', r.id);
    setBusyId(null);
    if (error) setErr(error.message); else load();
  };

  const list = tab === 'all' ? rows : rows.filter((r) => r.status === tab);

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-extrabold">Reservasi</h1><p className="text-sm text-neutral-400">Verifikasi reservasi masuk. Konfirmasi otomatis tampil pada halaman Cek Reservasi pelanggan.</p></div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${tab === k ? 'bg-brand text-black' : 'bg-neutral-800 text-neutral-300'}`}>
            {l}{k !== 'all' && ` (${rows.filter((r) => r.status === k).length})`}
          </button>
        ))}
      </div>
      {err && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{err}</p>}
      {loading ? <div className="grid place-items-center py-16 text-neutral-500"><Loader2 className="animate-spin" /></div> : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {list.length === 0 && <p className="card col-span-full p-8 text-center text-sm text-neutral-500">Tidak ada reservasi.</p>}
          {list.map((r) => (
            <div key={r.id} className="card space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-xs font-semibold text-neutral-500">{r.code}</p><p className="font-bold">{r.courts?.name}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
              </div>
              <div className="text-sm text-neutral-300">
                <p>{fmtShort(r.booking_date)} · {pad(r.start_hour)}-{pad(r.end_hour)}</p>
                <p>{r.customer_name}</p>
                <p className="flex items-center gap-1 text-xs text-neutral-500"><Phone size={11} />{r.customer_phone}{r.customer_email ? ` · ${r.customer_email}` : ''}</p>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <p className="font-extrabold">{rupiah(r.total_price)}</p>
                <div className="flex gap-2">
                  {r.status === 'pending' && <button disabled={busyId === r.id} onClick={() => update(r, { status: 'verified', verified_at: new Date().toISOString() })} className="btn-primary !px-4 !py-2"><Check size={14} />Verifikasi</button>}
                  {(r.status === 'pending' || r.status === 'verified') && <button disabled={busyId === r.id} onClick={() => update(r, { status: 'cancelled' }, `Batalkan reservasi ${r.code}?`)} className="btn-danger"><X size={14} />Batalkan</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
