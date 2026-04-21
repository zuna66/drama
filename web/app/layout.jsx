import './globals.css';
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from 'next/font/google';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import Footer from '@/components/Footer';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata = {
  title: 'Sinema — Drama Pendek Pilihan',
  description: 'Tonton ribuan drama pendek terbaik. Dirancang untuk yang nggak suka loading.',
};

export const viewport = {
  themeColor: '#0a0a0c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${jakarta.variable} ${display.variable}`}>
      <body className="min-h-screen bg-bg text-ink-50 font-sans antialiased">
        <Navbar />
        <main className="pt-16 pb-24 sm:pb-0">{children}</main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
