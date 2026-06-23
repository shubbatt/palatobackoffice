'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useSites, useWaste, useSkuCosts } from '@/hooks/useData';
import { waste as wasteApi } from '@/lib/api';
import {
  Card, Btn, Field, SectionHead, Badge, inputCls, Spinner, EmptyState,
  PageHeader, DataTable, KpiCard,
} from '@/components/ui';
import toast from 'react-hot-toast';
import { mutate } from 'swr';

const REASONS = [
  { value: 'overproduction',    label: 'Overproduction' },
  { value: 'expiry',            label: 'Expiry' },
  { value: 'damage',            label: 'Damage in transit / handling' },
  { value: 'quality_failure',   label: 'Quality failure' },
  { value: 'return',            label: 'Customer return' },
  { value: 'staff_error',       label: 'Staff error' },
  { value: 'customer_recovery', label: 'Customer recovery / comp' },
  { value: 'other',             label: 'Other' },
];

const DISPOSITIONS = [
  { value: 'waste',                label: 'Waste (bin)' },
  { value: 'staff_consumption',    label: 'Staff consumption' },
  { value: 'donation',             label: 'Donation' },
  { value: 'return_to_production', label: 'Return to production' },
  { value: 'next_day_sale',        label: 'Next day sale' },
];

const fmt = (n: number) => `MVR ${n.toLocaleString()}`;

export default function WastePage() {
  const { user }   = useAuthStore();
  const { data: sites } = useSites();
  const { data: skus }  = useSkuCosts();
  const { data, isLoading } = useWaste();

  const [form, setForm] = useState({
    site_id:    user?.site_id ?? '',
    sku:        '',
    units_wasted: '',
    reason_code: 'overproduction',
    disposition: 'waste',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const selectedSku   = skus?.find((s) => s.sku === form.sku);
  const estimatedCost = selectedSku && form.units_wasted
    ? selectedSku.recipe_cost * Number(form.units_wasted)
    : 0;

  const submit = async () => {
    setSubmitting(true);
    try {
      await wasteApi.create({
        ...form,
        site_id:      Number(form.site_id),
        units_wasted: Number(form.units_wasted),
      });
      toast.success('Waste recorded');
      setForm((f) => ({ ...f, sku: '', units_wasted: '', notes: '' }));
      mutate('/waste');
      mutate('/dashboard/daily');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to record waste');
    } finally {
      setSubmitting(false);
    }
  };

  const entries  = data?.data    ?? [];
  const summary  = data?.summary;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Waste Log"
        subtitle="Record and track food waste entries"
      />

      {/* KPI Summary */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <KpiCard
            label="Total Recipe Cost"
            value={fmt(summary.total_recipe_cost)}
            status="amber"
          />
          <KpiCard
            label="Total Retail Value"
            value={fmt(summary.total_retail_value)}
          />
          <KpiCard
            label="Units Wasted"
            value={summary.total_units}
          />
        </div>
      )}

      {/* Log Waste Entry Form */}
      <Card className="mb-6">
        <SectionHead>Log Waste Entry</SectionHead>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Site">
            <select value={form.site_id} onChange={(e) => set('site_id', e.target.value)} className={inputCls}>
              {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="SKU / Product">
            <input
              list="waste-sku-list"
              value={form.sku}
              onChange={(e) => set('sku', e.target.value)}
              placeholder="e.g. Croissant"
              className={inputCls}
            />
            <datalist id="waste-sku-list">
              {skus?.map((s) => <option key={s.sku} value={s.sku} />)}
            </datalist>
          </Field>
          <Field label="Units Wasted">
            <input
              type="number" min="1"
              value={form.units_wasted}
              onChange={(e) => set('units_wasted', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Reason Code">
            <select value={form.reason_code} onChange={(e) => set('reason_code', e.target.value)} className={inputCls}>
              {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Disposition">
            <select value={form.disposition} onChange={(e) => set('disposition', e.target.value)} className={inputCls}>
              {DISPOSITIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
          <Field label="Notes (optional)">
            <input value={form.notes} onChange={(e) => set('notes', e.target.value)}
              placeholder="Additional context…" className={inputCls} />
          </Field>
        </div>

        {/* Cost estimate */}
        {estimatedCost > 0 && (
          <div className={`mt-4 rounded-md border p-3 text-sm flex items-center justify-between ${estimatedCost > 500 ? 'bg-amber-dim border-palato-amber text-palato-amber' : 'bg-surface border-border text-muted'}`}>
            <span>Estimated recipe cost: <strong className="text-text">{fmt(estimatedCost)}</strong></span>
            {estimatedCost > 500 && (
              <span className="text-xs font-semibold">⚠ Exceeds daily threshold — AMBER will be raised</span>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <Btn onClick={submit} loading={submitting} disabled={submitting || !form.sku || !form.units_wasted}>
            {submitting ? 'Recording…' : 'Record Waste'}
          </Btn>
        </div>
      </Card>

      {/* Waste Log Table */}
      <Card>
        <SectionHead>Waste Log · Today</SectionHead>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <DataTable
            columns={[
              { key: 'site', label: 'Site' },
              { key: 'sku', label: 'SKU' },
              { key: 'units', label: 'Units', align: 'right' },
              { key: 'cost', label: 'Recipe Cost', align: 'right' },
              { key: 'retail', label: 'Retail Value', align: 'right' },
              { key: 'reason', label: 'Reason' },
              { key: 'disposition', label: 'Disposition' },
              { key: 'status', label: 'Status' },
              { key: 'time', label: 'Time' },
            ]}
            rows={entries.map(w => ({
              id: w.id,
              site: w.site?.name,
              sku: <span className="font-semibold text-text">{w.sku}</span>,
              units: <span className="text-muted">{w.units_wasted}</span>,
              cost: <span className="font-bold text-palato-amber">{fmt(w.total_recipe_cost)}</span>,
              retail: <span className="text-muted">{fmt(w.total_retail_value)}</span>,
              reason: <span className="text-xs text-muted capitalize">{w.reason_code.replace('_', ' ')}</span>,
              disposition: <span className="text-xs text-muted capitalize">{w.disposition.replace('_', ' ')}</span>,
              status: <Badge status={w.status} />,
              time: <span className="text-xs text-muted">{new Date(w.recorded_at).toLocaleTimeString('en-MV', { hour: '2-digit', minute: '2-digit' })}</span>,
            }))}
          />
        )}
      </Card>
    </div>
  );
}
