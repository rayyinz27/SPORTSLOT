'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Trophy, CalendarCheck, Wallet, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { StaffContext } from '@/components/StaffContext';

const NAV = [
  { href: '/admin', label: 'Laporan', Icon: LayoutDashboard, roles: ['admin', 'owner'] },
  { href: '/admin/courts', label: 'Lapangan', Icon: Trophy, roles: ['admin'] },
  { href: '/admin/reservations', label: 'Reservasi', Icon: CalendarCheck, roles: ['admin'] },
  { href: '/admin/payments', label: 'Pembayaran', Icon: Wallet, roles: ['admin'] },
];

export default function AdminLayout({ children }) {
  const path = usePathname();
  const router = useRouter();
  const isLogin = path === '/admin/login';
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (isLogin) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace('/admin/login');
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (!p) { await supabase.auth.signOut(); return router.replace('/admin/login?e=1'); }
      setProfile(p);
    })();
  }, [isLogin, router]);

  useEffect(() => {
    if (profile && profile.role === 'owner' && path !== '/admin') router.replace('/admin');
  }, [profile, path, router]);

  const logout = async () => { await supabase.auth.signOut(); setProfile(null); router.replace('/admin/login'); };

  if (isLogin) return children;
  if (!profile) return <div className="grid min-h-screen place-items-center text-neutral-500"><Loader2 className="animate-spin" /></div>;

  const items = NAV.filter((n) => n.roles.includes(profile.role));
  const active = (h) => (h === '/admin' ? path === '/admin' : path.startsWith(h));

  return (
    <StaffContext.Provider value={{ profile }}>
      {/* Sidebar (desktop / tablet landscape) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/5 bg-black/60 p-5 lg:flex">
        <Link href="/" className="text-xl font-extrabold">Sport<span className="text-brand">Slot</span></Link>
        <p className="mt-1 text-xs text-neutral-500">Panel {profile.role === 'admin' ? 'Admin' : 'Pemilik'}</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {items.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition ${active(href) ? 'bg-brand text-black' : 'text-neutral-300 hover:bg-white/5'}`}><Icon size={18} />{label}</Link>
          ))}
        </nav>
        <div className="border-t border-white/5 pt-4 text-xs text-neutral-400">
          <p className="truncate font-semibold text-white">{profile.full_name || 'Staf'}</p>
          <button onClick={logout} className="mt-2 flex items-center gap-2 text-neutral-400 hover:text-white"><LogOut size={14} />Keluar</button>
        </div>
      </aside>

      {/* Top bar (mobile / tablet) */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-black/80 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-5 py-3">
          <Link href="/" className="text-lg font-extrabold">Sport<span className="text-brand">Slot</span></Link>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs text-neutral-400"><LogOut size={14} />Keluar</button>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none]">
          {items.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${active(href) ? 'bg-brand text-black' : 'bg-neutral-800 text-neutral-300'}`}><Icon size={14} />{label}</Link>
          ))}
        </nav>
      </header>

      <main className="px-5 py-6 lg:ml-60 lg:px-8 lg:py-8"><div className="mx-auto max-w-6xl">{children}</div></main>
    </StaffContext.Provider>
  );
}
