'use client'

import { useState } from 'react'
import { useHisIntegration } from '@/hooks/use-his'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Building2,
    Send,
    Loader2,
    Code,
    AlertCircle
} from 'lucide-react'

export function HisApiCaller() {
    const { callHisApi, isCallingApi, isLoggedIn } = useHisIntegration()
    const [endpoint, setEndpoint] = useState('/api/patients')
    const [method, setMethod] = useState('GET')
    const [data, setData] = useState('')
    const [response, setResponse] = useState<Record<string, unknown> | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleApiCall = async () => {
        if (!isLoggedIn) {
            setError('Vui lòng đăng nhập HIS trước khi gọi API')
            return
        }

        setError(null)
        setResponse(null)

        try {
            let parsedData = null
            if (data.trim()) {
                try {
                    parsedData = JSON.parse(data)
                } catch {
                    setError('Dữ liệu JSON không hợp lệ')
                    return
                }
            }

            await callHisApi({
                endpoint,
                method,
                data: parsedData
            })

            // Note: callHisApi is a mutation, success/error handling is done in the hook
            // For now, we'll just show a success message
            setResponse({ message: 'API call initiated successfully' })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
        }
    }

    if (!isLoggedIn) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        HIS API Caller
                    </CardTitle>
                    <CardDescription>
                        Gọi các API của hệ thống HIS
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-sm">Vui lòng đăng nhập HIS trước khi sử dụng</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    HIS API Caller
                </CardTitle>
                <CardDescription>
                    Gọi các API của hệ thống HIS
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="endpoint">Endpoint</Label>
                        <Input
                            id="endpoint"
                            value={endpoint}
                            onChange={(e) => setEndpoint(e.target.value)}
                            placeholder="/api/patients"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="method">Method</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="data">Data (JSON)</Label>
                    <Textarea
                        id="data"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        placeholder='{"patientId": "12345"}'
                        rows={4}
                    />
                </div>

                <Button
                    onClick={handleApiCall}
                    disabled={isCallingApi}
                    className="w-full"
                >
                    {isCallingApi ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang gọi API...
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4 mr-2" />
                            Gọi HIS API
                        </>
                    )}
                </Button>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Lỗi</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                )}

                {response && (
                    <div className="space-y-2">
                        <Label>Response</Label>
                        <div className="p-3 bg-gray-50 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Code className="h-4 w-4" />
                                <span className="text-sm font-medium">JSON Response</span>
                            </div>
                            <pre className="text-xs overflow-auto max-h-64">
                                {JSON.stringify(response, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
