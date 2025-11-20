'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Category, CategoryRequest } from '@/lib/api/client'

const categorySchema = z.object({
    name: z.string().min(1, 'Tên danh mục là bắt buộc'),
    code: z.string().min(1, 'Mã danh mục là bắt buộc'),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryFormProps {
    initialData?: Category
    onSubmit: (data: CategoryRequest) => void
    isLoading?: boolean
}

export function CategoryForm({ initialData, onSubmit, isLoading = false }: CategoryFormProps) {
    const form = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: initialData?.name || '',
            code: initialData?.code || '',
            description: initialData?.description || '',
            isActive: initialData?.isActive ?? true,
        },
    })

    function handleSubmit(data: CategoryFormData) {
        onSubmit(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên danh mục *</FormLabel>
                            <FormControl>
                                <Input placeholder="Nhập tên danh mục" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mã danh mục *</FormLabel>
                            <FormControl>
                                <Input placeholder="Nhập mã danh mục" {...field} />
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
                                <Input placeholder="Nhập mô tả (tùy chọn)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <Button
                        type="submit"
                        className="medical-gradient"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang xử lý...' : initialData ? 'Cập nhật' : 'Tạo mới'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
