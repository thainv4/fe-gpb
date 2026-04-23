/** Tailwind classes cho badge trạng thái workflow (theo `stateCode`). */
export function getWorkflowStateBadgeClasses(stateCode?: string): string {
    switch (stateCode) {
        case 'SAMPLE_COLLECTION':
            return 'bg-yellow-100 text-yellow-800'
        case 'SAMPLE_HANDOVER':
            return 'bg-blue-100 text-blue-800'
        case 'SAMPLE_SEPARATION':
            return 'bg-purple-100 text-purple-800'
        case 'MACHINE_RUNNING':
            return 'bg-indigo-100 text-indigo-800'
        case 'RESULT_EVALUATION':
            return 'bg-orange-100 text-orange-800'
        case 'RESULT_APPROVAL':
            return 'bg-green-100 text-green-800'
        case 'COMPLETED':
            return 'bg-emerald-100 text-emerald-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
}
