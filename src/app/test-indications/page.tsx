'use client'

import {DashboardLayout} from "@/components/layout/dashboard-layout";
import TestIndicationsForm from "@/components/test-indications/test-indications-form";
import {useAuthStore} from "@/lib/stores/auth";
import {redirect} from "next/navigation";

export default function TestIndicationsPage() {
    const {isAuthenticated} = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <TestIndicationsForm/>
        </DashboardLayout>
    )
}