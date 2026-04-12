import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import CartDrawer from '@/components/layout/CartDrawer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: { default: 'Agrawal Cake House Barwaha', template: '%s | Agrawal Cake House' },
  description: 'Premium handcrafted cakes in Barwaha — fresh daily, delivered to your door.',
  keywords: ['cakes', 'birthday cake', 'wedding cake', 'custom cake', 'bakery'],
  openGraph: {
    type: 'website',
    title: 'Agrawal Cake House',
    description: 'Handcrafted cakes made with love.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-pattern">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <CartDrawer />
        <WhatsAppButton />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: '12px',
              border: '1px solid #ffe0ee',
              background: '#fff',
              color: '#1a1a2e',
            },
            success: { iconTheme: { primary: '#f72f7a', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
