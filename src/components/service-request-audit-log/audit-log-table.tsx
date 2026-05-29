'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import AuditLogDescriptionCell from './audit-log-description-cell'

const PAGE_SIZE = 20

interface AuditLogTableProps {
    selectedCode?: string
    onSelectedCodeChange?: (code: string) => void
    useSidebarMode?: boolean
}

function formatDateTimeVi(iso?: string) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function AuditLogTable({
    selectedCode,
    onSelectedCodeChange,
    useSidebarMode = false,
}: AuditLogTableProps) {
    const [codeInput, setCodeInput] = useState('')
    const [offset, setOffset] = useState(0)
    const [appliedCode, setAppliedCode] = useState('')

    useEffect(() => {
        if (selectedCode === undefined) return
        const trimmed = selectedCode.trim()
        setCodeInput(trimmed)
        setAppliedCode(trimmed)
        setOffset(0)
    }, [selectedCode])

    const listQuery = useQuery({
        queryKey: ['service-request-audit-logs', appliedCode, offset],
        queryFn: () =>
            apiClient.getServiceRequestAuditLogs({
                code: appliedCode,
                limit: PAGE_SIZE,
                offset,
            }),
        enabled: !!appliedCode,
    })

    const items = listQuery.data?.data?.items ?? []
    const total = listQuery.data?.data?.pagination?.total ?? 0
    const headerRow = items[0]
    const serviceReqCode = headerRow?.serviceReqCode || headerRow?.hisServiceReqCode || '—'
    const page = Math.floor(offset / PAGE_SIZE) + 1
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

    const applySearch = () => {
        const trimmed = codeInput.trim()
        setAppliedCode(trimmed)
        onSelectedCodeChange?.(trimmed)
        setOffset(0)
    }

    const resetSearch = () => {
        setCodeInput('')
        setAppliedCode('')
        onSelectedCodeChange?.('')
        setOffset(0)
    }

    return (
        <div className="space-y-4 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-semibold">Lịch sử tác động</h1>
            
                {appliedCode && headerRow && (
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <span>
                            <span className="font-medium text-foreground">Mã y lệnh:</span>{' '}
                            {serviceReqCode}
                        </span>
                    </div>
                )}
            </div>

            {!useSidebarMode && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-2">
                            <Input
                                placeholder="Nhập mã GPB / HIS / tiếp nhận"
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') applySearch()
                                }}
                            />
                            <Button type="button" onClick={applySearch}>
                                Tìm
                            </Button>
                            <Button type="button" variant="outline" onClick={resetSearch}>
                                Xóa
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="pt-6">
                    {listQuery.isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Thời gian</TableHead>
                                        <TableHead>Người thực hiện</TableHead>
                                        <TableHead>Mô tả</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8">
                                                {appliedCode
                                                    ? 'Không có dữ liệu'
                                                    : useSidebarMode
                                                      ? 'Chọn phiếu ở sidebar để tra cứu'
                                                      : 'Nhập mã và bấm Tìm để tra cứu'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell>
                                                    {formatDateTimeVi(row.occurredAt)}
                                                </TableCell>
                                                <TableCell>
                                                    {row.actionUserFullName ||
                                                        row.actionUsername ||
                                                        '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <AuditLogDescriptionCell row={row} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-sm text-muted-foreground">
                                    Tổng {total} dòng — trang {page}/{totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={offset <= 0}
                                        onClick={() =>
                                            setOffset((o) => Math.max(0, o - PAGE_SIZE))
                                        }
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={offset + PAGE_SIZE >= total}
                                        onClick={() => setOffset((o) => o + PAGE_SIZE)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
