import React from "react";
import { cn } from "@/lib/utils";

export interface PatientInfoReadRowProps {
    label: string;
    children: React.ReactNode;
    multiline?: boolean;
    /** Tô đậm giá trị (vd. họ tên) — vẫn giữ cùng cỡ chữ để gọn chiều cao. */
    emphasize?: boolean;
    /**
     * Lưới 2 cột cố định (nhãn | giá trị) — các dòng có cùng prop sẽ thẳng hàng cột giá trị.
     * Dùng cho khối "Chỉ định".
     */
    twoColumnGrid?: boolean;
    className?: string;
}

export function PatientInfoReadRow({
    label,
    children,
    multiline,
    emphasize,
    twoColumnGrid,
    className,
}: PatientInfoReadRowProps) {
    const isEmpty =
        children == null ||
        children === "" ||
        (typeof children === "string" && !children.trim());
    const display = isEmpty ? "—" : children;
    return (
        <div
            className={cn(
                "min-w-0 py-1 text-sm",
                twoColumnGrid
                    ? cn(
                          "grid grid-cols-[minmax(10rem,10rem)_minmax(0,1fr)] gap-y-0",
                          multiline ? "items-start" : "items-baseline",
                      )
                    : cn(
                          "flex gap-x-8",
                          multiline ? "items-start" : "items-baseline",
                      ),
                className,
            )}
        >
            <span
                className={cn(
                    "text-xs font-medium leading-snug text-muted-foreground",
                    twoColumnGrid ? "min-w-0 break-words" : "w-max shrink-0",
                )}
            >
                {label}
            </span>
            <div
                className={cn(
                    "min-w-0 break-words text-sm leading-snug text-foreground",
                    !twoColumnGrid && "flex-1",
                    emphasize ? "font-semibold" : "font-medium",
                    multiline && "whitespace-pre-wrap",
                )}
            >
                {display}
            </div>
        </div>
    );
}

/** Nhãn mục nhỏ (Bệnh nhân / Chỉ định) — gọn theo chiều dọc. */
export function PatientInfoSectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-1 border-l-2 border-primary pl-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
        </p>
    );
}

/** Khung card — padding nhỏ để tổng chiều cao panel thấp. */
export function PatientInfoPanel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "patient-info mb-3 rounded-lg border border-border bg-card px-3 py-2.5 text-card-foreground shadow-sm dark:bg-card",
                className,
            )}
        >
            {children}
        </div>
    );
}
