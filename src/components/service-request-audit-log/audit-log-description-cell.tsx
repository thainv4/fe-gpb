'use client'

import { ServiceRequestAuditLogItem } from '@/lib/api/client'

/** Snapshot keys omitted from the description column. */
const HIDDEN_SNAPSHOT_KEYS = new Set([
    'actionType',
    'stateOrder',
    'toStateCode',
    'fromStateOrder',
    'toStateOrder',
    'fromStateName',
    'toStateName',
])

function toLines(value: unknown, label: string): string[] {
    if (value === null || value === undefined) return []
    if (typeof value === 'string' && value.trim() === '') return []
    if (Array.isArray(value)) return value.length ? [`${label}: ${value.join(', ')}`] : []
    if (typeof value === 'object') return [`${label}: ${JSON.stringify(value)}`]
    return [`${label}: ${String(value)}`]
}

function pushWorkflowTransitionLine(lines: string[], snapshot: Record<string, unknown>) {
    const from = snapshot.fromStateName
    const to = snapshot.toStateName
    if (from || to) {
        lines.push(`Chuyển trạng thái: ${from ?? '—'} → ${to ?? '—'}`)
    }
}

export default function AuditLogDescriptionCell({ row }: { row: ServiceRequestAuditLogItem }) {
    const snapshot = (row.payload?.snapshot ?? {}) as Record<string, unknown>
    const lines: string[] = []

    if (row.eventCode === 'RESULT_SAVE') {
        lines.push(...toLines(snapshot.serviceName, 'Dịch vụ'))
        lines.push(...toLines(snapshot.resultStatus, 'Trạng thái'))
        lines.push(...toLines(snapshot.flag, 'Cờ'))
        lines.push(...toLines(snapshot.numOfBlock, 'Số block'))
        lines.push(...toLines(snapshot.resultValueText, 'Kết quả text'))
        lines.push(...toLines(snapshot.resultText, 'Nội dung kết quả'))
        lines.push(...toLines(snapshot.notes, 'Ghi chú'))
    } else if (row.eventCode === 'TICKET_STORED') {
        lines.push(...toLines(snapshot.hisServiceReqCode, 'Mã y lệnh'))
        const status = snapshot.hisPacsStartStatus
        if (status === 'SUCCESS') {
            lines.push('Cập nhật trạng thái y lệnh: Thành công')
        } else if (status === 'FAILED') {
            lines.push('Cập nhật trạng thái y lệnh: Thất bại')
        } else if (status === 'PARTIAL') {
            lines.push('Cập nhật trạng thái y lệnh: Một phần thành công')
        }
        lines.push(...toLines(snapshot.hisPacsStartMessage, 'Chi tiết HIS-PACS Start'))
    } else if (row.eventCode === 'SAMPLE_HANDOVER') {
        lines.push(...toLines(snapshot.receiverRoomName ?? snapshot.receiverRoomId, 'Phòng nhận'))
        lines.push(...toLines(snapshot.stainingMethodName, 'Phương pháp nhuộm'))
        lines.push(...toLines(snapshot.flag, 'Cờ'))
        lines.push(...toLines(snapshot.numOfBlock, 'Số block'))
        lines.push(...toLines(snapshot.handoverNote, 'Ghi chú bàn giao'))
        lines.push(...toLines(snapshot.serviceCount, 'Số dịch vụ'))
    } else if (row.eventCode === 'WORKFLOW_DELETE') {
        pushWorkflowTransitionLine(lines, snapshot)
        lines.push(...toLines(snapshot.trigger, 'Nguyên nhân'))
        lines.push(...toLines(snapshot.relatedDocumentId, 'Mã tài liệu'))
        lines.push(...toLines(snapshot.workflowHistoryId, 'ID bản ghi quy trình'))
    } else if (row.eventCode === 'WORKFLOW_TRANSITION') {
        pushWorkflowTransitionLine(lines, snapshot)
        lines.push(...toLines(snapshot.durationMinutes, 'Thời gian xử lý (phút)'))
        lines.push(...toLines(snapshot.notes, 'Ghi chú'))
        lines.push(...toLines(snapshot.workflowHistoryId, 'ID bản ghi quy trình'))
    } else {
        for (const [k, v] of Object.entries(snapshot)) {
            if (HIDDEN_SNAPSHOT_KEYS.has(k)) continue
            lines.push(...toLines(v, k))
        }
    }

    return (
        <div className="space-y-1">
            <div className="font-medium">{row.eventTitle}</div>
            {lines.length > 0 ? (
                <div className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                    {lines.join('\n')}
                </div>
            ) : (
                <div className="text-xs text-muted-foreground">—</div>
            )}
        </div>
    )
}
