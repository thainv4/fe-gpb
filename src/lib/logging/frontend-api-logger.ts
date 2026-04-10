import { apiClient, FrontendApiLogRequest } from '@/lib/api/client';

const TRACE_ID_KEY = 'frontend-trace-id';

function getTraceId(): string {
    if (typeof window === 'undefined') {
        return `trace-${Date.now()}`;
    }

    const existed = sessionStorage.getItem(TRACE_ID_KEY);
    if (existed) {
        return existed;
    }

    const created = `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(TRACE_ID_KEY, created);
    return created;
}

export async function logFrontendApiStatus(
    payload: Omit<FrontendApiLogRequest, 'traceId' | 'timestamp' | 'screen' | 'action'> & {
        screen?: string;
        action?: string;
    },
): Promise<void> {
    try {
        await apiClient.sendFrontendApiLog({
            traceId: getTraceId(),
            screen: payload.screen ?? 'test-indications',
            action: payload.action ?? 'save',
            timestamp: new Date().toISOString(),
            ...payload,
        });
    } catch (error) {
        // Không throw để tránh ảnh hưởng flow chính của màn hình.
        console.warn('Frontend API logging failed:', error);
    }
}
