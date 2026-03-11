'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useCurrentRoomStore } from '@/lib/stores/current-room'
import { apiClient } from '@/lib/api/client'

/** Khi departmentType (hoặc resultFormType) của phòng hiện tại === 3, chỉ cho phép vào dashboard, test-indications và change-password */
const ALLOWED_WHEN_TYPE_3 = ['/dashboard', '/test-indications', '/change-password', '/']

/** Route public (login, register, ...) không bị chặn bởi departmentType */
const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/']

export function DepartmentTypeGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { currentRoomId } = useCurrentRoomStore()

    const isPublicRoute = pathname ? PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/')) : true

    const { data: myRoomsData } = useQuery({
        queryKey: ['my-rooms'],
        queryFn: () => apiClient.getMyUserRooms(),
        staleTime: 5 * 60 * 1000,
        enabled: !isPublicRoute,
    })

    const myRooms = myRoomsData?.data?.rooms ?? []
    const raw = myRoomsData?.data?.resultFormType
    const departmentType = raw !== undefined && raw !== null ? Number(raw) : null

    useEffect(() => {
        if (departmentType !== 3) return
        if (!pathname) return
        if (isPublicRoute) return

        const allowed = ALLOWED_WHEN_TYPE_3.some((route) => pathname === route || pathname.startsWith(route + '/'))
        if (!allowed) {
            router.replace('/test-indications')
        }
    }, [departmentType, pathname, isPublicRoute, router])

    return <>{children}</>
}
