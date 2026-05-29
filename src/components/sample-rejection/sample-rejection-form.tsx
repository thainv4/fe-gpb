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
import { SampleRejection, SampleRejectionRequest } from '@/lib/api/client'

const sampleRejectionSchema = z.object({
    patientName: z.string().min(1, 'Họ và tên bệnh nhân là bắt buộc').max(200),
    dateOfBirth: z.string().min(1, 'Sinh nhật là bắt buộc'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { required_error: 'Giới tính là bắt buộc' }),
    diagnosis: z.string().min(1, 'Chẩn đoán bệnh là bắt buộc').max(500),
    testIndication: z.string().min(1, 'Chỉ định xét nghiệm là bắt buộc').max(500),
    orderingDoctor: z.string().min(1, 'BS chỉ định là bắt buộc').max(200),
    patientAddress: z.string().min(1, 'Địa chỉ bệnh nhân là bắt buộc').max(500),
    sampleCode: z.string().min(1, 'Mã bệnh phẩm là bắt buộc').max(100),
    samplingSite: z.string().min(1, 'Vị trí lấy mẫu là bắt buộc').max(200),
    samplingMethod: z.string().min(1, 'Phương pháp lấy mẫu là bắt buộc').max(200),
    rejectionTimeLocal: z.string().min(1, 'Thời gian từ chối là bắt buộc'),
    rejectionReason: z.string().min(1, 'Lý do từ chối là bắt buộc').max(1000),
})

type SampleRejectionFormValues = z.infer<typeof sampleRejectionSchema>

function toDatetimeLocalValue(iso: string): string {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toIsoFromDatetimeLocal(value: string): string {
    return new Date(value).toISOString()
}

function getDefaultRejectionTimeLocal(): string {
    return toDatetimeLocalValue(new Date().toISOString())
}

interface SampleRejectionFormProps {
    initialData?: SampleRejection
    onSubmit: (data: SampleRejectionRequest) => void
    isLoading: boolean
}

export function SampleRejectionForm({ initialData, onSubmit, isLoading }: SampleRejectionFormProps) {
    const form = useForm<SampleRejectionFormValues>({
        resolver: zodResolver(sampleRejectionSchema),
        defaultValues: initialData
            ? {
                patientName: initialData.patientName,
                dateOfBirth: initialData.dateOfBirth,
                gender: initialData.gender,
                diagnosis: initialData.diagnosis,
                testIndication: initialData.testIndication,
                orderingDoctor: initialData.orderingDoctor,
                patientAddress: initialData.patientAddress,
                sampleCode: initialData.sampleCode,
                samplingSite: initialData.samplingSite,
                samplingMethod: initialData.samplingMethod,
                rejectionTimeLocal: toDatetimeLocalValue(initialData.rejectionTime),
                rejectionReason: initialData.rejectionReason,
            }
            : {
                patientName: '',
                dateOfBirth: '',
                gender: undefined,
                diagnosis: '',
                testIndication: '',
                orderingDoctor: '',
                patientAddress: '',
                sampleCode: '',
                samplingSite: '',
                samplingMethod: '',
                rejectionTimeLocal: getDefaultRejectionTimeLocal(),
                rejectionReason: '',
            },
    })

    const handleSubmit = (values: SampleRejectionFormValues) => {
        onSubmit({
            patientName: values.patientName.trim(),
            dateOfBirth: values.dateOfBirth,
            gender: values.gender,
            diagnosis: values.diagnosis.trim(),
            testIndication: values.testIndication.trim(),
            orderingDoctor: values.orderingDoctor.trim(),
            patientAddress: values.patientAddress.trim(),
            sampleCode: values.sampleCode.trim(),
            samplingSite: values.samplingSite.trim(),
            samplingMethod: values.samplingMethod.trim(),
            rejectionTime: toIsoFromDatetimeLocal(values.rejectionTimeLocal),
            rejectionReason: values.rejectionReason.trim(),
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="patientName"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                                <FormLabel>Họ và tên BN</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập họ và tên bệnh nhân" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sinh nhật</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Giới tính</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn giới tính" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="MALE">Nam</SelectItem>
                                        <SelectItem value="FEMALE">Nữ</SelectItem>
                                        <SelectItem value="OTHER">Khác</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="diagnosis"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                                <FormLabel>Chẩn đoán bệnh</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Nhập chẩn đoán bệnh" rows={2} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="testIndication"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                                <FormLabel>Chỉ định XN</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập chỉ định xét nghiệm" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="orderingDoctor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>BS chỉ định</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập tên bác sĩ chỉ định" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="sampleCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mã bệnh phẩm</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập mã bệnh phẩm" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="patientAddress"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                                <FormLabel>Địa chỉ bệnh nhân</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Nhập địa chỉ bệnh nhân" rows={2} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="samplingSite"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vị trí lấy mẫu</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập vị trí lấy mẫu" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="samplingMethod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phương pháp lấy mẫu</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập phương pháp lấy mẫu" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="rejectionTimeLocal"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                                <FormLabel>Thời gian từ chối</FormLabel>
                                <FormControl>
                                    <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="rejectionReason"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                                <FormLabel>Lý do từ chối</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Nhập lý do từ chối" rows={3} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit" className="w-full medical-gradient" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Cập nhật' : 'Thêm mới'}
                </Button>
            </form>
        </Form>
    )
}
