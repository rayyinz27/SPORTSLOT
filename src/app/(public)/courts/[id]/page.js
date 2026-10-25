'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Star, Loader2, Layers, Sun, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { rupiah, pad, todayStr, fmtDate } from '@/lib/utils';
import CourtImage from '@/components/CourtImage';

export default function CourtDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [court, setCourt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayStr());
  const [booked, setBooked] = useState(new Set());
  const [sel, setSel] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    supabase.from('courts').select('*').eq('id', id).maybeSingle().then(({ data }) => { setCourt(data); setLoading(false); });
  }, [id]);

  useEffect(() => {
    setSel([]);
    supabase.rpc('get_booked_slots', { p_court: id, p_date: date }).then(({ data }) => {
      const s = new Set();
      (data || []).forEach((r) => { for (let h = r.start_hour; h < r.end_hour; h++) s.add(h); });
      setBooked(s);
    });
  }, [id, date]);

  if (loading) return <div className="grid place-items-center py-24 text-neutral-500"><Loader2 className="animate-spin" /></div>;
  if (!court) return <p className="card p-8 text-center text-neutral-400">Lapangan tidak ditemukan. <Link href="/" className="text-brand">Kembali</Link></p>;

  const hours = Array.from({ length: court.close_hour - court.open_hour }, (_, i) => court.open_hour + i);
  const now = new Date();
  const isToday = date === todayStr();
  const isPast = (h) => isToday && h <= now.getHours();
  const dow = new Date(date + 'T00:00:00').getDay();
  const weekend = dow === 0 || dow === 6;
  const rate = weekend && court.weekend_price ? court.weekend_price : court.price_per_hour;
  const total = rate * sel.length;
  const start = sel.length ? Math.min(...sel) : null;
  const end = sel.length ? Math.max(...sel) + 1 : null;

  const toggle = (h) => {
    if (sel.includes(h)) {
      const mn = Math.min(...sel), mx = Math.max(...sel);
      setSel(h === mn || h === mx ? sel.filter((x) => x !== h) : [h]);
    } else if (!sel.length) setSel([h]);
    else if (h === Math.max(...sel) + 1 || h === Math.min(...sel) - 1) setSel([...sel, h]);
    else setSel([h]);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!sel.length) return setErr('Pilih minimal satu jam terlebih dahulu.');
    setBusy(true);
    const { data, error } = await supabase.rpc('create_reservation', {
      p_court: id, p_date: date, p_start: start, p_end: end,
      p_name: form.name, p_phone: form.phone, p_email: form.email || null,
    });
    setBusy(false);
    if (error) return setErr(error.message);
    router.push(`/reservasi?kode=${data.code}`);
  };

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white"><ArrowLeft size={16} />Kembali</Link>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CourtImage src={court.image_url} alt={court.name} className="h-56 w-full rounded-3xl sm:h-72 lg:h-96" />
          <div className="mt-5 flex items-start justify-between gap-3">
            <h1 className="text-2xl font-extrabold md:text-3xl">{court.name}</h1>
            <span className="flex items-center gap-1 text-sm"><Star size={14} className="fill-yellow-400 text-yellow-400" />{Number(court.rating).toFixed(2)}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
            <span className="chip"><MapPin size={12} />{court.city}</span>
            <span className="chip"><Layers size={12} />{court.surface}</span>
            <span className="chip"><Sun size={12} />{court.setting}</span>
            <span className="chip"><Clock size={12} />{pad(court.open_hour)} - {pad(court.close_hour === 24 ? 0 : court.close_hour)}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">{court.description}</p>
          <p className="mt-4 text-2xl font-extrabold">{rupiah(court.price_per_hour)} <span className="text-xs font-normal text-neutral-500">/ jam</span></p>
          {court.weekend_price && <p className="text-xs text-neutral-500">Akhir pekan: {rupiah(court.weekend_price)} / jam</p>}
        </div>

        {/* Booking panel */}
        <form onSubmit={submit} className="card space-y-5 p-5 lg:sticky lg:top-24 lg:col-span-2 lg:self-start">
          <div>
            <label className="label">Pilih tanggal</label>
            <input type="date" min={todayStr()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="input" />
            <p className="mt-1.5 text-xs text-neutral-500">{fmtDate(date)}{weekend && court.weekend_price ? ' · tarif akhir pekan' : ''}</p>
          </div>

          <div>
            <label className="label">Pilih jam (bisa lebih dari satu jam berurutan)</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {hours.map((h) => {
                const dis = booked.has(h) || isPast(h);
                const on = sel.includes(h);
                return (
                  <button key={h} type="button" disabled={dis} onClick={() => toggle(h)}
                    className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition ${on ? 'bg-brand text-black' : dis ? 'cursor-not-allowed bg-neutral-900 text-neutral-600 line-through' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}>
                    {pad(h)}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex gap-4 text-[11px] text-neutral-500">
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-brand" />Dipilih</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-neutral-700" />Tersedia</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-neutral-900 ring-1 ring-white/10" />Terisi / lewat</span>
            </div>
          </div>

          <div className="space-y-3">
            <div><label className="label">Nama pemesan *</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" /></div>
            <div><label className="label">No. HP / WhatsApp *</label><input required className="input" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" /></div>
            <div><label className="label">Email (opsional)</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" /></div>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div>
              <p className="text-xs text-neutral-400">{sel.length ? `${pad(start)} - ${pad(end)} (${sel.length} jam)` : 'Belum ada jam dipilih'}</p>
              <p className="text-xl font-extrabold">{rupiah(total)}</p>
            </div>
          </div>
          {err && <p className="rounded-xl bg-red-500/10 p-3 text-xs text-red-400">{err}</p>}
          <button disabled={busy} className="btn-primary w-full py-4 text-base">{busy ? <Loader2 size={18} className="animate-spin" /> : 'Buat Reservasi'}</button>
          <p className="text-center text-[11px] text-neutral-500">Reservasi akan diverifikasi admin, lalu Anda dapat melakukan pembayaran.</p>
        </form>
      </div>
    </div>
  );
}
