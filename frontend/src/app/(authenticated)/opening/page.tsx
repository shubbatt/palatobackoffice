'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useSites, useTodayOpening } from '@/hooks/useData';
import { opening as openingApi } from '@/lib/api';
import { Card, Btn, Field, SectionHead, Badge, inputCls, Spinner, PageHeader } from '@/components/ui';
import toast from 'react-hot-toast';
import { mutate } from 'swr';

const PHASES = ['Premises & Safety', 'Refrigeration', 'Equipment & Cash', 'Receiving & Brief'];

const FRIDGE_UNITS = ['Display Fridge', 'Back Fridge', 'Prep Fridge'];
const ANOMALY_OPTIONS = [
  { value: 'none',             label: 'None — all clear' },
  { value: 'minor',            label: 'Minor issue — no risk, logged' },
  { value: 'security_concern', label: 'Security concern — escalated to Ops Head' },
  { value: 'equipment_fault',  label: 'Equipment fault found' },
];

export default function OpeningPage() {
  const { user } = useAuthStore();
  const { data: sites } = useSites();
  const userSiteId = user?.site_id ?? sites?.[0]?.id;
  const { data: existing, isLoading } = useTodayOpening(userSiteId ?? undefined);

  const [phase, setPhase]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const [form, setForm] = useState({
    site_id:                    userSiteId ?? '',
    overnight_anomaly:          'none',
    anomaly_notes:              '',
    refrigeration_readings:     FRIDGE_UNITS.map((unit) => ({ unit, temp_c: '', within_range: true })),
    cash_float_counted:         '',
    pos_operational:            true,
    card_terminal_operational:  true,
    espresso_machine_operational: true,
    receiving_reconciled:       false,
    receiving_notes:            '',
    team_brief_done:            false,
    brief_notes:                '',
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const updateTemp = (i: number, field: string, value: unknown) => {
    const readings = [...form.refrigeration_readings];
    readings[i] = { ...readings[i], [field]: value };
    if (field === 'temp_c') {
      const t = parseFloat(value as string);
      readings[i].within_range = !isNaN(t) && t >= 0 && t <= 8;
    }
    set('refrigeration_readings', readings);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        site_id: Number(form.site_id),
        cash_float_counted: form.cash_float_counted ? Number(form.cash_float_counted) : undefined,
        refrigeration_readings: form.refrigeration_readings
          .filter((r) => r.temp_c !== '')
          .map((r) => ({ ...r, temp_c: parseFloat(r.temp_c as unknown as string) })),
        is_complete: true,
      };
      await openingApi.store(payload);
      mutate(`/opening/today/${form.site_id}`);
      toast.success('Opening checklist submitted');
      setDone(true);
    } catch {
      toast.error('Failed to submit opening checklist');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner /></div>;

  if (existing?.is_complete || done) {
    return (
      <div className="animate-fade-in flex flex-col gap-6">
        <PageHeader title="Opening Checklist" />
        <Card className="max-w-xl mx-auto text-center py-16 mt-8 border-palato-green">
          <div className="mx-auto w-16 h-16 rounded-full bg-palato-green/20 flex items-center justify-center text-3xl text-palato-green mb-6">✓</div>
          <div className="text-2xl font-bold text-text mb-2">Opening Complete</div>
          <div className="text-sm text-muted">
            {existing?.site?.name ?? 'Site'} · submitted by {existing?.user?.name ?? user?.name}
          </div>
          <div className="mt-8 flex justify-center">
            <Badge status={existing?.status ?? 'green'} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader title="Opening Checklist" />

      <div className="max-w-3xl mx-auto w-full">
        {/* Phase progress indicator */}
        <div className="flex gap-2 mb-8">
          {PHASES.map((p, i) => (
            <div key={i} className="flex-1 flex flex-col gap-2">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${i <= phase ? 'bg-accent' : 'bg-surface border border-border'}`}
              />
              <span className={`text-[11px] font-medium transition-colors ${i === phase ? 'text-accent' : i < phase ? 'text-text' : 'text-muted'}`}>
                {i + 1}. {p}
              </span>
            </div>
          ))}
        </div>

        <Card className="p-6 sm:p-8">
          {/* Phase 0 — Premises */}
          {phase === 0 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <SectionHead>Premises & Safety</SectionHead>
              <Field label="Site">
                <select
                  value={form.site_id}
                  onChange={(e) => set('site_id', e.target.value)}
                  className={inputCls}
                >
                  {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Overnight Anomaly">
                <select
                  value={form.overnight_anomaly}
                  onChange={(e) => set('overnight_anomaly', e.target.value)}
                  className={inputCls}
                >
                  {ANOMALY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              {form.overnight_anomaly !== 'none' && (
                <Field label="Anomaly Notes">
                  <textarea
                    value={form.anomaly_notes}
                    onChange={(e) => set('anomaly_notes', e.target.value)}
                    rows={3}
                    className={inputCls}
                    placeholder="Describe what was found and action taken…"
                  />
                </Field>
              )}
              {form.overnight_anomaly === 'security_concern' && (
                <div className="rounded-md bg-palato-red/10 border border-palato-red/30 p-4 text-sm font-medium text-palato-red flex items-start gap-3">
                  <span>⚠</span>
                  <span>Security concern — this will escalate to Operations Head immediately on submission.</span>
                </div>
              )}
            </div>
          )}

          {/* Phase 1 — Refrigeration */}
          {phase === 1 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <SectionHead>Refrigeration Checks (Target: 0–8°C)</SectionHead>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {form.refrigeration_readings.map((r, i) => (
                  <div key={i} className="bg-surface rounded-lg p-4 border border-border">
                    <Field label={r.unit}>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={r.temp_c as string}
                          onChange={(e) => updateTemp(i, 'temp_c', e.target.value)}
                          placeholder="e.g. 3.5"
                          className={`${inputCls} pr-8`}
                        />
                        <span className="absolute right-3 top-2 text-muted">°C</span>
                      </div>
                    </Field>
                    <div className="h-4 mt-2">
                      {r.temp_c !== '' && !r.within_range && (
                        <div className="text-xs font-medium text-palato-red">
                          ⚠ Outside range — isolate & escalate
                        </div>
                      )}
                      {r.temp_c !== '' && r.within_range && (
                        <div className="text-xs font-medium text-palato-green">
                          ✓ Within range
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase 2 — Equipment & Cash */}
          {phase === 2 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <SectionHead>Equipment & Cash Float</SectionHead>
              <div className="bg-surface rounded-lg border border-border p-4 flex flex-col gap-3">
                <div className="text-sm font-medium text-muted mb-1">Verify Operational Status:</div>
                {[
                  { key: 'pos_operational',           label: 'POS system operational' },
                  { key: 'card_terminal_operational', label: 'Card terminal operational' },
                  { key: 'espresso_machine_operational', label: 'Espresso machine operational (if applicable)' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${!!form[key as keyof typeof form] ? 'bg-accent border-accent text-bg' : 'border-muted group-hover:border-accent'}`}>
                      {!!form[key as keyof typeof form] && <span className="text-xs">✓</span>}
                    </div>
                    <input
                      type="checkbox"
                      checked={!!form[key as keyof typeof form]}
                      onChange={(e) => set(key, e.target.checked)}
                      className="sr-only"
                    />
                    <span className="text-sm text-text select-none">{label}</span>
                  </label>
                ))}
              </div>
              <Field label="Cash Float Count">
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-2.5 text-muted text-sm">MVR</span>
                  <input
                    type="number"
                    value={form.cash_float_counted}
                    onChange={(e) => set('cash_float_counted', e.target.value)}
                    placeholder="Total float counted"
                    className={`${inputCls} pl-12`}
                  />
                </div>
              </Field>
            </div>
          )}

          {/* Phase 3 — Receiving & Brief */}
          {phase === 3 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <SectionHead>Receiving & Team Brief</SectionHead>
              <div className="rounded-md bg-surface/50 p-4 text-sm text-muted border border-border/50">
                Match all dispatch IDs against physical count before confirming receipt.
                Any variance must be noted before proceeding.
              </div>
              
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${form.receiving_reconciled ? 'bg-accent border-accent text-bg' : 'border-muted group-hover:border-accent'}`}>
                    {form.receiving_reconciled && <span className="text-xs">✓</span>}
                  </div>
                  <input
                    type="checkbox"
                    checked={form.receiving_reconciled}
                    onChange={(e) => set('receiving_reconciled', e.target.checked)}
                    className="sr-only"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text select-none">Receiving Reconciled</span>
                    <span className="text-xs text-muted">All physical items match the dispatched quantities</span>
                  </div>
                </label>
                
                <Field label="Receiving Notes (variances, damaged items)">
                  <textarea
                    value={form.receiving_notes}
                    onChange={(e) => set('receiving_notes', e.target.value)}
                    rows={2}
                    className={inputCls}
                    placeholder="Any variances or notes…"
                  />
                </Field>
              </div>

              <div className="h-px bg-border w-full my-2"></div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${form.team_brief_done ? 'bg-accent border-accent text-bg' : 'border-muted group-hover:border-accent'}`}>
                    {form.team_brief_done && <span className="text-xs">✓</span>}
                  </div>
                  <input
                    type="checkbox"
                    checked={form.team_brief_done}
                    onChange={(e) => set('team_brief_done', e.target.checked)}
                    className="sr-only"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text select-none">Team Brief Completed</span>
                    <span className="text-xs text-muted">Priorities, targets, and any carry-overs shared with the team</span>
                  </div>
                </label>
                
                <Field label="Brief Notes">
                  <textarea
                    value={form.brief_notes}
                    onChange={(e) => set('brief_notes', e.target.value)}
                    rows={2}
                    className={inputCls}
                    placeholder="Key points from the brief…"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-10 pt-6 border-t border-border flex justify-between items-center">
            <Btn variant="ghost" onClick={() => setPhase((p) => p - 1)} disabled={phase === 0} className={phase === 0 ? 'invisible' : ''}>
              ← Back
            </Btn>
            
            {phase < PHASES.length - 1 ? (
              <Btn onClick={() => setPhase((p) => p + 1)}>Next Step →</Btn>
            ) : (
              <Btn variant="success" onClick={submit} disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Opening ✓'}
              </Btn>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
