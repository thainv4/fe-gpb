import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

// Import token debug utils in development
if (process.env.NODE_ENV === 'development') {
    import('@/lib/utils/token-debug')
}

// Roboto font with Vietnamese support for better rendering
const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin', 'vietnamese'],
    display: 'swap',
    variable: '--font-roboto',
})

export const metadata: Metadata = {
    title: 'Bạch Mai LIS',
    description: 'Hệ thống quản lý thông tin phòng xét nghiệm Bạch Mai',
    keywords: ['LIS', 'Laboratory Information System', 'Bạch Mai', 'Xét nghiệm'],
    icons: {
        icon: '/logo-bvbm-wh.png',
        shortcut: '/logo-bvbm-wh.png',
        apple: '/logo-bvbm-wh.png',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="vi">
            <body className={roboto.className}>
                <Providers>
                    {children}
                    <Toaster />
                </Providers>
            </body>
        </html>
    )
}