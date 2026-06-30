"use client";

import React from "react";
import dynamic from "next/dynamic";
import { StoredServiceRequestResponse, StoredService } from "@/lib/api/client";

/** resultFormType = 1 → form-gpb (Giải phẫu bệnh) */
export const RESULT_FORM_TYPE_GPB = 1;
/** resultFormType = 2 → Gen WYSIWYG sheet (không dùng ResultForm) */
export const RESULT_FORM_TYPE_GEN1 = 2;

export interface ResultFormProps {
  data: StoredServiceRequestResponse;
  specificService?: StoredService;
  signatureImageBase64?: string;
}

export interface ResultFormComponentProps extends ResultFormProps {
  /** Chỉ hỗ trợ GPB (1). GEN (2) dùng GenResultSheet trên trang test-results. */
  formType?: number | string;
}

const FormTemplate = dynamic(() => import("./form-gpb").then((m) => ({ default: m.FormTemplate })), {
  ssr: false,
  loading: () => <div className="min-h-[400px] flex items-center justify-center text-muted-foreground">Đang tải form...</div>,
});

/**
 * Registry: form kết quả GPB cho preview/in.
 * GEN (resultFormType = 2) dùng GenResultSheet — không qua ResultForm.
 */
export function ResultForm({
  data,
  specificService,
  signatureImageBase64,
}: ResultFormComponentProps) {
  return (
    <FormTemplate
      data={data}
      specificService={specificService}
      signatureImageBase64={signatureImageBase64}
    />
  );
}
