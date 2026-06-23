'use client';

import { useState } from 'react';
import { useAuthStore, canResolveIncident } from '@/lib/store';
import { useIncidents } from '@/hooks/useData';
import { incidents as incidentsApi } from '@/lib/api';
import {
  Card, Btn, Field, SectionHead, Badge, inputCls, Spinner, EmptyState, AlertBanner, PageHeader,
} from '@/components/ui';
import toast from 'react-hot-toast';
import { mutate } from 'swr';
import type { Incident } from '@/types';
import { clsx } from 'clsx';

const CATEGORY_LABELS: Record<string, string> = {
  cash: 'Cash', temperature: 'Temperature', dispatch_receiving: 'Dispatch/Receiving',
  waste: 'Waste', equipment: 'Equipment', staffing: 'Staffing',
  customer: 'Customer', security: 'Security', food_safety: 'Food Safety', other: 'Other',
};

export default function IncidentsPage() {
  const { user }    = useAuthStore();
  const canResolve  = canResolveIncident(user?.role);
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [resolving, setResolving] = useState<number | null>(null);
  const [notes, setNotes]         = useState('');

  const params: Record<string, string | boolean> = {};
  if (filter === 'open')     params.resolved = false;
  if (filter === 'resolved') params.resolved = true;

  const { data, isLoading } = useIncidents(params);
  const items = data?.data ?? [];

  const redOpen = items.filter((i) => i.severity === 'red' && !i.is_resolved);

  const resolve = async (inc: Incident) => {
    if (!notes.trim()) { toast.error('Resolution notes required'); return; }
    try {
      await incidentsApi.resolve(inc.id, notes);
      toast.success(`INC-${inc.reference} resolved`);
      setResolving(null);
      setNotes('');
      mutate(`/incidents?resolved=false`);
      mutate(`/incidents`);
      mutate('/dashboard/daily');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to resolve');
    }
  };

  const filterBtns = (['open', 'resolved', 'all'] as const).map((f) => ({
    key: f,
    label: f.charAt(0).toUpperCase() + f.slice(1),
  }));

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Incidents"
        subtitle="Track and resolve operational incidents"
        action={
          <div className="flex gap-1.5">
            {filterBtns.map(({ key, label }) => (
              <Btn key={key} size="sm" variant={filter === key ? 'default' : 'ghost'} onClick={() => setFilter(key)}>
                {label}
              </Btn>
            ))}
          </div>
        }
      />

      {redOpen.length > 0 && (
        <div className="mb-5">
          <AlertBanner severity="red">
            {redOpen.length} RED incident{redOpen.length > 1 ? 's' : ''} require immediate Owner review
          </AlertBanner>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center pt-20"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState icon="⚠" message={filter === 'open' ? 'No open incidents — all clear' : 'No incidents found'} />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((inc) => (
            <Card
              key={inc.id}
              className={clsx(
                'border-l-4',
                inc.severity === 'red'   ? 'border-l-palato-red'   :
                inc.severity === 'amber' ? 'border-l-palato-amber' : 'border-l-palato-green'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Left: incident info */}
                <div className="flex-1 min-w-0">
                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge status={inc.severity} />
                    <span className="text-xs font-mono text-muted">{inc.reference}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface text-muted border border-border">
                      {CATEGORY_LABELS[inc.category] ?? inc.category}
                    </span>
                    {inc.is_resolved && (
                      <span className="text-xs text-palato-green font-semibold">✓ Resolved</span>
                    )}
                  </div>

                  {/* Title & site */}
                  <div className="text-base font-semibold text-text leading-snug mb-0.5">{inc.title}</div>
                  <div className="text-sm text-muted mb-2">{inc.site?.name}</div>

                  {/* Footer meta */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted">
                    <span>Raised by: <span className="text-text">{inc.raisedBy?.name ?? '—'}</span></span>
                    <span>{new Date(inc.raised_at).toLocaleString('en-MV', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                    {inc.ownedBy && <span>Owner: <span className="text-text">{inc.ownedBy.name}</span></span>}
                  </div>

                  {/* Resolution note */}
                  {inc.is_resolved && inc.resolution_notes && (
                    <div className="mt-3 rounded-md bg-green-dim border border-palato-green p-2.5 text-xs text-palato-green">
                      ✓ {inc.resolution_notes} — {inc.resolvedBy?.name}, {inc.resolved_at ? new Date(inc.resolved_at).toLocaleTimeString('en-MV', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  )}
                </div>

                {/* Right: resolve panel */}
                {canResolve && !inc.is_resolved && (
                  <div className="shrink-0 mt-3 sm:mt-0">
                    {resolving === inc.id ? (
                      <div className="flex flex-col gap-2 w-full sm:w-64">
                        <SectionHead>Resolution Notes</SectionHead>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Resolution notes (required)…"
                          rows={3}
                          className={inputCls + ' text-xs'}
                        />
                        <div className="flex gap-2">
                          <Btn size="sm" variant="success" onClick={() => resolve(inc)}>Confirm resolve</Btn>
                          <Btn size="sm" variant="ghost" onClick={() => { setResolving(null); setNotes(''); }}>Cancel</Btn>
                        </div>
                      </div>
                    ) : (
                      <Btn size="sm" variant="success" onClick={() => setResolving(inc.id)}>
                        Mark resolved
                      </Btn>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
