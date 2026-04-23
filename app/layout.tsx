import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Core AI Vision — Command Center',
  description: 'Internal operations dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
