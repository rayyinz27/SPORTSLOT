'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, Star, MapPin, Loader2, Ticket } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SPORTS } from '@/lib/utils';
import CourtCard from '@/components/CourtCard';
import CourtImage from '@/components/CourtImage';

export default function HomePage() {
  const router = useRouter();
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [sport, setSport] = useState('Semua');
  const [setting, setSetting] = useState('Semua');
  const [showFilter, setShowFilter] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    supabase.from('courts').select('*').eq('is_active', true).order('rating', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError('Gagal memuat data lapangan. Pastikan konfigurasi Supabase sudah benar.');
        setCourts(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => courts.filter((c) => {
    const t = (c.name + ' ' + c.city + ' ' + c.sport).toLowerCase();
    return t.includes(q.toLowerCase()) && (sport === 'Semua' || c.sport === sport) && (setting === 'Semua' || c.setting === setting);
  }), [courts, q, sport, setting]);

  const featured = courts.slice(0, 5);
  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${active ? 'bg-brand text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}>{children}</button>
  );

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="md:grid md:grid-cols-2 md:items-end md:gap-10 md:py-4">
        <div>
          <p className="text-sm text-neutral-400">Halo 👋</p>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Mau main di mana <span className="text-brand">hari ini?</span>
          </h1>
          <p className="mt-3 hidden max-w-md text-neutral-400 md:block">Cek jadwal kosong, pesan lapangan, dan bayar online tanpa takut jadwal bentrok.</p>
        </div>
        <div className="mt-5 md:mt-0">
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-neutral-900 px-4 ring-1 ring-white/5 focus-within:ring-brand/60">
              <Search size={18} className="text-neutral-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari lapangan atau kota..." className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-neutral-500" />
            </div>
            <button onClick={() => setShowFilter((s) => !s)} aria-label="Filter" className={`grid h-12 w-12 place-items-center rounded-full ${showFilter ? 'bg-white text-black' : 'bg-brand text-black'}`}><SlidersHorizontal size={18} /></button>
          </div>
          {showFilter && (
            <div className="card mt-3 space-y-3 p-4">
              <div><p className="label">Olahraga</p><div className="flex flex-wrap gap-2">{['Semua', ...SPORTS].map((s) => <Pill key={s} active={sport === s} onClick={() => setSport(s)}>{s}</Pill>)}</div></div>
              <div><p className="label">Tipe</p><div className="flex gap-2">{['Semua', 'Indoor', 'Outdoor'].map((s) => <Pill key={s} active={setting === s} onClick={() => setSetting(s)}>{s}</Pill>)}</div></div>
            </div>
          )}
        </div>
      </section>

      {error && <p className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-bold md:text-lg">Lapangan Pilihan</h2>
          <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0 [scrollbar-width:none]">
            {featured.map((c) => (
              <Link key={c.id} href={`/courts/${c.id}`} className="group relative h-48 w-72 shrink-0 snap-start overflow-hidden rounded-3xl md:h-56 md:w-96">
                <CourtImage src={c.image_url} alt={c.name} className="h-full w-full transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-lg font-bold">{c.name}</p>
                  <p className="flex items-center gap-3 text-xs text-neutral-300">
                    <span className="flex items-center gap-1"><Star size={12} className="fill-brand text-brand" />{Number(c.rating).toFixed(1)}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} />{c.city}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* List */}
      <section id="lapangan">
        <h2 className="mb-3 text-base font-bold md:text-lg">Semua Lapangan</h2>
        {loading ? (
          <div className="grid place-items-center py-16 text-neutral-500"><Loader2 className="animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="card p-8 text-center text-sm text-neutral-400">Tidak ada lapangan yang cocok.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((c) => <CourtCard key={c.id} court={c} />)}</div>
        )}
      </section>

      {/* Cek reservasi */}
      <section className="card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand/15 text-brand"><Ticket size={20} /></span>
          <div><p className="font-semibold">Sudah punya kode reservasi?</p><p className="text-xs text-neutral-400">Cek status, bayar, dan unduh invoice.</p></div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) router.push(`/reservasi?kode=${encodeURIComponent(code.trim())}`); }} className="flex gap-2 md:w-96">
          <input className="input" placeholder="RSV-XXXXXXXX" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn-primary shrink-0">Cek</button>
        </form>
      </section>
    </div>
  );
}
