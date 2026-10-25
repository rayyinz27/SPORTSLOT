'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarCheck, UserCog } from 'lucide-react';

const items = [
  { href: '/', label: 'Beranda', Icon: Home },
  { href: '/reservasi', label: 'Reservasi', Icon: CalendarCheck },
  { href: '/admin', label: 'Admin', Icon: UserCog },
];

const Logo = () => (
  <Link href="/" className="text-xl font-extrabold tracking-tight">Sport<span className="text-brand">Slot</span></Link>
);

export default function Navbar() {
  const path = usePathname();
  const active = (h) => (h === '/' ? path === '/' : path.startsWith(h));
  return (
    <>
      {/* Desktop & tablet */}
      <header className="sticky top-0 z-40 hidden border-b border-white/5 bg-black/70 backdrop-blur md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="flex gap-1">
            {items.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${active(href) ? 'bg-brand text-black' : 'text-neutral-300 hover:bg-white/5'}`}>
                <Icon size={16} />{label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {/* Mobile top */}
      <header className="flex items-center justify-between px-5 pt-5 md:hidden"><Logo /></header>
      {/* Mobile bottom pill nav */}
      <nav className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-sm items-center justify-between rounded-full border border-white/10 bg-neutral-900/90 p-1.5 backdrop-blur md:hidden">
        {items.map(({ href, label, Icon }) =>
          active(href) ? (
            <Link key={href} href={href} className="flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-black"><Icon size={18} />{label}</Link>
          ) : (
            <Link key={href} href={href} aria-label={label} className="grid h-12 w-12 place-items-center rounded-full bg-neutral-800 text-neutral-300"><Icon size={18} /></Link>
          )
        )}
      </nav>
    </>
  );
}
