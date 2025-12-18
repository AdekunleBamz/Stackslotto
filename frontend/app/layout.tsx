import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StacksLotto - On-Chain Lottery',
  description: 'Win big with StacksLotto! The first decentralized lottery on Stacks blockchain. Buy tickets, win prizes, all powered by smart contracts.',
  keywords: ['Stacks', 'Lottery', 'Blockchain', 'DeFi', 'Web3', 'Chainhooks', 'Prize'],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'StacksLotto - On-Chain Lottery',
    description: 'Win big with StacksLotto! Decentralized lottery on Stacks.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
