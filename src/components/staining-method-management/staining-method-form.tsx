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
import { StainingMethod, StainingMethodRequest } from '@/lib/api/client'

const stainingMethodSchema = z.object({
    methodName: z.string().min(1, 'Tên phương pháp nhuộm là bắt buộc').max(255, 'Tên phương pháp nhuộm tối đa 255 ký tự'),
})

interface StainingMethodFormProps {
    initialData?: StainingMethod
    onSubmit: (data: StainingMethodRequest) => void
    isLoading: boolean
}

export function StainingMethodForm({ initialData, onSubmit, isLoading }: StainingMethodFormProps) {
    const form = useForm<StainingMethodRequest>({
        resolver: zodResolver(stainingMethodSchema),
        defaultValues: initialData ? {
            methodName: initialData.methodName,
        } : {
            methodName: '',
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="methodName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên phương pháp nhuộm</FormLabel>
                            <FormControl>
                                <Input placeholder="Nhập tên phương pháp nhuộm" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full medical-gradient" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Cập nhật phương pháp nhuộm' : 'Tạo phương pháp nhuộm'}
                </Button>
            </form>
        </Form>
    )
}
