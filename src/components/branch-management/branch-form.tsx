'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Branch, BranchRequest, Province, Ward } from '@/lib/api/client'

const branchSchema = z.object({
    branchCode: z.string().min(1, 'Mã chi nhánh là bắt buộc').max(20, 'Mã chi nhánh tối đa 20 ký tự'),
    branchName: z.string().min(1, 'Tên chi nhánh là bắt buộc').max(200, 'Tên chi nhánh tối đa 200 ký tự'),
    shortName: z.string().max(50, 'Tên viết tắt tối đa 50 ký tự').optional(),
    provinceId: z.string().min(1, 'Tỉnh/thành phố là bắt buộc'),
    wardId: z.string().min(1, 'Phường/xã là bắt buộc'),
    address: z.string().min(1, 'Địa chỉ là bắt buộc').max(500, 'Địa chỉ tối đa 500 ký tự'),
    phoneNumber: z.string().max(20, 'Số điện thoại tối đa 20 ký tự').optional(),
    hospitalLevel: z.string().max(50, 'Cấp bậc bệnh viện tối đa 50 ký tự').optional(),
    representative: z.string().max(100, 'Người đại diện tối đa 100 ký tự').optional(),
    bhytCode: z.string().max(20, 'Mã BHYT tối đa 20 ký tự').optional(),
})

type BranchFormData = z.infer<typeof branchSchema>

interface BranchFormProps {
    initialData?: Branch
    onSubmit: (data: BranchRequest) => void
    isLoading?: boolean
    provinces: Province[]
    wards: Ward[]
}

export function BranchForm({ initialData, onSubmit, isLoading = false, provinces, wards }: BranchFormProps) {
    const form = useForm<BranchFormData>({
        resolver: zodResolver(branchSchema),
        defaultValues: {
            branchCode: initialData?.branchCode || '',
            branchName: initialData?.branchName || '',
            shortName: initialData?.shortName || '',
            provinceId: initialData?.provinceId || '',
            wardId: initialData?.wardId || '',
            address: initialData?.address || '',
            phoneNumber: initialData?.phoneNumber || '',
            hospitalLevel: initialData?.hospitalLevel || '',
            representative: initialData?.representative || '',
            bhytCode: initialData?.bhytCode || '',
        },
    })

    function handleSubmit(data: BranchFormData) {
        onSubmit(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="branchCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mã chi nhánh *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập mã chi nhánh" {...field} />
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
                </div>

                <FormField
                    control={form.control}
                    name="branchName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên chi nhánh *</FormLabel>
                            <FormControl>
                                <Input placeholder="Nhập tên chi nhánh" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="provinceId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tỉnh/Thành phố *</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={!provinces || provinces.length === 0}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={
                                                provinces && provinces.length > 0
                                                    ? "Chọn tỉnh/thành phố"
                                                    : "Đang tải..."
                                            } />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {provinces && provinces.length > 0 ? (
                                            provinces.map((province) => (
                                                <SelectItem key={province.id} value={province.id}>
                                                    {province.provinceName}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-data" disabled>Không có dữ liệu</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="wardId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phường/Xã *</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={!wards || wards.length === 0}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={
                                                wards && wards.length > 0
                                                    ? "Chọn phường/xã"
                                                    : "Đang tải..."
                                            } />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {wards && wards.length > 0 ? (
                                            wards.map((ward) => (
                                                <SelectItem key={ward.id} value={ward.id}>
                                                    {ward.wardName}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-data" disabled>Không có dữ liệu</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Địa chỉ *</FormLabel>
                            <FormControl>
                                <Input placeholder="Nhập địa chỉ chi tiết" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Số điện thoại</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập số điện thoại" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="hospitalLevel"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cấp bậc bệnh viện</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn cấp bậc" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Hạng Đặc biệt">Hạng Đặc biệt</SelectItem>
                                        <SelectItem value="Hạng I">Hạng I</SelectItem>
                                        <SelectItem value="Hạng II">Hạng II</SelectItem>
                                        <SelectItem value="Hạng III">Hạng III</SelectItem>
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
                        name="representative"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Người đại diện</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập tên người đại diện" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="bhytCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mã BHYT</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập mã BHYT" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button
                        type="submit"
                        className="medical-gradient"
                        disabled={isLoading}
                    >
                        {isLoading && 'Đang xử lý...'}
                        {!isLoading && initialData && 'Cập nhật'}
                        {!isLoading && !initialData && 'Tạo mới'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
