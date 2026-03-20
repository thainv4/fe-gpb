'use client';

import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { useAuthStore } from '@/lib/stores/auth';
import { redirect } from 'next/navigation';

const PivkaResultsForm = dynamic(
  () => import('@/components/test-results/pivka-results-form').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="medium" />
      </div>
    ),
  }
);

export default function PivkaResultsPage() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    redirect('/auth/login');
  }

  return (
    <DashboardLayout>
      <PivkaResultsForm />
    </DashboardLayout>
  );
}
