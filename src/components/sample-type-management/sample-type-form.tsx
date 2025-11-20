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
    typeCode: z.string().min(1, 'Mã loại mẫu là bắt buộc').max(20, 'Mã loại mẫu tối đa 20 ký tự'),
    typeName: z.string().min(1, 'Tên loại mẫu là bắt buộc').max(100, 'Tên loại mẫu tối đa 100 ký tự'),
    shortName: z.string().max(50, 'Tên viết tắt tối đa 50 ký tự').optional(),
    codeGenerationRule: z.string().max(500, 'Quy tắc sinh mã tối đa 500 ký tự').optional(),
    description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional(),
    isActive: z.boolean().default(true),
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
            codeGenerationRule: initialData?.codeGenerationRule ?? '',
            description: initialData?.description ?? '',
            isActive: initialData?.isActiveFlag === 1,
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
                    name="codeGenerationRule"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quy tắc sinh mã (JSON)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder='{"prefix": "BLD", "sequence": "0001", "format": "{PREFIX}-{SEQUENCE}"}'
                                    {...field}
                                    rows={3}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Trạng thái</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value ? 'true' : 'false'}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn trạng thái" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="true">Hoạt động</SelectItem>
                                    <SelectItem value="false">Không hoạt động</SelectItem>
                                </SelectContent>
                            </Select>
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
