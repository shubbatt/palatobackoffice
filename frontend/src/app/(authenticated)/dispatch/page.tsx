'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useSites, useDispatches, useSkuCosts } from '@/hooks/useData';
import { dispatch as dispatchApi } from '@/lib/api';
import {
  Card, Btn, Field, SectionHead, Badge, inputCls, Spinner, EmptyState,
  PageHeader, DataTable,
} from '@/components/ui';
import toast from 'react-hot-toast';
import { mutate } from 'swr';
import type { DispatchRecord } from '@/types';

export default function DispatchPage() {
  const { user } = useAuthStore();
  const { data: sites }    = useSites();
  const { data: skus }     = useSkuCosts();
  const { data, isLoading } = useDispatches();

  const [form, setForm] = useState({
    origin_site_id: user?.site_id ?? '',
    destination_site_id: '',
    sku: '',
    quantity_dispatched: '',
    temperature_sensitive: false,
    pack_condition: 'good',
  });
  const [receiving, setReceiving]   = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const createDispatch = async () => {
    setSubmitting(true);
    try {
      await dispatchApi.create({
        ...form,
        origin_site_id:      Number(form.origin_site_id),
        destination_site_id: Number(form.destination_site_id),
        quantity_dispatched:  Number(form.quantity_dispatched),
      });
      toast.success('Dispatch created');
      setForm((f) => ({ ...f, sku: '', quantity_dispatched: '', destination_site_id: '' }));
      mutate('/dispatch');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to create dispatch');
    } finally {
      setSubmitting(false);
    }
  };

  const collectDispatch = async (id: number) => {
    try {
      await dispatchApi.confirmCollect(id);
      toast.success('Collection confirmed');
      mutate('/dispatch');
    } catch {
      toast.error('Failed to confirm collection');
    }
  };

  const receiveDispatch = async (d: DispatchRecord) => {
    const qty = receiving[d.id];
    if (!qty) return;
    try {
      await dispatchApi.confirmReceive(d.id, {
        quantity_received: Number(qty),
        received_condition: 'good',
      });
      toast.success('Receipt confirmed');
      setReceiving((r) => { const n = { ...r }; delete n[d.id]; return n; });
      mutate('/dispatch');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to confirm receipt');
    }
  };

  const dispatches = data?.data ?? [];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader title="Dispatch & Logistics" />

      {/* Create dispatch — production lead / ops head only */}
      {['production_lead', 'operations_head', 'owner'].includes(user?.role ?? '') && (
        <Card>
          <SectionHead>Create Dispatch (Production Lead)</SectionHead>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
            <Field label="Origin">
              <select value={form.origin_site_id} onChange={(e) => set('origin_site_id', e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                {sites?.filter(s => s.type !== 'retail').map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Destination">
              <select value={form.destination_site_id} onChange={(e) => set('destination_site_id', e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="SKU">
              <input
                list="sku-list"
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                placeholder="e.g. Croissant"
                className={inputCls}
              />
              <datalist id="sku-list">
                {skus?.map((s) => <option key={s.sku} value={s.sku} />)}
              </datalist>
            </Field>
            <Field label="Qty">
              <input type="number" value={form.quantity_dispatched}
                onChange={(e) => set('quantity_dispatched', e.target.value)}
                placeholder="Units" className={inputCls} />
            </Field>
            <Field label="Condition">
              <select value={form.pack_condition} onChange={(e) => set('pack_condition', e.target.value)} className={inputCls}>
                <option value="good">Good</option>
                <option value="damaged">Damaged</option>
                <option value="suspect">Suspect</option>
              </select>
            </Field>
            <div className="flex pb-1">
              <Btn
                onClick={createDispatch}
                disabled={submitting || !form.origin_site_id || !form.destination_site_id || !form.sku || !form.quantity_dispatched}
                className="w-full justify-center"
              >
                {submitting ? 'Creating…' : 'Create Dispatch →'}
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {/* Dispatch Log */}
      <Card className="flex-1 border-t-palato-amber">
        <SectionHead>Active Dispatches · Today</SectionHead>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : dispatches.length === 0 ? (
          <EmptyState icon="⇄" message="No dispatches recorded today" />
        ) : (
          <DataTable
            headers={['ID', 'Route', 'SKU', 'Sent', 'Recv', 'Variance', 'Status', 'Action']}
            rows={dispatches}
            keyExtractor={(d) => d.id}
            renderRow={(d) => {
              const variance = d.quantity_received != null
                ? d.quantity_received - d.quantity_dispatched : null;
              return (
                <>
                  <td className="py-3 px-4 font-mono text-xs text-muted">{d.dispatch_id}</td>
                  <td className="py-3 px-4 text-xs text-muted">
                    {d.originSite?.name} → <span className="font-semibold text-text">{d.destinationSite?.name}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-text">{d.sku}</td>
                  <td className="py-3 px-4 text-text">{d.quantity_dispatched}</td>
                  <td className="py-3 px-4 text-text">{d.quantity_received ?? '—'}</td>
                  <td className={`py-3 px-4 font-bold ${variance === null ? 'text-muted' : variance === 0 ? 'text-palato-green' : 'text-palato-red'}`}>
                    {variance === null ? '—' : variance === 0 ? '✓' : variance > 0 ? `+${variance}` : variance}
                  </td>
                  <td className="py-3 px-4"><Badge status={d.status} /></td>
                  <td className="py-3 px-4 text-right">
                    {/* Stage 2: Driver collect */}
                    {d.status === 'pending' && (
                      <Btn size="sm" variant="ghost" onClick={() => collectDispatch(d.id)}>
                        Collect
                      </Btn>
                    )}
                    {/* Stage 3: Outlet receive */}
                    {d.status === 'in_transit' && (
                      receiving[d.id] !== undefined ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            value={receiving[d.id]}
                            onChange={(e) => setReceiving((r) => ({ ...r, [d.id]: e.target.value }))}
                            className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                          <Btn size="sm" variant="success" onClick={() => receiveDispatch(d)}>✓</Btn>
                        </div>
                      ) : (
                        <Btn size="sm" variant="ghost"
                          onClick={() => setReceiving((r) => ({ ...r, [d.id]: String(d.quantity_dispatched) }))}>
                          Receive
                        </Btn>
                      )
                    )}
                  </td>
                </>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
}
