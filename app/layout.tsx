import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const cashSans = localFont({
  src: [
    {
      path: '../public/fonts/CashSans-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/CashSans-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/CashSans-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/CashSans-Semibold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/CashSans-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/CashSans-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-cash-sans',
  display: 'swap',
});

const cashSansMono = localFont({
  src: '../public/fonts/CashSansMono-Regular.woff2',
  variable: '--font-cash-sans-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Chris Liu',
  description: 'Chris Liu is a product designer in Brooklyn, NY.',
  icons: {
    icon: '/icon.png',
  },
}

// Next.js 16 passes `params` as a Promise; do not destructure or enumerate it.
// (Cursor's component inspector may trigger "params must be unwrapped" when it enumerates props.)
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${cashSans.variable} ${cashSansMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
