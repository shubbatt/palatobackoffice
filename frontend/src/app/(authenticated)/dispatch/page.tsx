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

  const [originSiteId, setOriginSiteId] = useState(user?.site_id ?? '');
  const [items, setItems] = useState([{
    id: Date.now(),
    destination_site_id: '',
    sku: '',
    quantity_dispatched: '',
    pack_condition: 'good',
  }]);
  
  const [receiving, setReceiving]   = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const addItem = () => setItems([...items, { id: Date.now(), destination_site_id: '', sku: '', quantity_dispatched: '', pack_condition: 'good' }]);
  const removeItem = (id: number) => {
    if (items.length === 1) return;
    setItems(items.filter(i => i.id !== id));
  };
  const updateItem = (id: number, key: string, value: string) => {
    setItems(items.map(i => i.id === id ? { ...i, [key]: value } : i));
  };

  const createDispatch = async () => {
    if (!originSiteId) return toast.error('Please select an origin site');
    const validItems = items.filter(i => i.destination_site_id && i.sku && i.quantity_dispatched);
    if (validItems.length === 0) return toast.error('Please add at least one valid item');

    setSubmitting(true);
    try {
      const dispatches = validItems.map(i => ({
        origin_site_id: Number(originSiteId),
        destination_site_id: Number(i.destination_site_id),
        sku: i.sku,
        quantity_dispatched: Number(i.quantity_dispatched),
        pack_condition: i.pack_condition,
        temperature_sensitive: false,
      }));

      await dispatchApi.createBulk({ dispatches });
      toast.success(`Created ${dispatches.length} dispatch records`);
      setItems([{ id: Date.now(), destination_site_id: '', sku: '', quantity_dispatched: '', pack_condition: 'good' }]);
      mutate('/dispatch');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to create dispatches');
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
          <SectionHead>Create Bulk Dispatch (Production Lead)</SectionHead>
          <div className="mb-4 w-64">
            <Field label="Origin Site">
              <select value={originSiteId} onChange={(e) => setOriginSiteId(e.target.value)} className={inputCls}>
                <option value="">Select Origin…</option>
                {sites?.filter(s => s.type !== 'retail').map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-surface p-3 rounded-lg border border-border relative">
                <div className="flex-1 min-w-[150px]">
                  <Field label="Destination">
                    <select value={item.destination_site_id} onChange={(e) => updateItem(item.id, 'destination_site_id', e.target.value)} className={inputCls}>
                      <option value="">Select…</option>
                      {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Field label="SKU">
                    <input
                      list="sku-list"
                      value={item.sku}
                      onChange={(e) => updateItem(item.id, 'sku', e.target.value)}
                      placeholder="e.g. Croissant"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="w-24">
                  <Field label="Qty">
                    <input type="number" value={item.quantity_dispatched}
                      onChange={(e) => updateItem(item.id, 'quantity_dispatched', e.target.value)}
                      placeholder="Units" className={inputCls} />
                  </Field>
                </div>
                <div className="w-32">
                  <Field label="Condition">
                    <select value={item.pack_condition} onChange={(e) => updateItem(item.id, 'pack_condition', e.target.value)} className={inputCls}>
                      <option value="good">Good</option>
                      <option value="damaged">Damaged</option>
                      <option value="suspect">Suspect</option>
                    </select>
                  </Field>
                </div>
                {items.length > 1 && (
                  <button onClick={() => removeItem(item.id)} className="h-10 px-3 text-muted hover:text-palato-red transition-colors" title="Remove item">
                    ✕
                  </button>
                )}
              </div>
            ))}
            
            <datalist id="sku-list">
              {skus?.map((s) => <option key={s.sku} value={s.sku} />)}
            </datalist>

            <div className="flex items-center justify-between mt-2 border-t border-border pt-4">
              <Btn variant="ghost" size="sm" onClick={addItem}>+ Add Item</Btn>
              <Btn onClick={createDispatch} disabled={submitting}>
                {submitting ? 'Creating…' : 'Dispatch All Items →'}
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
