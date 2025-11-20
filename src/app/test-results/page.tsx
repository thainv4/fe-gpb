'use client'

import {DashboardLayout} from "@/components/layout/dashboard-layout";
import TestResultForm from "@/components/test-results/test-result-form";
import {useAuthStore} from "@/lib/stores/auth";
import {redirect} from "next/navigation";

export default function TestResults() {
    const {isAuthenticated} = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <TestResultForm />
        </DashboardLayout>
    )
}

