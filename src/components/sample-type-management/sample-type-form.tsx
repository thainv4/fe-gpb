'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import { SampleType, SampleTypeRequest } from '@/lib/api/client'

const sampleTypeSchema = z.object({
    typeName: z.string().min(2, 'Tên loại mẫu tối thiểu 2 ký tự').max(200, 'Tên loại mẫu tối đa 200 ký tự'),
    shortName: z.string().max(100, 'Tên viết tắt tối đa 100 ký tự').optional(),
    description: z.string().max(2000, 'Mô tả tối đa 2000 ký tự').optional(),
    sortOrder: z.coerce.number().optional(),
    codePrefix: z.string().min(1, 'Tiền tố mã là bắt buộc').max(5, 'Tiền tố mã tối đa 5 ký tự'),
    codeWidth: z.coerce.number().min(1).max(5).optional(),
    allowDuplicate: z.boolean().optional(),
    resetPeriod: z.enum(['DAILY', 'MONTHLY', 'YEARLY', 'NEVER']).optional(),
})

type SampleTypeFormData = z.infer<typeof sampleTypeSchema>

interface SampleTypeFormProps {
    initialData?: SampleType
    onSubmit: (data: SampleTypeRequest) => void
    isLoading?: boolean
}

export function SampleTypeForm({ initialData, onSubmit, isLoading = false }: SampleTypeFormProps) {
    const form = useForm<SampleTypeFormData>({
        resolver: zodResolver(sampleTypeSchema),
        defaultValues: {
            typeName: initialData?.typeName ?? '',
            shortName: initialData?.shortName ?? '',
            description: initialData?.description ?? '',
            sortOrder: initialData?.sortOrder ?? 1,
            codePrefix: initialData?.codePrefix ?? '',
            codeWidth: initialData?.codeWidth ?? 4,
            allowDuplicate: initialData?.allowDuplicate ?? false,
            resetPeriod: initialData?.resetPeriod ?? 'MONTHLY',
        },
    })

    function handleSubmit(data: SampleTypeFormData) {
        // Đảm bảo các giá trị mặc định luôn được gửi lên
        const submitData: SampleTypeRequest = {
            ...data,
            allowDuplicate: false,
            resetPeriod: 'MONTHLY' as const,
            codeWidth: 4,
            sortOrder: 1,
        }
        onSubmit(submitData)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Hàng 1: Tên loại mẫu + Tiền tố mã tiếp nhận */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="typeName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tên loại mẫu *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập tên loại mẫu" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="codePrefix"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tiền tố mã tiếp nhận *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập tiền tố mã (1-5 ký tự)" maxLength={5} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Hàng 2: Mô tả (full width) */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mô tả</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Nhập mô tả loại mẫu" {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full medical-gradient" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Cập nhật loại mẫu' : 'Tạo loại mẫu'}
                </Button>
            </form>
        </Form>
    )
}
