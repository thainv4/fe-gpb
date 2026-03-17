"use client";

import React from "react";
import dynamic from "next/dynamic";
import { StoredServiceRequestResponse, StoredService } from "@/lib/api/client";

/** resultFormType = 1 → form-gpb (Giải phẫu bệnh) */
export const RESULT_FORM_TYPE_GPB = 1;
/** resultFormType = 2 → form-gen-1 */
export const RESULT_FORM_TYPE_GEN1 = 2;

export interface ResultFormProps {
  data: StoredServiceRequestResponse;
  specificService?: StoredService;
  signatureImageBase64?: string;
}

export interface ResultFormComponentProps extends ResultFormProps {
  /** 1 = form-gpb, 2 = form-gen-1. Mặc định 1. */
  formType?: number | string;
}

const FormTemplate = dynamic(() => import("./form-gpb").then((m) => ({ default: m.FormTemplate })), {
  ssr: false,
  loading: () => <div className="min-h-[400px] flex items-center justify-center text-muted-foreground">Đang tải form...</div>,
});

const FormGen1 = dynamic(() => import("./form-gen-1").then((m) => ({ default: m.FormGen1 })), {
  ssr: false,
  loading: () => <div className="min-h-[400px] flex items-center justify-center text-muted-foreground">Đang tải form...</div>,
});

/**
 * Registry: chọn form kết quả theo formType (resultFormType của phòng).
 * formType 1 → FormTemplate (form-gpb), 2 → FormGen1 (form-gen-1).
 */
export function ResultForm({
  formType = RESULT_FORM_TYPE_GPB,
  data,
  specificService,
  signatureImageBase64,
}: ResultFormComponentProps) {
  const type = Number(formType) === RESULT_FORM_TYPE_GEN1 ? RESULT_FORM_TYPE_GEN1 : RESULT_FORM_TYPE_GPB;

  if (type === RESULT_FORM_TYPE_GEN1) {
    return (
      <FormGen1
        data={data}
        specificService={specificService}
        signatureImageBase64={signatureImageBase64}
      />
    );
  }

  return (
    <FormTemplate
      data={data}
      specificService={specificService}
      signatureImageBase64={signatureImageBase64}
    />
  );
}
