'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Search, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import { apiClient, ResultTemplate } from '@/lib/api/client'

interface ResultTemplateSelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (template: string, templateName: string) => void
    onSelectFields?: (resultDescription: string, resultConclude: string, resultNote: string, templateName: string) => void
}

export function ResultTemplateSelector({
    open,
    onOpenChange,
    onSelect,
    onSelectFields,
}: ResultTemplateSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

    // Fetch templates
    const { data: templatesData, isLoading } = useQuery({
        queryKey: ['result-templates', searchTerm],
        queryFn: async () => {
            if (searchTerm) {
                return apiClient.searchResultTemplates({
                    keyword: searchTerm,
                    limit: 50,
                    offset: 0,
                })
            }
            return apiClient.getResultTemplates({
                limit: 50,
                offset: 0,
            })
        },
        enabled: open,
    })

    const templates = templatesData?.data?.data || []

    // Fetch template detail when a template is selected
    const { data: templateDetailData, isLoading: isLoadingDetail } = useQuery({
        queryKey: ['result-template', selectedTemplateId],
        queryFn: () => apiClient.getResultTemplate(selectedTemplateId!),
        enabled: !!selectedTemplateId,
    })

    // Helper function to extract microscopic description from resultDescription
    const extractMicroscopicDescription = (description: string): string => {
        // Tìm phần MÔ TẢ VI THỂ (bao gồm cả tiêu đề)
        const microscopicMatch = description.match(/<p style="padding-left: 0; margin-left: 0;"><strong>MÔ TẢ VI THỂ:<\/strong><\/p>(.*?)$/s);
        
        if (microscopicMatch) {
            const content = microscopicMatch[1].trim();
            // Trả về với tiêu đề
            return `<p style="padding-left: 0; margin-left: 0;"><strong>MÔ TẢ VI THỂ:</strong></p>${content}`;
        }
        
        // Nếu không tìm thấy, trả về toàn bộ description hoặc default
        return description || `<p style="padding-left: 0; margin-left: 0;"><strong>MÔ TẢ VI THỂ:</strong></p><p style="padding-left: 20px;"></p>`;
    }

    const handleSelectTemplate = (template: ResultTemplate) => {
        setSelectedTemplateId(template.id)
    }

    const handleConfirmSelection = () => {
        if (!selectedTemplateId) return

        // Sử dụng template detail từ API nếu có, nếu không thì dùng từ danh sách
        const templateToUse = templateDetailData?.data || templates.find(t => t.id === selectedTemplateId)
        
        if (templateToUse) {
            // Extract microscopic description từ resultDescription
            const microscopicDescription = extractMicroscopicDescription(templateToUse.resultDescription || '')
            
            // Nếu có onSelectFields, gọi với 3 fields riêng biệt
            if (onSelectFields) {
                onSelectFields(
                    microscopicDescription, // Gán mô tả vi thể cho resultDescription
                    templateToUse.resultConclude || '',
                    templateToUse.resultNote || '',
                    templateToUse.templateName
                )
            } else {
                // Fallback: Combine all fields with HTML format for backward compatibility
                let templateContent = microscopicDescription

                if (templateToUse.resultConclude && templateToUse.resultConclude.trim()) {
                    templateContent += templateToUse.resultConclude
                }

                if (templateToUse.resultNote && templateToUse.resultNote.trim()) {
                    templateContent += templateToUse.resultNote
                }

                onSelect(templateContent, templateToUse.templateName)
            }
            onOpenChange(false)
            setSelectedTemplateId(null)
            setSearchTerm('')
        }
    }

    const handleCancel = () => {
        onOpenChange(false)
        setSelectedTemplateId(null)
        setSearchTerm('')
    }

    const emptyMessage = searchTerm ? 'Không tìm thấy mẫu kết quả phù hợp' : 'Chưa có mẫu kết quả nào'

    let templatesContent
    if (isLoading) {
        templatesContent = (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-medical-600" />
                <span className="ml-2 text-muted-foreground">
                    Đang tải danh sách mẫu...
                </span>
            </div>
        )
    } else if (templates.length === 0) {
        templatesContent = (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">
                    {emptyMessage}
                </p>
            </div>
        )
    } else {
        templatesContent = (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead className="w-[120px]">Mã mẫu</TableHead>
                        <TableHead>Tên mẫu / Mô tả</TableHead>
                        <TableHead className="w-[200px]">Kết luận</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {templates.map((template) => (
                        <TableRow
                            key={template.id}
                            className={`cursor-pointer hover:bg-muted/50 ${selectedTemplateId === template.id
                                ? 'bg-medical-50 hover:bg-medical-100'
                                : ''
                                }`}
                            onClick={() => handleSelectTemplate(template)}
                        >
                            <TableCell className="text-center">
                                {selectedTemplateId === template.id && (
                                    <CheckCircle2
                                        className="h-5 w-5 text-medical-600 inline-block" />
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="text-sm font-medium text-gray-700">
                                    {template.resultTemplateCode || (
                                        <span className="text-muted-foreground italic text-xs">
                                            Chưa có mã
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-start space-x-3">
                                    <div
                                        className="p-2 bg-medical-100 rounded-full flex-shrink-0 mt-1">
                                        <FileText className="h-4 w-4 text-medical-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 mb-1">
                                            {template.templateName}
                                        </div>
                                        <div className="text-xs text-gray-600 line-clamp-3 whitespace-pre-wrap">
                                            {template.resultDescription}
                                        </div>
                                        {template.resultNote && (
                                            <div className="text-xs text-muted-foreground mt-1 italic">
                                                Ghi chú: {template.resultNote.substring(0, 50)}...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="text-xs text-gray-600 line-clamp-2 whitespace-pre-wrap">
                                    {template.resultConclude}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Chọn mẫu kết quả xét nghiệm
                    </DialogTitle>
                    <DialogDescription>
                        Chọn một mẫu kết quả có sẵn để sử dụng
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input
                            placeholder="Tìm kiếm mẫu kết quả..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Templates List */}
                    <div className="border rounded-lg">
                        <div className="h-[400px] overflow-y-auto">
                            {templatesContent}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleConfirmSelection}
                            disabled={!selectedTemplateId || isLoadingDetail}
                            className="medical-gradient"
                        >
                            {isLoadingDetail ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang tải...
                                </>
                            ) : (
                                'Chọn mẫu này'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

