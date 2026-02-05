"use client";

import React from "react";
import { StoredServiceRequestResponse, StoredService } from "@/lib/api/client";
import { FormTemplate } from "./form-gpb";
import { FormGen1 } from "./form-gen-1";

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
