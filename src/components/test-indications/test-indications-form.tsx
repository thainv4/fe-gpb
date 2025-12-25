import TestIndicationsTable from "@/components/test-indications/test-indications-table";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs} from "@/components/ui/tabs";

export default function TestIndicationsForm() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-200">
                <CardTitle className="text-2xl font-bold">Tiếp nhận xét nghiệm</CardTitle>
            </CardHeader>

            <CardContent>
                <TestIndicationsTable/>
            </CardContent>
        </Card>
    )
}