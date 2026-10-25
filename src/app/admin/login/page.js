'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function Form() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(sp.get('e') ? 'Akun ini belum terdaftar sebagai staf.' : '');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setErr('Email atau kata sandi salah.');
    router.push('/admin');
  };

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6 md:p-8">
        <Link href="/" className="text-2xl font-extrabold">Sport<span className="text-brand">Slot</span></Link>
        <div><h1 className="text-lg font-bold">Masuk Staf</h1><p className="text-xs text-neutral-400">Khusus admin dan pemilik.</p></div>
        <div><label className="label">Email</label><input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label">Kata sandi</label><input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {err && <p className="rounded-xl bg-red-500/10 p-3 text-xs text-red-400">{err}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? <Loader2 size={16} className="animate-spin" /> : 'Masuk'}</button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><Form /></Suspense>;
}
