import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

// Import token debug utils in development
if (process.env.NODE_ENV === 'development') {
    import('@/lib/utils/token-debug')
}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Bạch Mai LIS GPB',
    description: 'Hệ thống quản lý thông tin phòng xét nghiệm Bạch Mai',
    keywords: ['LIS', 'Laboratory Information System', 'Bạch Mai', 'Xét nghiệm'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="vi">
            <body className={inter.className}>
                <Providers>
                    {children}
                    <Toaster />
                </Providers>
            </body>
        </html>
    )
}
