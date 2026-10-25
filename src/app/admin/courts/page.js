'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { rupiah, pad, SPORTS } from '@/lib/utils';
import CourtImage from '@/components/CourtImage';

const EMPTY = { name: '', sport: 'Padel', city: '', surface: 'Grass', setting: 'Indoor', description: '', image_url: '', price_per_hour: 100000, weekend_price: '', open_hour: 8, close_hour: 22, rating: 4.5, is_active: true };

export default function CourtsAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('courts').select('*').order('created_at', { ascending: false });
    setRows(data || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    const p = {
      name: form.name, sport: form.sport, city: form.city, surface: form.surface, setting: form.setting,
      description: form.description, image_url: form.image_url || null,
      price_per_hour: Number(form.price_per_hour), weekend_price: form.weekend_price === '' || form.weekend_price === null ? null : Number(form.weekend_price),
      open_hour: Number(form.open_hour), close_hour: Number(form.close_hour), rating: Number(form.rating), is_active: form.is_active,
    };
    const { error } = form.id ? await supabase.from('courts').update(p).eq('id', form.id) : await supabase.from('courts').insert(p);
    setSaving(false);
    if (error) return setErr(error.message);
    setForm(null); load();
  };

  const remove = async (c) => {
    if (!confirm(`Hapus lapangan "${c.name}"?`)) return;
    const { error } = await supabase.from('courts').delete().eq('id', c.id);
    if (error) alert('Lapangan tidak dapat dihapus karena sudah memiliki reservasi. Nonaktifkan saja lapangan ini.');
    else load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Data Lapangan</h1><p className="text-sm text-neutral-400">Kelola lapangan, jadwal operasional, dan tarif.</p></div>
        <button onClick={() => { setErr(''); setForm({ ...EMPTY }); }} className="btn-primary"><Plus size={16} />Tambah</button>
      </div>

      {loading ? <div className="grid place-items-center py-16 text-neutral-500"><Loader2 className="animate-spin" /></div> : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {rows.map((c) => (
            <div key={c.id} className="card flex gap-3 p-3">
              <CourtImage src={c.image_url} alt={c.name} className="h-24 w-24 shrink-0 rounded-xl" />
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <p className="truncate font-bold">{c.name} {!c.is_active && <span className="ml-1 rounded-full bg-neutral-700 px-2 py-0.5 text-[10px]">Nonaktif</span>}</p>
                  <p className="text-xs text-neutral-400">{c.sport} · {c.city} · {c.setting}</p>
                  <p className="text-xs text-neutral-400">{pad(c.open_hour)} - {pad(c.close_hour === 24 ? 0 : c.close_hour)}</p>
                  <p className="text-sm font-bold">{rupiah(c.price_per_hour)}<span className="text-[10px] font-normal text-neutral-500"> /jam{c.weekend_price ? ` · weekend ${rupiah(c.weekend_price)}` : ''}</span></p>
                </div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => { setErr(''); setForm({ ...c, image_url: c.image_url || '', weekend_price: c.weekend_price ?? '' }); }} className="btn-ghost !px-3 !py-1.5 text-xs"><Pencil size={13} />Ubah</button>
                  <button onClick={() => remove(c)} className="btn-danger !px-3 !py-1.5 text-xs"><Trash2 size={13} />Hapus</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 backdrop-blur-sm sm:place-items-center">
          <form onSubmit={save} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-neutral-950 p-5 sm:max-w-2xl sm:rounded-3xl sm:p-7">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">{form.id ? 'Ubah Lapangan' : 'Tambah Lapangan'}</h2><button type="button" onClick={() => setForm(null)} className="text-neutral-400"><X /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label">Nama lapangan *</label><input required className="input" value={form.name} onChange={set('name')} /></div>
              <div><label className="label">Olahraga</label><select className="input" value={form.sport} onChange={set('sport')}>{SPORTS.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label className="label">Kota</label><input className="input" value={form.city} onChange={set('city')} /></div>
              <div><label className="label">Permukaan</label><input className="input" value={form.surface} onChange={set('surface')} placeholder="Grass / Vinyl / Parquet" /></div>
              <div><label className="label">Tipe</label><select className="input" value={form.setting} onChange={set('setting')}><option>Indoor</option><option>Outdoor</option></select></div>
              <div><label className="label">Tarif / jam (Rp) *</label><input required type="number" min="0" className="input" value={form.price_per_hour} onChange={set('price_per_hour')} /></div>
              <div><label className="label">Tarif akhir pekan (Rp)</label><input type="number" min="0" className="input" value={form.weekend_price} onChange={set('weekend_price')} placeholder="Kosongkan = sama" /></div>
              <div><label className="label">Jam buka</label><input type="number" min="0" max="23" className="input" value={form.open_hour} onChange={set('open_hour')} /></div>
              <div><label className="label">Jam tutup</label><input type="number" min="1" max="24" className="input" value={form.close_hour} onChange={set('close_hour')} /></div>
              <div><label className="label">Rating</label><input type="number" step="0.1" min="0" max="5" className="input" value={form.rating} onChange={set('rating')} /></div>
              <div><label className="label">URL gambar</label><input className="input" value={form.image_url} onChange={set('image_url')} placeholder="https://..." /></div>
              <div className="sm:col-span-2"><label className="label">Deskripsi</label><textarea rows={3} className="input" value={form.description || ''} onChange={set('description')} /></div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="h-4 w-4 accent-[#d7ff00]" />Aktif (tampil untuk pelanggan)</label>
            </div>
            {err && <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-xs text-red-400">{err}</p>}
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setForm(null)} className="btn-ghost">Batal</button><button disabled={saving} className="btn-primary">{saving ? <Loader2 size={16} className="animate-spin" /> : 'Simpan'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
