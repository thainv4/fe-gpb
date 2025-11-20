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
import { UnitOfMeasure, UnitOfMeasureRequest } from '@/lib/api/client'

const unitOfMeasureSchema = z.object({
    unitOfMeasureCode: z.string().min(1, 'Mã đơn vị tính là bắt buộc').max(20, 'Mã đơn vị tính tối đa 20 ký tự'),
    unitOfMeasureName: z.string().min(1, 'Tên đơn vị tính là bắt buộc').max(100, 'Tên đơn vị tính tối đa 100 ký tự'),
    description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional(),
    mapping: z.string().max(500, 'Mapping tối đa 500 ký tự').optional(),
    isActive: z.boolean().default(true),
})

type UnitOfMeasureFormData = z.infer<typeof unitOfMeasureSchema>

interface UnitOfMeasureFormProps {
    initialData?: UnitOfMeasure
    onSubmit: (data: UnitOfMeasureRequest) => void
    isLoading?: boolean
}

export function UnitOfMeasureForm({ initialData, onSubmit, isLoading = false }: UnitOfMeasureFormProps) {
    const form = useForm<UnitOfMeasureFormData>({
        resolver: zodResolver(unitOfMeasureSchema),
        defaultValues: {
            unitOfMeasureCode: initialData?.unitOfMeasureCode || '',
            unitOfMeasureName: initialData?.unitOfMeasureName || '',
            description: initialData?.description || '',
            mapping: initialData?.mapping || '',
            isActive: initialData?.isActiveFlag === 1,
        },
    })

    function handleSubmit(data: UnitOfMeasureFormData) {
        onSubmit(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="unitOfMeasureCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mã đơn vị tính *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập mã đơn vị tính" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="unitOfMeasureName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tên đơn vị tính *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập tên đơn vị tính" {...field} />
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
                                <Textarea placeholder="Nhập mô tả đơn vị tính" {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="mapping"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mapping HIS (JSON)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder='{"hisCode": "ML", "hisName": "Milliliter"}'
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
                    {initialData ? 'Cập nhật đơn vị tính' : 'Tạo đơn vị tính'}
                </Button>
            </form>
        </Form>
    )
}
