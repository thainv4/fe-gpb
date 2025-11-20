'use client'

import { useEffect, useState } from 'react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { Ward, WardRequest, Province, apiClient } from '@/lib/api/client'

const wardSchema = z.object({
    wardCode: z.string().min(1, 'Mã phường/xã là bắt buộc').max(10, 'Mã phường/xã tối đa 10 ký tự'),
    wardName: z.string().min(1, 'Tên phường/xã là bắt buộc').max(100, 'Tên phường/xã tối đa 100 ký tự'),
    shortName: z.string().max(50, 'Tên viết tắt tối đa 50 ký tự').optional(),
    sortOrder: z.coerce.number().min(1, 'Thứ tự sắp xếp phải từ 1-999').max(999, 'Thứ tự sắp xếp phải từ 1-999'),
    provinceId: z.string().min(1, 'Tỉnh/thành phố là bắt buộc'),
    isActive: z.boolean().optional(),
})

interface WardFormProps {
    initialData?: Ward
    onSubmit: (data: WardRequest) => void
    isLoading: boolean
}

export function WardForm({ initialData, onSubmit, isLoading }: WardFormProps) {
    const form = useForm<WardRequest>({
        resolver: zodResolver(wardSchema),
        defaultValues: initialData ? {
            wardCode: initialData.wardCode,
            wardName: initialData.wardName,
            shortName: initialData.shortName || '',
            provinceId: initialData.provinceId,
            sortOrder: initialData.sortOrder || 1,
            isActive: initialData.isActive === 1,
        } : {
            wardCode: '',
            wardName: '',
            shortName: '',
            provinceId: '',
            sortOrder: 1,
            isActive: true,
        },
    })

    const [provinces, setProvinces] = useState<Province[]>([])
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(true)

    useEffect(() => {
        async function fetchProvinces() {
            try {
                setIsLoadingProvinces(true)
                const res = await apiClient.getProvinces({ limit: 100, offset: 0, isActive: true })
                console.log('Provinces API response:', res)
                // API trả về data.provinces chứ không phải data.items
                if (res.success && res.data && res.data.provinces) {
                    setProvinces(res.data.provinces)
                    console.log('Provinces updated successfully:', res.data.provinces)
                } else {
                    setProvinces([])
                    console.warn('No provinces data found in response')
                }
            } catch (error) {
                console.error('Failed to fetch provinces:', error)
                setProvinces([])
            } finally {
                setIsLoadingProvinces(false)
            }
        }
        fetchProvinces()
    }, [])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="wardCode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mã phường/xã</FormLabel>
                            <FormControl>
                                <Input placeholder="Nhập mã phường/xã" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="wardName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên phường/xã</FormLabel>
                            <FormControl>
                                <Input placeholder="Nhập tên phường/xã" {...field} />
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
                    name="sortOrder"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Thứ tự sắp xếp</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Nhập thứ tự sắp xếp (1-999)"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="provinceId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tỉnh/Thành phố</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn tỉnh/thành phố" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {isLoadingProvinces ? (
                                        <div className="px-2 py-2 text-sm text-muted-foreground">
                                            Đang tải...
                                        </div>
                                    ) : provinces && provinces.length > 0 ? (
                                        provinces.map((province) => (
                                            <SelectItem key={province.id} value={province.id}>
                                                {province.provinceName}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="px-2 py-2 text-sm text-muted-foreground">
                                            Không có dữ liệu
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
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
                                    Phường/xã này có đang hoạt động không?
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
                    {initialData ? 'Cập nhật phường/xã' : 'Tạo phường/xã'}
                </Button>
            </form>
        </Form>
    )
}
