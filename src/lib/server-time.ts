import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { apiClient } from '@/lib/api/client';

dayjs.extend(utc);
dayjs.extend(timezone);

const VN_TZ = 'Asia/Ho_Chi_Minh';

/** Vietnamese labels for loading / error (server clock, not client). */
export const SERVER_TIME_LOADING_LABEL = '\u0110ang l\u1ea5y gi\u1edd m\u00e1y ch\u1ee7...';
export const SERVER_TIME_ERROR_LABEL = 'Kh\u00f4ng l\u1ea5y \u0111\u01b0\u1ee3c gi\u1edd m\u00e1y ch\u1ee7';

function isValidIso(s: string): boolean {
  const t = Date.parse(s);
  return !Number.isNaN(t);
}

/**
 * Prefer GET backend /server-time; on failure or if not deployed, use Next.js /api/server-time.
 */
export async function getServerTimeIso(): Promise<string> {
  const backend = await apiClient.getServerTime();
  if (backend.success && backend.data && typeof backend.data.serverTime === 'string') {
    const iso = backend.data.serverTime.trim();
    if (isValidIso(iso)) return iso;
  }

  const res = await fetch(
    typeof window !== 'undefined' ? '/api/server-time' : `${getOriginForServerFetch()}/api/server-time`,
    { cache: 'no-store' }
  );
  if (!res.ok) {
    throw new Error(`Server time request failed (${res.status})`);
  }
  const body = (await res.json()) as { serverTime?: string };
  const iso = body.serverTime?.trim();
  if (!iso || !isValidIso(iso)) {
    throw new Error('Invalid server time response');
  }
  return iso;
}

function getOriginForServerFetch(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (u) {
    return u.startsWith('http') ? u : `https://${u}`;
  }
  return 'http://localhost:3000';
}

/** "Ngay ... thang ... nam ..." in Asia/Ho_Chi_Minh (not local OS timezone). */
export function formatVietnamSigningDateLineFromIso(iso: string): string {
  const d = dayjs(iso).tz(VN_TZ);
  if (!d.isValid()) return '—';
  return `Ngày ${d.date()} tháng ${d.month() + 1} năm ${d.year()}`;
}

export function formatVietnamYyyyMmDdFromIso(iso: string): string {
  return dayjs(iso).tz(VN_TZ).format('YYYY-MM-DD');
}

/** yyyyMMddHHmmss for HIS UpdateResult in Asia/Ho_Chi_Minh. */
export function formatHisYyyyMMddHHmmssFromIso(iso: string): number {
  const d = dayjs(iso).tz(VN_TZ);
  if (!d.isValid()) return 0;
  const y = d.year();
  const mo = String(d.month() + 1).padStart(2, '0');
  const day = String(d.date()).padStart(2, '0');
  const h = String(d.hour()).padStart(2, '0');
  const mi = String(d.minute()).padStart(2, '0');
  const s = String(d.second()).padStart(2, '0');
  return Number.parseInt(`${y}${mo}${day}${h}${mi}${s}`, 10);
}
