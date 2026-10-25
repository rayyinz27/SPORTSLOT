import Navbar from '@/components/Navbar';

export default function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-5 pb-28 pt-4 md:px-6 md:pb-14 md:pt-8">{children}</main>
    </>
  );
}
