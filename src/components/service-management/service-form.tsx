'use client'

import { useEffect, useState } from 'react'
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
import { apiClient, Service, ServiceRequest, ServiceGroup, UnitOfMeasure } from '@/lib/api/client'

const serviceSchema = z.object({
    serviceCode: z.string().min(1, 'Mã dịch vụ là bắt buộc').max(20, 'Mã dịch vụ tối đa 20 ký tự'),
    serviceName: z.string().min(1, 'Tên dịch vụ là bắt buộc').max(100, 'Tên dịch vụ tối đa 100 ký tự'),
    shortName: z.string().max(50, 'Tên viết tắt tối đa 50 ký tự').optional(),
    serviceGroupId: z.string().optional(),
    unitOfMeasureId: z.string().optional(),
    mapping: z.string().max(500, 'Mapping tối đa 500 ký tự').optional(),
    numOrder: z.number().min(0, 'Thứ tự phải >= 0').optional(),
    currentPrice: z.number().min(0, 'Giá phải >= 0').optional(),
    parentServiceId: z.string().optional(),
    isActive: z.boolean().default(true),
})

type ServiceFormData = z.infer<typeof serviceSchema>

interface ServiceFormProps {
    initialData?: Service
    onSubmit: (data: ServiceRequest) => void
    isLoading?: boolean
}

export function ServiceForm({ initialData, onSubmit, isLoading = false }: ServiceFormProps) {
    const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([])
    const [unitOfMeasures, setUnitOfMeasures] = useState<UnitOfMeasure[]>([])
    const [services, setServices] = useState<Service[]>([])

    const form = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            serviceCode: initialData?.serviceCode || '',
            serviceName: initialData?.serviceName || '',
            shortName: initialData?.shortName || '',
            serviceGroupId: initialData?.serviceGroupId || '',
            unitOfMeasureId: initialData?.unitOfMeasureId || '',
            mapping: initialData?.mapping || '',
            numOrder: initialData?.numOrder || 0,
            currentPrice: initialData?.currentPrice || 0,
            parentServiceId: initialData?.parentServiceId || '',
            isActive: initialData?.isActiveFlag === 1,
        },
    })

    useEffect(() => {
        async function fetchData() {
            try {
                const [serviceGroupsRes, unitOfMeasuresRes, servicesRes] = await Promise.all([
                    apiClient.getServiceGroups(),
                    apiClient.getUnitOfMeasures(),
                    apiClient.getServices(),
                ])

                if (serviceGroupsRes.success && serviceGroupsRes.data) {
                    setServiceGroups(serviceGroupsRes.data.items)
                }
                if (unitOfMeasuresRes.success && unitOfMeasuresRes.data) {
                    setUnitOfMeasures(unitOfMeasuresRes.data.items)
                }
                if (servicesRes.success && servicesRes.data) {
                    setServices(servicesRes.data.items)
                }
            } catch (error) {
                console.error('Error fetching data:', error)
            }
        }

        fetchData()
    }, [])

    function handleSubmit(data: ServiceFormData) {
        onSubmit(data)
    }

    const filteredServices = services.filter(service => service.id !== initialData?.id)

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="serviceCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mã dịch vụ *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập mã dịch vụ" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="serviceName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tên dịch vụ *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập tên dịch vụ" {...field} />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="serviceGroupId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nhóm dịch vụ</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn nhóm dịch vụ" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {serviceGroups.map((group) => (
                                            <SelectItem key={group.id} value={group.id}>
                                                {group.serviceGroupName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="unitOfMeasureId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Đơn vị tính</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn đơn vị tính" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {unitOfMeasures.map((unit) => (
                                            <SelectItem key={unit.id} value={unit.id}>
                                                {unit.unitOfMeasureName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="numOrder"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Thứ tự</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Nhập thứ tự"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="currentPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Giá hiện tại (VNĐ)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Nhập giá"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="parentServiceId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dịch vụ cha</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn dịch vụ cha (tùy chọn)" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {filteredServices.map((service) => (
                                        <SelectItem key={service.id} value={service.id}>
                                            {service.serviceName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                    placeholder='{"hisCode": "LAB001", "hisName": "Blood Test"}'
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
                    {initialData ? 'Cập nhật dịch vụ' : 'Tạo dịch vụ'}
                </Button>
            </form>
        </Form>
    )
}
