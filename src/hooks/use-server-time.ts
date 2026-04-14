'use client';

import { useQuery } from '@tanstack/react-query';
import { getServerTimeIso } from '@/lib/server-time';

export function useServerTime() {
  return useQuery({
    queryKey: ['server-time'],
    queryFn: getServerTimeIso,
    staleTime: 0,
    gcTime: 2 * 60 * 1000,
    retry: 2,
  });
}
