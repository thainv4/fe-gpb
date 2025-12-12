'use client'

import {UserRoomManagement} from "@/components/user-room-management/user-room-management"
import {DashboardLayout} from "@/components/layout/dashboard-layout";

export default function UserRoomsPage() {
    return (
        <DashboardLayout>
            <UserRoomManagement/>
        </DashboardLayout>
    )
}

