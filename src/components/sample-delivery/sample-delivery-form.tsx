import SampleDeliveryTable from "@/components/sample-delivery/sample-delivery-table";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

export default function SampleDeliveryForm() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-200">
                <CardTitle className="text-2xl font-bold">Bàn giao mẫu bệnh phẩm</CardTitle>
            </CardHeader>

            <CardContent>
                <SampleDeliveryTable/>
            </CardContent>
        </Card>
    )
}

