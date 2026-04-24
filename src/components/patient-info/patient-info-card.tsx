import React from "react";
import { cn, formatDobDisplay } from "@/lib/utils";
import {
    PatientInfoPanel,
    PatientInfoReadRow,
    PatientInfoSectionLabel,
} from "@/components/patient-info/patient-info-read-row";

const SERVICE_REQ_STT_LABEL: Record<number, string> = {
    1: "Chưa xử lý",
    2: "Đang xử lý",
    3: "Kết thúc",
};

function getServiceReqSttBadgeClasses(id: number | undefined | null): string {
    if (id == null) return "bg-muted text-muted-foreground";
    switch (id) {
        case 1:
            return "bg-white text-foreground ring-1 ring-border";
        case 2:
            return "bg-yellow-100 text-yellow-950 ring-1 ring-yellow-300/90";
        case 3:
            return "bg-red-100 text-red-900 ring-1 ring-red-200/90";
        default:
            return "bg-gray-100 text-gray-800 ring-1 ring-gray-200/80";
    }
}

function getServiceReqSttLabel(id: number | undefined | null, code?: string | null): string {
    if (id != null) {
        return SERVICE_REQ_STT_LABEL[id] ?? `Mã: ${id}`;
    }
    const trimmedCode = code?.trim();
    if (trimmedCode) return trimmedCode;
    return "Chưa cập nhật";
}

export interface PatientInfoCardProps {
    patient?: {
        name?: string | null;
        dob?: string | number | null;
        genderName?: string | null;
        mobile?: string | null;
        phone?: string | null;
        code?: string | null;
        cmndNumber?: string | null;
        address?: string | null;
    };
    orderStatus?: {
        id?: number | null;
        code?: string | null;
    };
    requestDoctor?: string | null;
    requestLocation?: string | null;
    diagnosis?: string | null;
    secondaryDiagnosis?: string | null;
}

export default function PatientInfoCard({
    patient,
    orderStatus,
    requestDoctor,
    requestLocation,
    diagnosis,
    secondaryDiagnosis,
}: PatientInfoCardProps) {
    const orderStatusLabel = getServiceReqSttLabel(orderStatus?.id, orderStatus?.code);

    return (
        <PatientInfoPanel>
            <h3 className="mb-2 border-b border-border pb-1.5 text-base font-semibold leading-tight text-foreground">
                Thông tin bệnh nhân
            </h3>
            <PatientInfoSectionLabel>Bệnh nhân</PatientInfoSectionLabel>
            <div className="ml-2 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
                <PatientInfoReadRow label="Họ và tên" multiline emphasize className="min-w-0">
                    {patient?.name ?? ""}
                </PatientInfoReadRow>
                <PatientInfoReadRow label="Ngày sinh" className="min-w-0">
                    {patient?.dob ? formatDobDisplay(patient.dob) : ""}
                </PatientInfoReadRow>
                <PatientInfoReadRow label="Giới tính" className="min-w-0">
                    {patient?.genderName ?? ""}
                </PatientInfoReadRow>
                <PatientInfoReadRow label="Số điện thoại" className="min-w-0">
                    {patient?.mobile ?? patient?.phone ?? ""}
                </PatientInfoReadRow>
                <div className="col-span-full border-t border-border/50" aria-hidden />
                <PatientInfoReadRow label="Mã bệnh nhân (PID)" className="min-w-0 pb-0">
                    {patient?.code ?? ""}
                </PatientInfoReadRow>
                <PatientInfoReadRow label="CMND/CCCD" className="min-w-0">
                    {patient?.cmndNumber ?? ""}
                </PatientInfoReadRow>
                <PatientInfoReadRow
                    label="Địa chỉ"
                    multiline
                    className="min-w-0 sm:col-span-2 lg:col-span-2"
                >
                    {patient?.address ?? ""}
                </PatientInfoReadRow>
            </div>
            <div className="mt-2">
                <PatientInfoSectionLabel>Chỉ định</PatientInfoSectionLabel>
            </div>
            <div className="flex flex-col divide-y divide-border/50 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
                <PatientInfoReadRow label="Trạng thái y lệnh" multiline twoColumnGrid className="px-2 mt-2">
                    <span
                        className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-sm font-medium",
                            getServiceReqSttBadgeClasses(orderStatus?.id),
                        )}
                    >
                        {orderStatusLabel}
                    </span>
                </PatientInfoReadRow>
                <PatientInfoReadRow label="Bác sĩ chỉ định" multiline twoColumnGrid className="px-2">
                    {requestDoctor ?? ""}
                </PatientInfoReadRow>
                <PatientInfoReadRow label="Nơi chỉ định" multiline twoColumnGrid className="px-2">
                    {requestLocation ?? ""}
                </PatientInfoReadRow>
                <PatientInfoReadRow label="Chẩn đoán" multiline twoColumnGrid className="px-2">
                    {diagnosis ?? ""}
                </PatientInfoReadRow>
                <PatientInfoReadRow label="Chẩn đoán phụ" multiline twoColumnGrid className="px-2">
                    {secondaryDiagnosis ?? ""}
                </PatientInfoReadRow>
            </div>
        </PatientInfoPanel>
    );
}
