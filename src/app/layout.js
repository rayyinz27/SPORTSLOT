import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SportSlot - Reservasi Lapangan Olahraga',
  description: 'Cek jadwal, pesan, dan bayar lapangan olahraga tanpa jadwal bentrok.',
};
export const viewport = { themeColor: '#0a0a0a', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
