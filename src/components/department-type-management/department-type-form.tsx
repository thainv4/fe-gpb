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
import { DepartmentType, DepartmentTypeRequest } from '@/lib/api/client'

const departmentTypeSchema = z.object({
    typeCode: z.string().min(1, 'Mã loại khoa là bắt buộc').max(20, 'Mã loại khoa tối đa 20 ký tự'),
    typeName: z.string().min(1, 'Tên loại khoa là bắt buộc').max(100, 'Tên loại khoa tối đa 100 ký tự'),
    description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional(),
    isActive: z.boolean().default(true),
})

type DepartmentTypeFormData = z.infer<typeof departmentTypeSchema>

interface DepartmentTypeFormProps {
    initialData?: DepartmentType
    onSubmit: (data: DepartmentTypeRequest) => void
    isLoading?: boolean
}

export function DepartmentTypeForm({ initialData, onSubmit, isLoading = false }: DepartmentTypeFormProps) {
    const form = useForm<DepartmentTypeFormData>({
        resolver: zodResolver(departmentTypeSchema),
        defaultValues: {
            typeCode: initialData?.typeCode || '',
            typeName: initialData?.typeName || '',
            description: initialData?.description || '',
            isActive: initialData?.isActiveFlag === 1,
        },
    })

    function handleSubmit(data: DepartmentTypeFormData) {
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
                                <FormLabel>Mã loại khoa *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập mã loại khoa" {...field} />
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
                                <FormLabel>Tên loại khoa *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập tên loại khoa" {...field} />
                                </FormControl>
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
                                <Textarea placeholder="Nhập mô tả loại khoa" {...field} />
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
                    {initialData ? 'Cập nhật loại khoa' : 'Tạo loại khoa'}
                </Button>
            </form>
        </Form>
    )
}
