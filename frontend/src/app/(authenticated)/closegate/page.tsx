'use client';

import { useState } from 'react';
import { useAuthStore, canApproveOverride } from '@/lib/store';
import { useSites, useCloseGate } from '@/hooks/useData';
import { closeGate as closeGateApi } from '@/lib/api';
import {
  Card, Btn, Field, SectionHead, Badge, inputCls, Spinner, EmptyState, ProgressBar, PageHeader
} from '@/components/ui';
import toast from 'react-hot-toast';
import { mutate } from 'swr';
import { clsx } from 'clsx';
import type { CheckResult } from '@/types';

const CHECKS: { key: string; label: string; critical?: boolean }[] = [
  { key: 'check_opening_complete',     label: 'Opening checklist was completed and submitted', critical: true },
  { key: 'check_pos_zreport',          label: 'POS Z-report completed and photo taken' },
  { key: 'check_cash_reconciled',      label: 'Cash reconciled — variance (if any) logged and actioned', critical: true },
  { key: 'check_card_settlement',      label: 'Card settlement total confirmed' },
  { key: 'check_temperatures',         label: 'All temperature readings logged (open, mid, close)', critical: true },
  { key: 'check_food_safety',          label: 'Food-safety breaches actioned — product isolated or disposed' },
  { key: 'check_unsold_stock',         label: 'Unsold stock disposition completed and recorded' },
  { key: 'check_waste_records',        label: 'Waste records complete with reason codes' },
  { key: 'check_receiving_reconciled', label: 'Receiving reconciled to all dispatch IDs', critical: true },
  { key: 'check_cleaning',             label: 'Cleaning completed — walk-through done' },
  { key: 'check_equipment_status',     label: 'Equipment status confirmed — faults logged' },
  { key: 'check_cash_secured',         label: 'Cash secured — deposit status and reference recorded', critical: true },
  { key: 'check_security',             label: 'Security completed — alarm set, premises locked', critical: true },
];

const initialChecks = () =>
  Object.fromEntries(CHECKS.map((c) => [c.key, 'pending' as CheckResult | 'pending']));

