import React from 'react';
import ResultTemplateForm from "@/components/result-template/result-template-form";
import {DashboardLayout} from "@/components/layout/dashboard-layout";

function Page() {
    return (
        <DashboardLayout>
            <ResultTemplateForm/>
        </DashboardLayout>
    );
}

export default Page;