'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/lib/stores/auth'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    Building2,
    ChevronDown,
    MapPin,
    Home,
    UserCheck,
    Building,
    Stethoscope,
    Package,
    Ruler,
    TestTube, NewspaperIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTabsStore } from '@/lib/stores/tabs'
import { RoomPickerDialog } from '../rooms/room-picker-dialog'
import { useCurrentRoomStore } from '@/lib/stores/current-room'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user, logout } = useAuthStore()
    const router = useRouter()
    const pathname = usePathname()

    const [roomDialogOpen, setRoomDialogOpen] = useState(false)
    const { currentRoomId, currentRoomCode, currentDepartmentCode, currentRoomName, currentDepartmentName, currentDepartmentId } = useCurrentRoomStore()

    // Tabs store
    const { tabs, activeKey, openTab, closeTab, setActive, reset: resetTabs } = useTabsStore()

    // Navigation config
    const navigation = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            description: 'Tổng quan hệ thống và thống kê'
        },
        {
            name: 'Xét nghiệm',
            icon: TestTube,
            description: 'Quy trình xét nghiệm và quản lý mẫu',
            children: [
                {
                    name: 'Chỉ định xét nghiệm',
                    href: '/test-indications',
                    icon: Stethoscope,
                    description: 'Tiếp nhận và chỉ định xét nghiệm'
                },
                {
                    name: 'Bàn giao mẫu',
                    href: '/sample-delivery',
                    icon: Package,
                    description: 'Quản lý trạng thái và bàn giao mẫu'
                },
                {
                    name: 'Kết quả xét nghiệm',
                    href: '/test-results',
                    icon: NewspaperIcon,
                    description: 'Nhập và quản lý kết quả xét nghiệm'
                }
            ]
        },
        {
            name: 'Danh mục',
            icon: Building2,
            description: 'Quản lý danh mục và cấu hình hệ thống',
            children: [
                // {
                //     name: 'Chi nhánh',
                //     href: '/branches',
                //     icon: Building2,
                //     description: 'Quản lý các chi nhánh bệnh viện'
                // },
                // {
                //     name: 'Loại khoa',
                //     href: '/department-types',
                //     icon: Building,
                //     description: 'Quản lý các loại khoa phòng'
                // },
                {
                    name: 'Khoa',
                    href: '/departments',
                    icon: Building2,
                    description: 'Quản lý khoa phòng theo chi nhánh'
                },
                {
                    name: 'Phòng',
                    href: '/rooms',
                    icon: Home,
                    description: 'Quản lý phòng theo khoa'
                },
                // {
                //     name: 'Tỉnh/Thành phố',
                //     href: '/provinces',
                //     icon: MapPin,
                //     description: 'Quản lý danh sách tỉnh thành phố'
                // },
                // {
                //     name: 'Phường/Xã',
                //     href: '/wards',
                //     icon: Home,
                //     description: 'Quản lý danh sách phường xã theo tỉnh'
                // },
                // {
                //     name: 'Nhóm dịch vụ',
                //     href: '/service-groups',
                //     icon: Package,
                //     description: 'Quản lý nhóm dịch vụ y tế'
                // },
                // {
                //     name: 'Dịch vụ',
                //     href: '/services',
                //     icon: Stethoscope,
                //     description: 'Quản lý dịch vụ y tế và giá cả'
                // },
                {
                    name: 'Loại mẫu',
                    href: '/sample-types',
                    icon: TestTube,
                    description: 'Quản lý loại mẫu xét nghiệm'
                },
                // {
                //     name: 'Đơn vị tính',
                //     href: '/unit-of-measures',
                //     icon: Ruler,
                //     description: 'Quản lý đơn vị đo lường'
                // },
                // {
                //     name: 'Danh mục chung',
                //     href: '/categories',
                //     icon: Users,
                //     description: 'Quản lý danh mục chung hệ thống'
                // },
                {
                    name: 'Mẫu kết quả xét nghiệm',
                    href: '/result-templates',
                    icon: TestTube,
                    description: 'Quản lý mẫu kết quả xét nghiệm'
                }
            ]
        },
        {
            name: 'Người dùng',
            icon: UserCheck,
            description: 'Quản lý người dùng và phân quyền',
            children: [
                {
                    name: 'Người dùng',
                    href: '/users',
                    icon: UserCheck,
                    description: 'Quản lý người dùng hệ thống'
                },
                {
                    name: 'Phân quyền phòng',
                    href: '/user-rooms',
                    icon: Home,
                    description: 'Quản lý phân quyền phòng cho người dùng'
                }
            ]
        },
        {
            name: 'Cài đặt',
            href: '/settings',
            icon: Settings,
            description: 'Cấu hình hệ thống và tài khoản'
        }
    ]

    // Build a map path -> label for tab naming
    const pathLabelMap = useMemo(() => {
        const map = new Map<string, string>()
        const addItem = (item: any) => {
            if (item.href) map.set(item.href, item.name)
            if (item.children) item.children.forEach(addItem)
        }
        navigation.forEach(addItem)
        return map
    }, [])

    const prettifyPath = (p: string) => {
        if (!p) return 'Trang'
        const last = p.split('?')[0].split('#')[0].split('/').filter(Boolean).pop()
        if (!last) return 'Trang'
        return last.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
    }

    // Sync current route to tabs
    useEffect(() => {
        if (!pathname) return

        // Check if active tab already matches this pathname
        const currentActiveTab = tabs.find(t => t.key === activeKey)
        if (currentActiveTab?.path === pathname) {
            return // Already on the correct tab, no action needed
        }

        // Get label for this path
        const label = pathLabelMap.get(pathname) ?? prettifyPath(pathname)

        // Define paths that need room association (pages in "Mới thêm" section)
        const roomAssociatedPaths = ['/test-indications', '/sample-delivery', '/test-results', '/sample-cabinets']
        const needsRoom = roomAssociatedPaths.includes(pathname)

        // openTab will handle duplicate checking internally
        // Only pass room info for paths that need it
        openTab({
            path: pathname,
            label,
            closable: pathname !== '/dashboard',
            roomId: needsRoom ? currentRoomId : undefined,
            roomCode: needsRoom ? currentRoomCode : undefined,
            roomName: needsRoom ? currentRoomName : undefined,
            departmentId: needsRoom ? currentDepartmentId : undefined,
            departmentCode: needsRoom ? currentDepartmentCode : undefined,
            departmentName: needsRoom ? currentDepartmentName : undefined,
        })

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, currentRoomId])

    const handleTabClick = (tabKey: string) => {
        if (tabKey !== activeKey) {
            const tab = tabs.find(t => t.key === tabKey)
            if (tab) {
                setActive(tabKey)
                router.push(tab.path)
            }
        }
    }

    const handleCloseTab = (key: string) => {
        // Determine next tab before closing
        const remaining = tabs.filter((t) => t.key !== key)
        const currentIndex = tabs.findIndex(t => t.key === key)

        // Try to activate the tab to the right, then left, then last remaining
        let nextTab = remaining[currentIndex] || remaining[currentIndex - 1] || remaining[remaining.length - 1]
        if (!nextTab) {
            // Find or create dashboard tab
            const dashboardTab = tabs.find(t => t.path === '/dashboard')
            if (dashboardTab) {
                nextTab = dashboardTab
            } else {
                // Fallback to navigating to dashboard without a tab reference
                closeTab(key)
                if (activeKey === key) {
                    router.push('/dashboard')
                }
                return
            }
        }

        closeTab(key)

        // If we closed the active tab, navigate to next
        if (activeKey === key) {
            router.push(nextTab.path)
        }
    }

    async function handleSignOut() {
        try {
            // Call logout API
            const { apiClient } = await import('@/lib/api/client')
            await apiClient.logout()
        } catch (error) {
            console.warn('Logout API failed:', error)
        } finally {
            // Clear auth store
            logout()
            // Reset tabs store
            resetTabs()

            // Clear all localStorage items related to auth
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth-storage')
                localStorage.removeItem('auth-token')
                localStorage.removeItem('auth-refresh-token')
                localStorage.removeItem('auth-user')
                localStorage.removeItem('tab-storage')
                localStorage.removeItem('current-room-storage')
            }

            // Force redirect to login page with full page reload
            window.location.href = '/auth/login'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
                    {/* Logo and Brand */}
                    <div className="flex items-center">
                        <Image 
                            src="/logo-bvbm-wh.png" 
                            alt="Bạch Mai Hospital Logo" 
                            width={32} 
                            height={32} 
                            className="h-8 w-8"
                        />
                        <span className="ml-2 text-lg font-semibold text-gray-900 text-green-700">
                            Bạch Mai LIS
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1 ml-8">
                        {navigation.map((item) => {
                            const Icon = item.icon

                            if (item.children) {
                                return (
                                    <DropdownMenu key={item.name}>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="flex items-center space-x-2"
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span>{item.name}</span>
                                                <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-[850px] p-4">
                                            <div className="grid grid-cols-3 gap-2">
                                                {item.children.map((child) => {
                                                    const ChildIcon = child.icon
                                                    return (
                                                        <DropdownMenuItem
                                                            key={child.name}
                                                            onClick={() => router.push(child.href)}
                                                            className="flex flex-col items-start p-3 cursor-pointer rounded-lg hover:bg-gray-50"
                                                        >
                                                            <div className="flex items-center w-full">
                                                                <ChildIcon className="mr-2 h-4 w-4 text-medical-600" />
                                                                <span className="font-medium text-sm">{child.name}</span>
                                                            </div>
                                                            {child.description && (
                                                                <span className="text-xs text-muted-foreground mt-1 ml-6">
                                                                    {child.description}
                                                                </span>
                                                            )}
                                                        </DropdownMenuItem>
                                                    )
                                                })}
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )
                            }

                            return (
                                <Button
                                    key={item.name}
                                    variant="ghost"
                                    className="flex items-center space-x-2"
                                    onClick={() => router.push(item.href)}
                                    title={item.description}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.name}</span>
                                </Button>
                            )
                        })}
                    </nav>

                    {/* Spacer to push user menu to the right */}
                    <div className="flex-1" />

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {/* Current Room Display */}
                        {currentRoomName && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-blue-200 rounded-md">
                                <MapPin className="h-4 w-4 text-green-600" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold ">
                                        {currentRoomName}
                                    </span>
                                    {currentDepartmentName && (
                                        <span className="text-xs ">
                                            {currentDepartmentName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRoomDialogOpen(true)}
                            title={'Chọn phòng làm việc'}
                        >
                            Chọn phòng làm việc
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <User className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {user?.username}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            Role: Admin
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Đăng xuất</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="md:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                    </div>
                </div>

                {/* Tabs bar */}
                <div className="border-t border-gray-200">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex h-10 items-center gap-2 overflow-x-auto">
                            {tabs.map((t) => {
                                const isActive = t.key === activeKey
                                return (
                                    <div
                                        key={t.key}
                                        role="tab"
                                        aria-selected={isActive}
                                        tabIndex={0}
                                        onClick={() => handleTabClick(t.key)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                handleTabClick(t.key)
                                            }
                                        }}
                                        className={cn(
                                            'group inline-flex items-center rounded-t-md border border-b-0 px-3 h-9 cursor-pointer select-none',
                                            isActive
                                                ? 'bg-white text-medical-700 border-gray-300 font-bold'
                                                : 'bg-neutral-200 text-gray-600 hover:bg-gray-200 border-gray-200'
                                        )}
                                    >
                                        <span className="text-sm whitespace-nowrap">{t.label}</span>
                                        {t.closable !== false && (
                                            <button
                                                type="button"
                                                aria-label={`Đóng ${t.label}`}
                                                className="ml-2 rounded p-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleCloseTab(t.key)
                                                }}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Overlay */}
            <div className={cn(
                'fixed inset-0 z-50 md:hidden',
                sidebarOpen ? 'block' : 'hidden'
            )}>
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75"
                    onClick={() => setSidebarOpen(false)}
                    onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
                    role="button"
                    tabIndex={0}
                    aria-label="Đóng menu"
                />
                <div className="fixed inset-x-0 top-0 bg-white shadow-lg">
                    <div className="flex h-16 items-center justify-between px-4">
                        <div className="flex items-center">
                            <Image 
                                src="/logo-bvbm-wh.png" 
                                alt="Bạch Mai Hospital Logo" 
                                width={32} 
                                height={32} 
                                className="h-8 w-8"
                            />
                            <span className="ml-2 text-lg font-semibold text-gray-900">
                                Bạch Mai LIS
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>
                    <nav className="border-t border-gray-200 px-4 py-4">
                        <div className="space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon

                                if (item.children) {
                                    return (
                                        <div key={item.name} className="space-y-1">
                                            <div className="px-3 py-2">
                                                <div className="flex items-center text-sm font-medium text-gray-500">
                                                    <Icon className="mr-3 h-5 w-5" />
                                                    {item.name}
                                                </div>
                                                {item.description && (
                                                    <p className="text-xs text-muted-foreground mt-1 ml-8">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                            {item.children.map((child) => {
                                                const ChildIcon = child.icon
                                                return (
                                                    <div key={child.name} className="ml-6">
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start p-3 h-auto"
                                                            onClick={() => {
                                                                router.push(child.href)
                                                                setSidebarOpen(false)
                                                            }}
                                                        >
                                                            <div className="flex flex-col items-start w-full">
                                                                <div className="flex items-center w-full">
                                                                    <ChildIcon className="mr-3 h-4 w-4 text-medical-600" />
                                                                    <span className="font-medium">{child.name}</span>
                                                                </div>
                                                                {child.description && (
                                                                    <span className="text-xs text-muted-foreground mt-1 ml-7">
                                                                        {child.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </Button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )
                                }

                                return (
                                    <Button
                                        key={item.name}
                                        variant="ghost"
                                        className="w-full justify-start p-3 h-auto"
                                        onClick={() => {
                                            router.push(item.href)
                                            setSidebarOpen(false)
                                        }}
                                    >
                                        <div className="flex flex-col items-start w-full">
                                            <div className="flex items-center w-full">
                                                <Icon className="mr-3 h-5 w-5 text-medical-600" />
                                                <span className="font-medium">{item.name}</span>
                                            </div>
                                            {item.description && (
                                                <span className="text-xs text-muted-foreground mt-1 ml-8">
                                                    {item.description}
                                                </span>
                                            )}
                                        </div>
                                    </Button>
                                )
                            })}
                        </div>
                    </nav>
                </div>
            </div>

            {/* Main content */}
            <main className="py-6 w-full">
                <div className=" px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
            <RoomPickerDialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen} />
        </div>
    )
}
