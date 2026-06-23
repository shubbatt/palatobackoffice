'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useSites, useTemperatures } from '@/hooks/useData';
import { temperatures as tempsApi } from '@/lib/api';
import {
  Card, Btn, Field, SectionHead, Badge, inputCls, Spinner, EmptyState,
  PageHeader, DataTable, KpiCard,
} from '@/components/ui';
import toast from 'react-hot-toast';
import { mutate } from 'swr';

const UNITS = ['Display Fridge', 'Back Fridge', 'Prep Fridge', 'Walk-in Cold', 'Freezer', 'Hot Hold'];
const PERIODS = [
  { value: 'open',  label: 'Opening (start of day)' },
  { value: 'mid',   label: 'Mid-shift check' },
  { value: 'close', label: 'Closing (end of day)' },
];

const LIMITS: Record<string, { min: number; max: number }> = {
  fridge:   { min: 0,   max: 8   },
  freezer:  { min: -25, max: -15 },
  hot_hold: { min: 63,  max: 85  },
};

const guessType = (unit: string) => {
  if (/freeze/i.test(unit)) return 'freezer';
  if (/hot|hold/i.test(unit)) return 'hot_hold';
  return 'fridge';
};

export default function TemperaturesPage() {
  const { user } = useAuthStore();
  const { data: sites } = useSites();
  const { data: logs, isLoading } = useTemperatures();

  const [form, setForm] = useState({
    site_id:          user?.site_id ?? '',
    reading_period:   'open',
    unit_name:        '',
    unit_type:        'fridge',
    temp_c:           '',
    corrective_action:'',
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const unitType  = form.unit_type as keyof typeof LIMITS;
  const limits    = LIMITS[unitType];
  const tempNum   = parseFloat(form.temp_c);
  const inRange   = !isNaN(tempNum) && tempNum >= limits.min && tempNum <= limits.max;
  const tempEntered = form.temp_c !== '';

  const submit = async () => {
    setSubmitting(true);
    try {
      await tempsApi.store({
        ...form,
        site_id: Number(form.site_id),
        temp_c:  tempNum,
      });
      toast.success('Temperature logged');
      setForm((f) => ({ ...f, unit_name: '', temp_c: '', corrective_action: '' }));
      mutate('/temperatures');
      mutate('/dashboard/daily');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to log temperature');
    } finally {
      setSubmitting(false);
    }
  };

  const items = logs ?? [];
  const breaches = items.filter((l) => !l.within_range);

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Temperature Logs" subtitle="Record and monitor unit temperatures" />

      {/* Breach KPI */}
      {breaches.length > 0 && (
        <div className="mb-6">
          <KpiCard
            label="Breaches Today"
            value={`${breaches.length} breach${breaches.length > 1 ? 'es' : ''}`}
            sub="Affected units outside approved range"
            status="amber"
          />
        </div>
      )}

      {/* Log Form */}
      <Card className="mb-6">
        <SectionHead>Record Temperature Reading</SectionHead>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Site">
            <select value={form.site_id} onChange={(e) => set('site_id', e.target.value)} className={inputCls}>
              {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Reading Period">
            <select value={form.reading_period} onChange={(e) => set('reading_period', e.target.value)} className={inputCls}>
              {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Unit Name">
            <input
              list="unit-list"
              value={form.unit_name}
              onChange={(e) => {
                const name = e.target.value;
                set('unit_name', name);
                set('unit_type', guessType(name));
              }}
              placeholder="e.g. Display Fridge"
              className={inputCls}
            />
            <datalist id="unit-list">
              {UNITS.map((u) => <option key={u} value={u} />)}
            </datalist>
          </Field>
          <Field label="Unit Type">
            <select value={form.unit_type} onChange={(e) => set('unit_type', e.target.value)} className={inputCls}>
              <option value="fridge">Fridge (0–8°C)</option>
              <option value="freezer">Freezer (-25 to -15°C)</option>
              <option value="hot_hold">Hot Hold (63–85°C)</option>
            </select>
          </Field>
          <Field label={`Temperature °C (limit: ${limits.min} to ${limits.max}°C)`}>
            <input type="number" step="0.1" value={form.temp_c}
              onChange={(e) => set('temp_c', e.target.value)} className={inputCls} />
            {tempEntered && (
              <div className={`mt-1 text-xs ${inRange ? 'text-palato-green' : 'text-palato-red'}`}>
                {inRange ? '✓ Within approved range' : `⚠ Outside range (${limits.min}–${limits.max}°C) — isolate product and escalate`}
              </div>
            )}
          </Field>
          {!inRange && tempEntered && (
            <Field label="Corrective Action Taken">
              <input value={form.corrective_action}
                onChange={(e) => set('corrective_action', e.target.value)}
                placeholder="Describe action taken…" className={inputCls} />
            </Field>
          )}
        </div>
        <div className="mt-5 flex justify-end">
          <Btn onClick={submit} loading={submitting} disabled={submitting || !form.unit_name || !form.temp_c}>
            {submitting ? 'Logging…' : 'Log Temperature'}
          </Btn>
        </div>
      </Card>

      {/* Log Table */}
      <Card>
        <SectionHead>Temperature Log · Today</SectionHead>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <DataTable
            columns={[
              { key: 'site', label: 'Site' },
              { key: 'unit', label: 'Unit' },
              { key: 'period', label: 'Period' },
              { key: 'temp', label: 'Temp', align: 'right' },
              { key: 'range', label: 'Range' },
              { key: 'action', label: 'Corrective Action' },
              { key: 'status', label: 'Status' },
              { key: 'time', label: 'Time' },
            ]}
            rows={items.map((t) => ({
              site: <span className="text-text">{t.site?.name}</span>,
              unit: <span className={`font-semibold ${!t.within_range ? 'text-palato-red' : 'text-text'}`}>{t.unit_name}</span>,
              period: <span className="text-muted capitalize">{t.reading_period}</span>,
              temp: <span className={`font-bold ${t.within_range ? 'text-text' : 'text-palato-red'}`}>{t.temp_c}°C</span>,
              range: <span className="text-xs text-muted">{t.min_limit_c}–{t.max_limit_c}°C</span>,
              action: <span className="text-xs text-muted max-w-48 truncate">{t.corrective_action ?? '—'}</span>,
              status: <Badge status={t.status} />,
              time: <span className="text-xs text-muted">{new Date(t.recorded_at).toLocaleTimeString('en-MV', { hour: '2-digit', minute: '2-digit' })}</span>,
            }))}
          />
        )}
      </Card>
    </div>
  );
}
