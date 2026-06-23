'use client';

import { useDailyDashboard } from '@/hooks/useData';
import { useAuthStore } from '@/lib/store';
import {
  Card, KpiCard, Badge, SectionHead, Btn, AlertBanner, Spinner, EmptyState,
  PageHeader, DataTable,
} from '@/components/ui';
import { useRouter } from 'next/navigation';

const fmt = (n: number | string) => `MVR ${Number(n || 0).toLocaleString('en-MV', { minimumFractionDigits: 0 })}`;

function todaySubtitle() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function DashboardPage() {
  const { data, isLoading } = useDailyDashboard();
  const { user } = useAuthStore();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 animate-pulse">
        <div className="h-14 w-80 rounded-lg bg-surface" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton rounded-lg h-24 bg-surface" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 skeleton rounded-lg h-64 bg-surface" />
          <div className="skeleton rounded-lg h-64 bg-surface" />
        </div>
      </div>
    );
  }

  if (!data) return <EmptyState message="Could not load dashboard" />;

  const redIncidents = data.open_incidents.filter((i) => i.severity === 'red');

  // ── DataTable row builders ────────────────────────────────────────
  const closeGateRows = data.close_gate.map((g) => ({
    site:      <span className="font-semibold text-text">{g.site?.name}</span>,
    submitted: <span className="text-muted">{g.submittedBy?.name}</span>,
    checks:    <span className="text-muted tabular-nums">{g.checks_passed}/{g.checks_total}</span>,
    status:    <Badge status={g.gate_status} />,
    action: (
      <Btn size="sm" variant="ghost" onClick={() => router.push('/closegate')}>
        Review
      </Btn>
    ),
  }));

  const dispatchRows = data.dispatch_variances.map((d) => ({
    sku:        <span className="font-semibold text-text">{d.sku}</span>,
    site:       <span className="text-muted">{d.destinationSite?.name}</span>,
    dispatched: <span className="text-muted tabular-nums">{d.quantity_dispatched}</span>,
    received:   <span className="text-muted tabular-nums">{d.quantity_received ?? '—'}</span>,
    status:     <Badge status={d.status as string} />,
  }));

  const cashRows = data.cash.reconciliations.map((c) => ({
    site:     <span className="font-semibold text-text">{c.site?.name}</span>,
    expected: <span className="text-muted tabular-nums">{Number(c.expected_cash || 0).toLocaleString()}</span>,
    actual:   <span className="text-muted tabular-nums">{Number(c.actual_cash_counted || 0).toLocaleString()}</span>,
    variance: (
      <span
        className={`font-bold tabular-nums ${
          c.cash_variance === 0
            ? 'text-palato-green'
            : c.cash_variance < -500
            ? 'text-palato-red'
            : 'text-palato-amber'
        }`}
      >
        {c.cash_variance === 0 ? '—' : `MVR ${c.cash_variance}`}
      </span>
    ),
    status: <Badge status={c.status} />,
  }));

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Operations Dashboard"
        subtitle={todaySubtitle()}
      />

      {/* RED alert banner */}
      {redIncidents.length > 0 && (
        <AlertBanner severity="red">
          {redIncidents.length} RED incident{redIncidents.length > 1 ? 's' : ''} require immediate attention
          <Btn variant="danger" size="sm" onClick={() => router.push('/incidents')} className="ml-4">
            View →
          </Btn>
        </AlertBanner>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Sites Active"
          value={data.close_gate.length > 0 ? data.close_gate.length : 3}
          status="green"
        />
        <KpiCard
          label="Open Incidents"
          value={data.open_incidents.length}
          sub={redIncidents.length > 0 ? `${redIncidents.length} RED` : undefined}
          status={data.open_incidents.length === 0 ? 'green' : 'red'}
        />
        <KpiCard
          label="Dispatch Variances"
          value={data.dispatch_variances.length}
          status={data.dispatch_variances.length === 0 ? 'green' : 'amber'}
        />
        <KpiCard
          label="Waste Cost"
          value={fmt(data.waste.total_recipe_cost)}
          sub="Recipe cost today"
          status={data.waste.total_recipe_cost > 0 ? 'amber' : 'green'}
        />
      </div>

      {/* Close Gate + Open Incidents */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Card>
            <SectionHead
              action={
                <Btn size="sm" variant="ghost" onClick={() => router.push('/closegate')}>
                  View all →
                </Btn>
              }
            >
              Close Gate · All Sites
            </SectionHead>
            {data.close_gate.length === 0 ? (
              <EmptyState icon="⬡" message="No close gate submissions yet today" />
            ) : (
              <DataTable
                columns={[
                  { key: 'site',      label: 'Site' },
                  { key: 'submitted', label: 'Submitted by' },
                  { key: 'checks',    label: 'Checks',  align: 'center' },
                  { key: 'status',    label: 'Status' },
                  { key: 'action',    label: '',        align: 'right' },
                ]}
                rows={closeGateRows}
              />
            )}
          </Card>
        </div>

        {/* Open Incidents */}
        <Card>
          <SectionHead
            action={
              <Btn size="sm" variant="ghost" onClick={() => router.push('/incidents')}>
                All →
              </Btn>
            }
          >
            Open Incidents
          </SectionHead>
          {data.open_incidents.length === 0 ? (
            <div className="py-3 text-sm text-palato-green">✓ No open incidents</div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.open_incidents.slice(0, 5).map((inc) => (
                <div
                  key={inc.id}
                  className="cursor-pointer rounded-md p-2 hover:bg-surface transition-colors"
                  onClick={() => router.push('/incidents')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge status={inc.severity} />
                    <span className="text-[11px] text-muted">
                      {new Date(inc.raised_at).toLocaleTimeString('en-MV', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-text">{inc.site?.name}</div>
                  <div className="text-xs text-muted mt-0.5 line-clamp-2">{inc.title}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Dispatch Variances + Top Waste SKUs */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <SectionHead>Dispatch Variances · Today</SectionHead>
          {data.dispatch_variances.length === 0 ? (
            <div className="py-3 text-sm text-palato-green">✓ All dispatches reconciled</div>
          ) : (
            <DataTable
              columns={[
                { key: 'sku',        label: 'SKU' },
                { key: 'site',       label: 'Site' },
                { key: 'dispatched', label: 'Dispatched', align: 'right' },
                { key: 'received',   label: 'Received',   align: 'right' },
                { key: 'status',     label: 'Status' },
              ]}
              rows={dispatchRows}
            />
          )}
        </Card>

        <Card>
          <SectionHead>Top Waste SKUs · Today</SectionHead>
          {data.waste.top_skus.length === 0 ? (
            <div className="py-3 text-sm text-palato-green">✓ No waste recorded</div>
          ) : (
            <div className="flex flex-col gap-2">
              {data.waste.top_skus.map((w) => (
                <div key={w.sku} className="flex items-center justify-between border-t border-border pt-2">
                  <span className="text-sm font-semibold text-text">{w.sku}</span>
                  <span className="text-sm font-bold tabular-nums text-palato-amber">{fmt(w.total)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
                <span className="text-xs text-muted">Total recipe cost</span>
                <span className="text-sm font-bold tabular-nums text-palato-amber">{fmt(data.waste.total_recipe_cost)}</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Cash Reconciliation + Temperature Breaches */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <SectionHead>Cash Reconciliation · Today</SectionHead>
          {data.cash.reconciliations.length === 0 ? (
            <EmptyState icon="₿" message="No reconciliations submitted yet" />
          ) : (
            <DataTable
              columns={[
                { key: 'site',     label: 'Site' },
                { key: 'expected', label: 'Expected', align: 'right' },
                { key: 'actual',   label: 'Actual',   align: 'right' },
                { key: 'variance', label: 'Variance', align: 'right' },
                { key: 'status',   label: 'Status' },
              ]}
              rows={cashRows}
            />
          )}
        </Card>

        <Card>
          <SectionHead>Temperature Breaches · Today</SectionHead>
          {data.temperature_breaches.length === 0 ? (
            <div className="py-3 text-sm text-palato-green">✓ All temperatures within range</div>
          ) : (
            <div className="flex flex-col gap-2">
              {data.temperature_breaches.map((t) => (
                <div key={t.id} className="flex items-start justify-between border-t border-border pt-2 gap-3">
                  <div>
                    <div className="text-sm font-semibold text-text">{t.unit_name}</div>
                    <div className="text-xs text-muted">{t.site?.name} · {t.reading_period}</div>
                    {t.corrective_action && (
                      <div className="text-xs text-palato-green mt-1">✓ {t.corrective_action}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold tabular-nums text-palato-red">{t.temp_c}°C</div>
                    <Badge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
