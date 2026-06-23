import useSWR, { type SWRConfiguration } from 'swr';
import api from '@/lib/api';
import type {
  DailyDashboard, DispatchRecord, WasteEntry, WasteSummary,
  CloseGateSubmission, Incident, CashReconciliation,
  TemperatureLog, Site, SkuCost, OpeningLog, User
} from '@/types';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

const opts: SWRConfiguration = { refreshInterval: 60_000 }; // auto-refresh every 60s

// ── Dashboard ─────────────────────────────────────────────────────
export const useDailyDashboard = () =>
  useSWR<DailyDashboard>('/dashboard/daily', fetcher, opts);

// ── Sites ─────────────────────────────────────────────────────────
export const useSites = () =>
  useSWR<Site[]>('/sites', fetcher);

// ── Opening ───────────────────────────────────────────────────────
export const useTodayOpening = (siteId?: number) =>
  useSWR<OpeningLog | null>(siteId ? `/opening/today/${siteId}` : null, fetcher);

// ── Dispatch ──────────────────────────────────────────────────────
export const useDispatches = (params?: Record<string, string | number>) => {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return useSWR<{ data: DispatchRecord[] }>(`/dispatch${qs}`, fetcher, opts);
};

// ── Waste ─────────────────────────────────────────────────────────
export const useWaste = (params?: Record<string, string | number>) => {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return useSWR<{ data: WasteEntry[]; summary: WasteSummary }>(`/waste${qs}`, fetcher, opts);
};

// ── Close Gate ────────────────────────────────────────────────────
export const useCloseGate = (params?: Record<string, string | number>) => {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return useSWR<CloseGateSubmission[]>(`/close-gate${qs}`, fetcher, opts);
};

// ── Incidents ─────────────────────────────────────────────────────
export const useIncidents = (params?: Record<string, string | number | boolean>) => {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return useSWR<{ data: Incident[] }>(`/incidents${qs}`, fetcher, opts);
};

// ── Cash ──────────────────────────────────────────────────────────
export const useCash = (params?: Record<string, string | number>) => {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return useSWR<CashReconciliation[]>(`/cash${qs}`, fetcher, opts);
};

// ── Temperatures ──────────────────────────────────────────────────
export const useTemperatures = (params?: Record<string, string | number>) => {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return useSWR<TemperatureLog[]>(`/temperatures${qs}`, fetcher, opts);
};

// ── SKU Costs ─────────────────────────────────────────────────────
export const useSkuCosts = () =>
  useSWR<SkuCost[]>('/sku-costs', fetcher);

// ── Users ─────────────────────────────────────────────────────────
export const useUsers = () =>
  useSWR<User[]>('/users', fetcher);
