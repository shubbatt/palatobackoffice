'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useSites, useCash } from '@/hooks/useData';
import { cash as cashApi } from '@/lib/api';
import {
  Card, Btn, Field, SectionHead, Badge, inputCls, Spinner, EmptyState, KpiCard, PageHeader, DataTable
} from '@/components/ui';
import toast from 'react-hot-toast';
import { mutate } from 'swr';

const fmt = (n: number | string) => `MVR ${Number(n || 0).toLocaleString()}`;

export default function CashPage() {
  const { user } = useAuthStore();
  const { data: sites } = useSites();
  const { data: recons, isLoading } = useCash();

  const [form, setForm] = useState({
    site_id:               user?.site_id ?? '',
    pos_z_total:           '',
    card_settlement_total: '',
    expected_cash:         '',
    actual_cash_counted:   '',
    deposit_made:          false,
    deposit_amount:        '',
    deposit_reference:     '',
    variance_reason:       '',
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const variance = form.expected_cash && form.actual_cash_counted
    ? parseFloat(form.actual_cash_counted) - parseFloat(form.expected_cash)
    : null;

  const submit = async () => {
    setSubmitting(true);
    try {
      await cashApi.store({
        ...form,
        site_id:               Number(form.site_id),
        pos_z_total:           Number(form.pos_z_total),
        card_settlement_total: Number(form.card_settlement_total),
        expected_cash:         Number(form.expected_cash),
        actual_cash_counted:   Number(form.actual_cash_counted),
        deposit_amount:        form.deposit_amount ? Number(form.deposit_amount) : undefined,
      });
      toast.success('Cash reconciliation submitted');
      setForm((f) => ({ ...f, pos_z_total: '', card_settlement_total: '', expected_cash: '', actual_cash_counted: '', deposit_amount: '', deposit_reference: '', variance_reason: '' }));
      mutate('/cash');
      mutate('/dashboard/daily');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async (id: number) => {
    try {
      await cashApi.verify(id);
      toast.success('Verified by Finance');
      mutate('/cash');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to verify');
    }
  };

  const items = recons ?? [];
  const totalVariance = items.reduce((a, r) => a + r.cash_variance, 0);

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader title="Cash Reconciliation" />

      {/* KPIs */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Total Variance"
            value={fmt(Math.abs(totalVariance))}
            status={Math.abs(totalVariance) > 500 ? 'red' : totalVariance !== 0 ? 'amber' : 'green'}
          />
          <KpiCard
            label="Sites Submitted"
            value={`${items.length}`}
            sub={`${items.filter((r) => r.finance_verified).length} Finance verified`}
          />
          <KpiCard
            label="RED Variances"
            value={items.filter((r) => r.status === 'red').length}
            status={items.some((r) => r.status === 'red') ? 'red' : 'green'}
          />
        </div>
      )}

      {/* Submit form */}
      {['shift_manager', 'operations_head', 'owner'].includes(user?.role ?? '') && (
        <Card>
          <SectionHead>Submit Reconciliation (Shift Manager)</SectionHead>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Field label="Site">
              <select value={form.site_id} onChange={(e) => set('site_id', e.target.value)} className={inputCls}>
                {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="POS Z-Report Total">
              <input type="number" value={form.pos_z_total}
                onChange={(e) => set('pos_z_total', e.target.value)} className={inputCls} placeholder="MVR" />
            </Field>
            <Field label="Card Settlement">
              <input type="number" value={form.card_settlement_total}
                onChange={(e) => set('card_settlement_total', e.target.value)} className={inputCls} placeholder="MVR" />
            </Field>
            <Field label="Expected Cash">
              <input type="number" value={form.expected_cash}
                onChange={(e) => set('expected_cash', e.target.value)} className={inputCls} placeholder="MVR" />
            </Field>
            <Field label="Actual Cash Counted">
              <input type="number" value={form.actual_cash_counted}
                onChange={(e) => set('actual_cash_counted', e.target.value)} className={inputCls} placeholder="MVR" />
            </Field>
          </div>

          <div className="mt-4">
            {variance !== null && (
              <div className={`w-full rounded-md border p-3 text-sm font-bold ${variance === 0 ? 'border-palato-green/30 bg-palato-green/10 text-palato-green' : Math.abs(variance) > 500 ? 'border-palato-red/30 bg-palato-red/10 text-palato-red' : 'border-palato-amber/30 bg-palato-amber/10 text-palato-amber'}`}>
                Variance: {variance === 0 ? '✓ Zero' : `MVR ${variance}`}
                {Math.abs(variance) > 500 && ' — RED will be raised'}
                {Math.abs(variance) > 50 && Math.abs(variance) <= 500 && ' — AMBER will be raised'}
              </div>
            )}
          </div>

          {variance !== null && variance !== 0 && (
            <div className="mt-4">
              <Field label="Variance Reason (required if variance exists)">
                <textarea value={form.variance_reason}
                  onChange={(e) => set('variance_reason', e.target.value)}
                  rows={2} className={inputCls} placeholder="Explain the variance…" />
              </Field>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-surface rounded-lg p-4 border border-border">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-text">
              <input type="checkbox" checked={form.deposit_made}
                onChange={(e) => set('deposit_made', e.target.checked)} className="h-4 w-4 accent-accent rounded" />
              Bank Deposit Made Today
            </label>
            {form.deposit_made && (
              <div className="flex gap-2 w-full sm:w-auto">
                <input type="number" value={form.deposit_amount}
                  onChange={(e) => set('deposit_amount', e.target.value)}
                  placeholder="Amount (MVR)" className={inputCls + ' sm:w-32'} />
                <input type="text" value={form.deposit_reference}
                  onChange={(e) => set('deposit_reference', e.target.value)}
                  placeholder="Slip Reference" className={inputCls + ' sm:w-48'} />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Btn onClick={submit} disabled={submitting || !form.pos_z_total || !form.actual_cash_counted}>
              {submitting ? 'Submitting…' : 'Submit Reconciliation'}
            </Btn>
          </div>
        </Card>
      )}

      {/* Reconciliation log */}
      <Card className="border-t-palato-green">
        <SectionHead>Reconciliations · Today</SectionHead>
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState icon="₿" message="No reconciliations submitted yet today" />
        ) : (
          <DataTable
            headers={['Site', 'Z-Total', 'Card', 'Exp. Cash', 'Act. Cash', 'Variance', 'Deposit', 'Finance', 'Status', 'Action']}
            rows={items}
            keyExtractor={(r) => r.id}
            renderRow={(r) => (
              <>
                <td className="py-3 px-4 font-semibold text-text">{r.site?.name}</td>
                <td className="py-3 px-4 text-muted">{r.pos_z_total.toLocaleString()}</td>
                <td className="py-3 px-4 text-muted">{r.card_settlement_total.toLocaleString()}</td>
                <td className="py-3 px-4 text-muted">{r.expected_cash.toLocaleString()}</td>
                <td className="py-3 px-4 font-mono text-text">{r.actual_cash_counted.toLocaleString()}</td>
                <td className={`py-3 px-4 font-bold ${r.cash_variance === 0 ? 'text-palato-green' : r.cash_variance < -500 ? 'text-palato-red' : 'text-palato-amber'}`}>
                  {r.cash_variance === 0 ? '—' : `MVR ${r.cash_variance}`}
                </td>
                <td className="py-3 px-4 text-xs text-muted">
                  {r.deposit_made ? <span className="text-palato-green">✓ {fmt(r.deposit_amount ?? 0)}</span> : '—'}
                </td>
                <td className="py-3 px-4 text-xs">
                  {r.finance_verified
                    ? <span className="text-palato-green font-medium">✓ {r.verifiedBy?.name}</span>
                    : <span className="text-muted">Pending</span>}
                </td>
                <td className="py-3 px-4"><Badge status={r.status} /></td>
                <td className="py-3 px-4 text-right">
                  {['finance', 'owner'].includes(user?.role ?? '') && !r.finance_verified && (
                    <Btn size="sm" variant="success" onClick={() => verify(r.id)}>Verify</Btn>
                  )}
                </td>
              </>
            )}
          />
        )}
      </Card>
    </div>
  );
}
