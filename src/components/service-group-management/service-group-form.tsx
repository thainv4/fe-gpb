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
import { ServiceGroup, ServiceGroupRequest } from '@/lib/api/client'

const serviceGroupSchema = z.object({
    serviceGroupCode: z.string().min(1, 'Mã nhóm dịch vụ là bắt buộc').max(20, 'Mã nhóm dịch vụ tối đa 20 ký tự'),
    serviceGroupName: z.string().min(1, 'Tên nhóm dịch vụ là bắt buộc').max(100, 'Tên nhóm dịch vụ tối đa 100 ký tự'),
    shortName: z.string().max(50, 'Tên viết tắt tối đa 50 ký tự').optional(),
    mapping: z.string().max(500, 'Mapping tối đa 500 ký tự').optional(),
    isActive: z.boolean().default(true),
})

type ServiceGroupFormData = z.infer<typeof serviceGroupSchema>

interface ServiceGroupFormProps {
    initialData?: ServiceGroup
    onSubmit: (data: ServiceGroupRequest) => void
    isLoading?: boolean
}

export function ServiceGroupForm({ initialData, onSubmit, isLoading = false }: ServiceGroupFormProps) {
    const form = useForm<ServiceGroupFormData>({
        resolver: zodResolver(serviceGroupSchema),
        defaultValues: {
            serviceGroupCode: initialData?.serviceGroupCode || '',
            serviceGroupName: initialData?.serviceGroupName || '',
            shortName: initialData?.shortName || '',
            mapping: initialData?.mapping || '',
            isActive: initialData?.isActiveFlag === 1,
        },
    })

    function handleSubmit(data: ServiceGroupFormData) {
        onSubmit(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="serviceGroupCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mã nhóm dịch vụ *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập mã nhóm dịch vụ" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="serviceGroupName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tên nhóm dịch vụ *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập tên nhóm dịch vụ" {...field} />
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
                    name="mapping"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mapping HIS (JSON)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder='{"hisCode": "LAB", "hisName": "Laboratory"}'
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
                    {initialData ? 'Cập nhật nhóm dịch vụ' : 'Tạo nhóm dịch vụ'}
                </Button>
            </form>
        </Form>
    )
}
