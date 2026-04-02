'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTabsStore } from '@/lib/stores/tabs';
import { useCurrentRoomStore } from '@/lib/stores/current-room';
import { apiClient } from '@/lib/api/client';
import { ServiceRequestsSidebar } from '@/components/service-requests-sidebar/service-requests-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import Link from 'next/link';
import {
  PivkaResultSheet,
  PivkaServicePicker,
  type PivkaResultValues,
} from '@/components/test-results/pivka-result-sheet';

const EMPTY_PIVKA: PivkaResultValues = { afpTotal: '', afpL3: '', pivkaIi: '' };

export default function PivkaResultsForm() {
  const queryClient = useQueryClient();
  const { activeKey, tabs } = useTabsStore();
  const { currentRoomId: storeCurrentRoomId } = useCurrentRoomStore();

  const currentTab = (tabs as { key: string; roomId?: string }[]).find((t) => t.key === activeKey);
  const currentRoomId = currentTab?.roomId;

  const [selectedServiceReqCode, setSelectedServiceReqCode] = useState('');
  const [storedServiceReqId, setStoredServiceReqId] = useState('');
  const [refreshTrigger] = useState(0);
  const [pivkaValues, setPivkaValues] = useState<PivkaResultValues>(EMPTY_PIVKA);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  const { data: myRoomsData } = useQuery({
    queryKey: ['my-rooms'],
    queryFn: () => apiClient.getMyUserRooms(),
    staleTime: 5 * 60 * 1000,
  });
  const resultFormType = myRoomsData?.data?.resultFormType;
  const isGenRoom = resultFormType !== undefined && resultFormType !== null && Number(resultFormType) === 2;

  const { data: storedServiceRequestData, isLoading: loadingStored } = useQuery({
    queryKey: ['stored-service-request', storedServiceReqId, refreshTrigger],
    queryFn: () => apiClient.getStoredServiceRequest(storedServiceReqId),
    enabled: !!storedServiceReqId,
    staleTime: 0,
  });

  useEffect(() => {
    if (storeCurrentRoomId && currentRoomId && storeCurrentRoomId !== currentRoomId) {
      setSelectedServiceReqCode('');
      setStoredServiceReqId('');
      setSelectedServiceId('');
      setPivkaValues(EMPTY_PIVKA);
      queryClient.invalidateQueries({ queryKey: ['workflow-history'] });
    }
  }, [storeCurrentRoomId, currentRoomId, queryClient]);

  const handleSelect = useCallback((serviceReqCode: string, storedId?: string) => {
    setSelectedServiceReqCode(serviceReqCode);
    setPivkaValues(EMPTY_PIVKA);
    if (storedId) setStoredServiceReqId(storedId);
  }, []);

  const stored = storedServiceRequestData?.data;
  const servicesFromApi = stored?.services;

  useEffect(() => {
    const list = servicesFromApi ?? [];
    if (list.length === 0) {
      setSelectedServiceId('');
      return;
    }
    setSelectedServiceId((prev) => {
      if (prev && list.some((s) => s.id === prev)) return prev;
      return list[0].id;
    });
  }, [servicesFromApi]);

  const services = servicesFromApi ?? [];

  const selectedService = services.find((s) => s.id === selectedServiceId) ?? services[0];

  const isLoading = loadingStored;

  if (myRoomsData === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  if (!isGenRoom) {
    return (
      <Alert className="max-w-xl">
        <AlertTitle>Kết quả PIVKA</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>Chức năng chỉ dành cho Đơn vị Gen</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Về trang chủ</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-2xl font-bold">Kết quả PIVKA</CardTitle>
        <p className="text-sm text-muted-foreground font-normal">
          Chọn yêu cầu dịch vụ bên trái. Chỉ ba ô kết quả xét nghiệm được nhập.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex min-h-[calc(100vh-220px)] flex-col md:flex-row">
          <div className="w-full border-b border-gray-200 bg-gray-50 md:w-1/4 md:border-b-0 md:border-r">
            <ServiceRequestsSidebar
              onSelect={handleSelect}
              refreshTrigger={refreshTrigger}
              selectedCode={selectedServiceReqCode}
              defaultStateId="426df256-bbfb-28d1-e065-9e6b783dd008"
            />
          </div>
          <div className="flex-1 overflow-y-auto bg-white p-4 md:p-6">
            {!selectedServiceReqCode && (
              <div className="py-12 text-center text-muted-foreground">
                Chọn một yêu cầu dịch vụ từ danh sách bên trái.
              </div>
            )}
            {selectedServiceReqCode && isLoading && (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="medium" />
              </div>
            )}
            {selectedServiceReqCode && !isLoading && stored && selectedService && (
              <>
                <PivkaServicePicker
                  services={services}
                  value={selectedService.id}
                  onChange={(id) => {
                    setSelectedServiceId(id);
                    setPivkaValues(EMPTY_PIVKA);
                  }}
                />
                <PivkaResultSheet
                  stored={stored}
                  selectedService={selectedService}
                  values={pivkaValues}
                  onChange={setPivkaValues}
                />
              </>
            )}
            {selectedServiceReqCode && !isLoading && stored && !selectedService && (
              <div className="py-8 text-center text-muted-foreground">Không có dịch vụ trên yêu cầu này.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
