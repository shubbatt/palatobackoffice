'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useSites } from '@/hooks/useData';
import { closing as closingApi } from '@/lib/api';
import { Card, Btn, Field, SectionHead, inputCls, Spinner, PageHeader } from '@/components/ui';
import toast from 'react-hot-toast';
import { mutate } from 'swr';

const SECTIONS = ['Sales Close', 'Product Disposition', 'Cleaning', 'Equipment', 'Security & Deposit'];

export default function ClosingPage() {
  const { user }        = useAuthStore();
  const { data: sites } = useSites();
  const [phase, setPhase]     = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]       = useState(false);

  const [form, setForm] = useState({
    site_id: user?.site_id ?? '',
    zreport_completed: false,
    card_settlement_done: false,
    cash_expected: '',
    cash_actual: '',
    cash_variance_reason: '',
    unsold_stock_recorded: false,
    unsold_stock_notes: '',
    cleaning_done: false,
    final_fridge_temp_ok: false,
    equipment_shutdown_ok: false,
    equipment_notes: '',
    cash_secured: false,
    deposit_made: false,
    deposit_amount: '',
    security_confirmed: false,
    alarm_set: false,
    production_reconciled: false,
    ingredient_shortfalls: '',
    tomorrow_prep_set: false,
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const variance = form.cash_expected && form.cash_actual
    ? parseFloat(form.cash_actual) - parseFloat(form.cash_expected) : null;

  const submit = async () => {
    setSubmitting(true);
    try {
      await (closingApi as any).store({
        ...form,
        site_id:       Number(form.site_id),
        cash_expected: form.cash_expected ? Number(form.cash_expected) : undefined,
        cash_actual:   form.cash_actual   ? Number(form.cash_actual)   : undefined,
        deposit_amount:form.deposit_amount ? Number(form.deposit_amount): undefined,
        is_complete: true,
      });
      toast.success('Closing checklist submitted');
      mutate('/dashboard/daily');
      setDone(true);
    } catch {
      toast.error('Failed to submit closing checklist');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="animate-fade-in flex flex-col gap-6">
        <PageHeader title="Closing Checklist" />
        <Card className="max-w-xl mx-auto text-center py-16 mt-8 border-palato-green">
          <div className="mx-auto w-16 h-16 rounded-full bg-palato-green/20 flex items-center justify-center text-3xl text-palato-green mb-6">✓</div>
          <div className="text-2xl font-bold text-text mb-2">Closing Complete</div>
          <div className="text-sm text-muted mt-2">All sections have been successfully submitted. Great job!</div>
        </Card>
      </div>
    );
  }

  const CheckRow = ({ k, label }: { k: string; label: string }) => (
    <label className="flex items-start gap-3 cursor-pointer py-1 group">
      <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${!!form[k as keyof typeof form] ? 'bg-accent border-accent text-bg' : 'border-muted group-hover:border-accent'}`}>
        {!!form[k as keyof typeof form] && <span className="text-xs">✓</span>}
      </div>
      <input type="checkbox" checked={!!form[k as keyof typeof form]}
        onChange={(e) => set(k, e.target.checked)} className="sr-only" />
      <span className="text-sm text-text select-none leading-tight pt-0.5">{label}</span>
    </label>
  );

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader title="Closing Checklist" />

      <div className="max-w-3xl mx-auto w-full">
        {/* Phase progress */}
        <div className="flex gap-2 mb-8">
          {SECTIONS.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col gap-2">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${i <= phase ? 'bg-accent' : 'bg-surface border border-border'}`} />
              <span className={`text-[11px] font-medium transition-colors ${i === phase ? 'text-accent' : i < phase ? 'text-text' : 'text-muted'}`}>
                {i + 1}. {s}
              </span>
            </div>
          ))}
        </div>

        <Card className="p-6 sm:p-8">
          {phase === 0 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <SectionHead>Sales Close</SectionHead>
              <Field label="Site">
                <select value={form.site_id} onChange={(e) => set('site_id', e.target.value)} className={inputCls}>
                  <option value="">Select site…</option>
                  {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <div className="bg-surface rounded-lg p-4 border border-border space-y-3">
                <CheckRow k="zreport_completed"    label="POS Z-report completed and photo taken" />
                <CheckRow k="card_settlement_done" label="Card settlement total confirmed" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Expected Cash">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted text-sm">MVR</span>
                    <input type="number" value={form.cash_expected}
                      onChange={(e) => set('cash_expected', e.target.value)} className={`${inputCls} pl-12`} />
                  </div>
                </Field>
                <Field label="Actual Cash Counted">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted text-sm">MVR</span>
                    <input type="number" value={form.cash_actual}
                      onChange={(e) => set('cash_actual', e.target.value)} className={`${inputCls} pl-12`} />
                  </div>
                </Field>
              </div>
              {variance !== null && variance !== 0 && (
                <div className="animate-fade-in space-y-4">
                  <div className={`rounded-md border p-4 text-sm font-bold ${Math.abs(variance) > 500 ? 'bg-palato-red/10 border-palato-red/30 text-palato-red' : 'bg-palato-amber/10 border-palato-amber/30 text-palato-amber'}`}>
                    Variance: MVR {variance}
                    {Math.abs(variance) > 50 ? ' — Explanation required' : ''}
                  </div>
                  <Field label="Variance Reason">
                    <textarea value={form.cash_variance_reason}
                      onChange={(e) => set('cash_variance_reason', e.target.value)}
                      rows={2} className={inputCls} placeholder="Explain the variance…" />
                  </Field>
                </div>
              )}
            </div>
          )}

          {phase === 1 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <SectionHead>Product Disposition</SectionHead>
              <div className="bg-surface rounded-lg p-4 border border-border">
                <CheckRow k="unsold_stock_recorded" label="Unsold stock disposition completed and recorded" />
              </div>
              <Field label="Notes (next day sale, donation, waste)">
                <textarea value={form.unsold_stock_notes}
                  onChange={(e) => set('unsold_stock_notes', e.target.value)}
                  rows={3} className={inputCls} placeholder="List SKUs and disposition for each…" />
              </Field>
              
              {/* Production kitchen specific */}
              <div className="mt-4 border-t border-border pt-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Production (CPK / Bakehouse) Only</div>
                <div className="space-y-4 bg-surface/50 rounded-lg p-4 border border-border/50">
                  <CheckRow k="production_reconciled" label="Production reconciled to dispatch records" />
                  <Field label="Ingredient Shortfalls">
                    <input value={form.ingredient_shortfalls}
                      onChange={(e) => set('ingredient_shortfalls', e.target.value)}
                      className={inputCls} placeholder="Any shortfalls for tomorrow's plan…" />
                  </Field>
                  <CheckRow k="tomorrow_prep_set" label="Tomorrow's prep scheduled and communicated" />
                </div>
              </div>
            </div>
          )}

          {phase === 2 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <SectionHead>Cleaning</SectionHead>
              <div className="bg-surface rounded-lg p-4 border border-border space-y-4">
                <CheckRow k="cleaning_done" label="Full cleaning completed per cleaning schedule" />
                <div className="text-sm text-muted bg-bg/50 rounded-md p-4 border border-border/50">
                  <span className="font-semibold text-text mb-1 block">Walk-through required:</span>
                  Counters, equipment surfaces, floors, food prep areas, displays, and back-of-house.
                </div>
              </div>
            </div>
          )}

          {phase === 3 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <SectionHead>Equipment</SectionHead>
              <div className="bg-surface rounded-lg p-4 border border-border space-y-3">
                <CheckRow k="final_fridge_temp_ok"   label="Final fridge temperatures confirmed and logged" />
                <CheckRow k="equipment_shutdown_ok"  label="Equipment shutdown correctly (espresso machine, ovens, fryers)" />
              </div>
              <Field label="Equipment Notes">
                <input value={form.equipment_notes}
                  onChange={(e) => set('equipment_notes', e.target.value)}
                  className={inputCls} placeholder="Any faults to report for tomorrow…" />
              </Field>
            </div>
          )}

          {phase === 4 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <SectionHead>Security & Deposit</SectionHead>
              <div className="bg-surface rounded-lg p-4 border border-border space-y-3">
                <CheckRow k="cash_secured"       label="Cash secured — in safe or counted for bank deposit" />
                <CheckRow k="security_confirmed" label="Premises secured — doors locked, windows checked" />
                <CheckRow k="alarm_set"          label="Alarm set and armed" />
              </div>
              
              <div className="mt-2 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer py-1 group">
                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${form.deposit_made ? 'bg-accent border-accent text-bg' : 'border-muted group-hover:border-accent'}`}>
                    {form.deposit_made && <span className="text-xs">✓</span>}
                  </div>
                  <input type="checkbox" checked={form.deposit_made}
                    onChange={(e) => set('deposit_made', e.target.checked)} className="sr-only" />
                  <span className="text-sm font-medium text-text select-none pt-0.5">Bank deposit made today</span>
                </label>
                
                {form.deposit_made && (
                  <div className="pl-8 animate-fade-in">
                    <Field label="Deposit Amount">
                      <div className="relative max-w-xs">
                        <span className="absolute left-3 top-2.5 text-muted text-sm">MVR</span>
                        <input type="number" value={form.deposit_amount}
                          onChange={(e) => set('deposit_amount', e.target.value)} className={`${inputCls} pl-12`} />
                      </div>
                    </Field>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-border flex justify-between items-center">
            <Btn variant="ghost" onClick={() => setPhase((p) => p - 1)} disabled={phase === 0} className={phase === 0 ? 'invisible' : ''}>← Back</Btn>
            {phase < SECTIONS.length - 1
              ? <Btn onClick={() => setPhase((p) => p + 1)}>Next Step →</Btn>
              : <Btn variant="success" onClick={submit} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Closing ✓'}
                </Btn>
            }
          </div>
        </Card>
      </div>
    </div>
  );
}
