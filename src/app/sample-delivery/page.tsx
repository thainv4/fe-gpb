'use client'

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import SampleDeliveryForm from "@/components/sample-delivery/sample-delivery-form"
import { useAuthStore } from "@/lib/stores/auth"
import { redirect } from "next/navigation"

export default function SampleDelivery() {
    const { isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <SampleDeliveryForm/>
        </DashboardLayout>
    )
}