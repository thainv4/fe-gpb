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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { SampleType, SampleTypeRequest } from '@/lib/api/client'

const sampleTypeSchema = z.object({
    typeCode: z.string().min(2, 'Mã loại mẫu tối thiểu 2 ký tự').max(50, 'Mã loại mẫu tối đa 50 ký tự'),
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
            typeCode: initialData?.typeCode ?? '',
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
        onSubmit(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="typeCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mã loại mẫu *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập mã loại mẫu" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="shortName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tên viết tắt</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập tên viết tắt" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="sortOrder"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Số thứ tự</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Nhập số thứ tự" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormField
                        control={form.control}
                        name="codeWidth"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Độ rộng phần số</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Nhập độ rộng (1-5)" min={1} max={5} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="allowDuplicate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cho phép mã trùng lặp</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value ? 'true' : 'false'}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="true">Có</SelectItem>
                                        <SelectItem value="false">Không</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="resetPeriod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Chu kỳ reset số thứ tự</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn chu kỳ" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="DAILY">Hàng ngày</SelectItem>
                                        <SelectItem value="MONTHLY">Hàng tháng</SelectItem>
                                        <SelectItem value="YEARLY">Hàng năm</SelectItem>
                                        <SelectItem value="NEVER">Không bao giờ</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

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
