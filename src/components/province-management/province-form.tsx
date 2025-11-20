'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import { Province, ProvinceRequest } from '@/lib/api/client'

const provinceSchema = z.object({
    provinceCode: z.string().min(1, 'Mã tỉnh là bắt buộc').max(10, 'Mã tỉnh tối đa 10 ký tự'),
    provinceName: z.string().min(1, 'Tên tỉnh là bắt buộc').max(100, 'Tên tỉnh tối đa 100 ký tự'),
    shortName: z.string().max(50, 'Tên viết tắt tối đa 50 ký tự').optional(),
    isActive: z.boolean().optional(),
})

interface ProvinceFormProps {
    initialData?: Province
    onSubmit: (data: ProvinceRequest) => void
    isLoading: boolean
}

export function ProvinceForm({ initialData, onSubmit, isLoading }: ProvinceFormProps) {
    const form = useForm<ProvinceRequest>({
        resolver: zodResolver(provinceSchema),
        defaultValues: initialData ? {
            provinceCode: initialData.provinceCode,
            provinceName: initialData.provinceName,
            shortName: initialData.shortName || '',
            isActive: initialData.isActive === 1,
        } : {
            provinceCode: '',
            provinceName: '',
            shortName: '',
            isActive: true,
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="provinceCode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mã tỉnh</FormLabel>
                            <FormControl>
                                <Input placeholder="Nhập mã tỉnh" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="provinceName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên tỉnh</FormLabel>
                            <FormControl>
                                <Input placeholder="Nhập tên tỉnh" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
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
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Trạng thái hoạt động</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                    Tỉnh này có đang hoạt động không?
                                </div>
                            </div>
                            <FormControl>
                                <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4"
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full medical-gradient" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Cập nhật tỉnh' : 'Tạo tỉnh'}
                </Button>
            </form>
        </Form>
    )
}