// ── Override approval modal ────────────────────────────────────────
function OverrideModal({
  submissionId,
  siteName,
  onClose,
}: {
  submissionId: number;
  siteName: string;
  onClose: () => void;
}) {
  const [reason, setReason]     = useState('');
  const [approving, setApproving] = useState(false);

  const approve = async () => {
    if (!reason.trim()) { toast.error('Override reason is required'); return; }
    setApproving(true);
    try {
      await closeGateApi.approveOverride(submissionId, { override_notes: reason });
      toast.success('Override approved — gate cleared');
      mutate('/close-gate');
      mutate('/dashboard/daily');
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Override approval failed');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl border border-palato-red/50 bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-palato-red/20 flex items-center justify-center">
              <span className="text-palato-red text-lg">⚠</span>
            </div>
            <span className="font-bold text-text">RED Gate Override</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 flex flex-col gap-5">
          <div className="rounded-lg bg-palato-red/10 border border-palato-red/20 px-4 py-3 text-sm text-text leading-relaxed">
            You are approving an override for a <strong className="text-palato-red">RED</strong> Close Gate from{' '}
            <strong className="text-white">{siteName}</strong>. This action is logged and audited.
          </div>

          <Field label="Override Reason (required)">
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the circumstances and corrective actions taken that justify overriding this RED gate…"
              className={inputCls + ' resize-none'}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-border bg-card px-5 py-4">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn
            variant="danger"
            onClick={approve}
            disabled={approving || !reason.trim()}
          >
            {approving ? 'Approving…' : 'Approve Override'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function CloseGatePage() {
  const { user }    = useAuthStore();
  const canOverride = canApproveOverride(user?.role);
  const { data: sites } = useSites();
  const { data: submissions, isLoading } = useCloseGate();

  const [siteId, setSiteId]     = useState<number | ''>(user?.site_id ?? '');
  const [checks, setChecks]     = useState<Record<string, CheckResult | 'pending'>>(initialChecks());
  const [notes, setNotes]       = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  // Override modal state
  const [overrideTarget, setOverrideTarget] = useState<{ id: number; siteName: string } | null>(null);

  const setCheck = (key: string, val: CheckResult) =>
    setChecks((c) => ({ ...c, [key]: val }));

  const passed   = Object.values(checks).filter((v) => v === 'pass').length;
  const pending  = Object.values(checks).filter((v) => v === 'pending').length;
  const hasRed   = Object.values(checks).some((v) => v === 'red');
  const hasAmber = Object.values(checks).some((v) => v === 'amber');
  const allDone  = pending === 0;
  const gateStatus = hasRed ? 'red' : hasAmber ? 'amber' : allDone ? 'green' : 'amber';

  const submit = async () => {
    if (!allDone) { toast.error('Complete all checks before submitting'); return; }
    if (!siteId)  { toast.error('Select a site'); return; }
    setSubmitting(true);
    try {
      await closeGateApi.submit({
        site_id: Number(siteId),
        ...Object.fromEntries(Object.entries(checks).map(([k, v]) => [k, v === 'pending' ? 'pass' : v])),
        check_notes: notes,
      });
      toast.success(`Gate submitted — ${gateStatus.toUpperCase()}`);
      mutate('/close-gate');
      mutate('/dashboard/daily');
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to submit gate');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="animate-fade-in flex flex-col gap-6">
        <PageHeader title="Close Gate" />
        <Card className={`max-w-xl mx-auto text-center py-12 mt-8 border-${gateStatus === 'green' ? 'palato-green' : gateStatus === 'amber' ? 'palato-amber' : 'palato-red'}`}>
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner" style={{ backgroundColor: `var(--palato-${gateStatus})`, opacity: 0.1 }}>
             <span className={`text-palato-${gateStatus} font-bold opacity-100`}>{gateStatus === 'green' ? '✓' : '⚠'}</span>
          </div>
          <Badge status={gateStatus} className="text-base px-4 py-1.5 shadow-sm" />
          <div className="text-xl font-bold text-text mt-4">
            Close Gate {gateStatus.toUpperCase()}
          </div>
          <div className="text-muted mt-1">{passed}/{CHECKS.length} checks passed</div>
          
          {gateStatus === 'red' && (
            <div className="mt-6 rounded-lg bg-palato-red/10 border border-palato-red/30 p-4 text-sm text-palato-red mx-8 font-medium">
              RED gate — incident raised, Operations Head notified immediately.
            </div>
          )}
          <div className="mt-8">
            <Btn variant="ghost" onClick={() => { setSubmitted(false); setChecks(initialChecks()); }}>
              Submit another gate
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      {overrideTarget && (
        <OverrideModal
          submissionId={overrideTarget.id}
          siteName={overrideTarget.siteName}
          onClose={() => setOverrideTarget(null)}
        />
      )}

      <div className="animate-fade-in flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader title="Close Gate" className="mb-0" />
          <div className="flex items-center gap-3 self-start sm:self-auto bg-surface p-1.5 rounded-lg border border-border">
            <select value={siteId} onChange={(e) => setSiteId(Number(e.target.value))}
              className={`${inputCls} w-48 bg-card border-none shadow-sm focus:ring-1 focus:ring-accent`}>
              <option value="">Select site…</option>
              {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="pr-2">
              <Badge status={gateStatus}>{gateStatus.toUpperCase()} · {passed}/{CHECKS.length}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checklist */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">
            <Card className="flex flex-col h-full">
              <div className="mb-6">
                <SectionHead>13-Point Close Gate Checklist</SectionHead>
                <div className="mt-4 mb-2">
                  <ProgressBar value={passed} max={CHECKS.length} color={hasRed ? 'red' : hasAmber ? 'amber' : 'green'} />
                </div>
                <div className="text-xs font-medium text-muted">{passed} of {CHECKS.length} checks complete <span className="opacity-50">·</span> <span className="text-text">{pending} remaining</span></div>
              </div>

              <div className="flex-1 space-y-2">
                {CHECKS.map((check, i) => {
                  const val = checks[check.key];
                  return (
                    <div
                      key={check.key}
                      className={clsx(
                        'flex flex-col sm:flex-row sm:items-start gap-3 rounded-lg border px-4 py-3 transition-all duration-200',
                        val === 'red'   ? 'bg-palato-red/10 border-palato-red/30'   :
                        val === 'amber' ? 'bg-palato-amber/10 border-palato-amber/30' :
                        val === 'pass'  ? 'bg-palato-green/5 border-palato-green/20' : 'bg-surface border-border hover:border-muted'
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 w-full">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-card text-xs font-bold text-muted shrink-0 shadow-sm border border-border/50">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${val !== 'pending' ? 'text-text' : 'text-muted'}`}>{check.label}</span>
                            {check.critical && (
                              <span className="text-[9px] uppercase tracking-wider bg-accent/20 text-accent px-1.5 py-0.5 rounded font-bold">CRITICAL</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto pl-9 sm:pl-0 mt-2 sm:mt-0">
                        <div className="flex gap-1.5 bg-card rounded-md p-1 border border-border/50 shadow-sm">
                          {[
                            { v: 'pass' as CheckResult,  icon: '✓', cls: 'hover:bg-palato-green/20 hover:text-palato-green', activeCls: 'bg-palato-green text-bg' },
                            { v: 'amber' as CheckResult, icon: '!', cls: 'hover:bg-palato-amber/20 hover:text-palato-amber', activeCls: 'bg-palato-amber text-bg' },
                            { v: 'red' as CheckResult,   icon: '✗', cls: 'hover:bg-palato-red/20 hover:text-palato-red', activeCls: 'bg-palato-red text-white' },
                          ].map(({ v, icon, cls, activeCls }) => (
                            <button
                              key={v}
                              onClick={() => setCheck(check.key, v)}
                              className={clsx(
                                'h-8 w-10 rounded transition-all flex items-center justify-center font-bold text-sm',
                                val === v
                                  ? activeCls + ' shadow-md'
                                  : 'text-muted ' + cls
                              )}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Notes field spans full width below */}
                      {(val === 'amber' || val === 'red') && (
                        <div className="w-full mt-2 pl-9 animate-fade-in">
                          <input
                            type="text"
                            value={notes[check.key] ?? ''}
                            onChange={(e) => setNotes((n) => ({ ...n, [check.key]: e.target.value }))}
                            placeholder={`Required: Describe the ${val === 'red' ? 'critical issue' : 'issue'} and action taken…`}
                            className={`${inputCls} text-sm focus:ring-${val === 'red' ? 'palato-red' : 'palato-amber'} border-${val === 'red' ? 'palato-red/30' : 'palato-amber/30'}`}
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                {!allDone ? (
                  <span className="text-sm font-medium text-amber-500 animate-pulse bg-amber-500/10 px-3 py-1.5 rounded-md border border-amber-500/20">
                    {pending} check{pending !== 1 ? 's' : ''} remaining
                  </span>
                ) : (
                  <span className="text-sm font-medium text-palato-green flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-palato-green"></span> All checks complete
                  </span>
                )}
                <Btn
                  onClick={submit}
                  disabled={!allDone || submitting || !siteId}
                  variant={hasRed ? 'danger' : hasAmber ? 'amber' : 'success'}
                  className="w-full sm:w-auto sm:px-8 py-2.5 text-base shadow-lg"
                >
                  {submitting ? 'Submitting…' : `Submit Gate (${gateStatus.toUpperCase()})`}
                </Btn>
              </div>
            </Card>
          </div>

          {/* Today's submissions sidebar */}
          <div className="col-span-1 flex flex-col gap-4">
            <Card className="sticky top-6">
              <SectionHead>Today's Gates</SectionHead>
              {isLoading ? (
                <div className="py-12 flex justify-center"><Spinner /></div>
              ) : (submissions ?? []).length === 0 ? (
                <EmptyState icon="⬡" message="No gates submitted today" />
              ) : (
                <div className="flex flex-col gap-3 mt-4">
                  {(submissions ?? []).map((s) => (
                    <div key={s.id} className={`rounded-lg border p-4 transition-all hover:shadow-md ${
                      s.gate_status === 'red' ? 'bg-palato-red/5 border-palato-red/20' : 
                      s.gate_status === 'amber' ? 'bg-palato-amber/5 border-palato-amber/20' : 
                      'bg-surface border-border'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-text truncate pr-2">{s.site?.name}</span>
                        <Badge status={s.gate_status} className="shrink-0" />
                      </div>
                      
                      <div className="flex justify-between items-end mt-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-muted bg-card px-2 py-0.5 rounded w-fit border border-border/50">
                            {s.checks_passed}/{s.checks_total} checks
                          </span>
                          <span className="text-xs text-muted flex items-center gap-1 mt-1">
                            <span className="w-4 h-4 rounded-full bg-bg flex items-center justify-center text-[8px]">👤</span>
                            {s.submittedBy?.name}
                          </span>
                        </div>
                      </div>

                      {/* Override approval panel */}
                      {s.override_required && (
                        <div className="mt-4 pt-3 border-t border-border/50">
                          {s.overrideApprovedBy ? (
                            <div className="flex items-start gap-2 text-xs font-medium text-palato-green bg-palato-green/10 p-2 rounded">
                              <span className="mt-0.5">✓</span>
                              <span>Override approved by<br/>{s.overrideApprovedBy.name}</span>
                            </div>
                          ) : canOverride ? (
                            <div className="rounded-md bg-red-dim border border-palato-red/30 p-3 shadow-inner">
                              <p className="text-xs font-semibold text-palato-red mb-2 flex items-center gap-1.5">
                                <span>⚠</span> RED Gate Override Required
                              </p>
                              <Btn
                                size="sm"
                                variant="danger"
                                onClick={() => setOverrideTarget({ id: s.id, siteName: s.site?.name ?? 'Unknown' })}
                                className="w-full justify-center shadow-sm"
                              >
                                Review & Approve
                              </Btn>
                            </div>
                          ) : (
                            <div className="text-xs font-medium text-palato-amber bg-palato-amber/10 p-2 rounded flex items-start gap-2 border border-palato-amber/20">
                              <span className="mt-0.5">⌛</span>
                              <span>Pending override approval from Operations Head</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
