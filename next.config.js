/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['192.168.68.209'],
    },
    env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://192.168.68.209:8000/api/v1',
    },
}

module.exports = nextConfig
