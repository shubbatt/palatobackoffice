'use client';

import { useState } from 'react';
import { PageHeader, Card, SectionHead, Field, inputCls, Btn, DataTable, Spinner, Badge, KpiCard } from '@/components/ui';
import { useSites, useWaste, useDispatches, useIncidents, useCloseGate, useCash, useTemperatures } from '@/hooks/useData';

type ReportType = 'waste' | 'dispatch' | 'incidents' | 'close_gate' | 'cash' | 'temperatures';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('waste');
  
  // Default to today
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [siteId, setSiteId] = useState('');

  const { data: sites } = useSites();

  // Params for SWR hooks
  const params: Record<string, string> = {
    start_date: startDate,
    end_date: endDate,
  };
  if (siteId) params.site_id = siteId;

  // We unconditionally call all hooks but they only fetch if we want? Actually SWR will fetch all of them by default.
  // It's better to fetch all since they are light, or we could conditionally fetch, but SWR allows conditional fetching if we pass null to key, but our hooks don't easily support that without modifying them.
  // It's fine for an admin dashboard to fetch them all, or we can just let them fetch.
  // Actually, to avoid unnecessary requests, let's just let them fetch for now as it's a simple app.
  
  const { data: wasteData, isLoading: wasteLoading } = useWaste(reportType === 'waste' ? params : undefined);
  const { data: dispatchData, isLoading: dispatchLoading } = useDispatches(reportType === 'dispatch' ? params : undefined);
  const { data: incidentData, isLoading: incidentLoading } = useIncidents(reportType === 'incidents' ? params : undefined);
  const { data: closeGateData, isLoading: closeGateLoading } = useCloseGate(reportType === 'close_gate' ? params : undefined);
  const { data: cashData, isLoading: cashLoading } = useCash(reportType === 'cash' ? params : undefined);
  const { data: tempsData, isLoading: tempsLoading } = useTemperatures(reportType === 'temperatures' ? params : undefined);

  // Render Logic based on type
  const renderWaste = () => {
    if (wasteLoading) return <div className="flex justify-center p-10"><Spinner /></div>;
    const rows = (wasteData?.data ?? []).map(w => ({
      id: w.id,
      date: w.waste_date,
      site: w.site?.name ?? '-',
      sku: <span className="font-semibold text-text">{w.sku}</span>,
      qty: w.units_wasted,
      reason: <span className="capitalize">{w.reason_code.replace('_', ' ')}</span>,
      cost: `MVR ${Number(w.total_recipe_cost).toFixed(2)}`,
      status: w.status === 'green' ? <Badge status="green">OK</Badge> : <Badge status="red">High</Badge>,
    }));
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KpiCard label="Total Waste Cost" value={`MVR ${Number(wasteData?.summary?.total_recipe_cost ?? 0).toFixed(2)}`} status="amber" />
          <KpiCard label="Total Units Wasted" value={wasteData?.summary?.total_units ?? 0} />
          <KpiCard label="Entries" value={wasteData?.data?.length ?? 0} />
        </div>
        <DataTable
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'site', label: 'Site' },
            { key: 'sku', label: 'SKU' },
            { key: 'qty', label: 'Qty' },
            { key: 'reason', label: 'Reason' },
            { key: 'cost', label: 'Cost' },
            { key: 'status', label: 'Status' },
          ]}
          rows={rows}
        />
      </>
    );
  };

  const renderDispatch = () => {
    if (dispatchLoading) return <div className="flex justify-center p-10"><Spinner /></div>;
    const rows = (dispatchData?.data ?? []).map(d => ({
      id: d.id,
      date: d.dispatch_date,
      origin: d.originSite?.name,
      dest: d.destinationSite?.name,
      sku: <span className="font-semibold">{d.sku}</span>,
      qty_sent: d.quantity_dispatched,
      qty_rec: d.quantity_received ?? '-',
      status: d.status === 'green' ? <Badge status="green">OK</Badge> : 
              d.status === 'amber' ? <Badge status="amber">Minor Variance</Badge> : 
              d.status === 'red' ? <Badge status="red">Major Variance</Badge> :
              <Badge status="gray">Pending</Badge>
    }));
    return (
      <DataTable
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'origin', label: 'Origin' },
          { key: 'dest', label: 'Destination' },
          { key: 'sku', label: 'SKU' },
          { key: 'qty_sent', label: 'Dispatched' },
          { key: 'qty_rec', label: 'Received' },
          { key: 'status', label: 'Status' },
        ]}
        rows={rows}
      />
    );
  };

  const renderIncidents = () => {
    if (incidentLoading) return <div className="flex justify-center p-10"><Spinner /></div>;
    const rows = (incidentData?.data ?? []).map(i => ({
      id: i.id,
      date: new Date(i.raised_at).toLocaleDateString(),
      site: i.site?.name,
      title: <span className="font-semibold">{i.title}</span>,
      severity: <Badge status={i.severity as any}>{i.severity.toUpperCase()}</Badge>,
      status: i.is_resolved ? <Badge status="green">Resolved</Badge> : <Badge status="red">Open</Badge>,
    }));
    return (
      <DataTable
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'site', label: 'Site' },
          { key: 'title', label: 'Incident' },
          { key: 'severity', label: 'Severity' },
          { key: 'status', label: 'Status' },
        ]}
        rows={rows}
      />
    );
  };

  const renderCloseGate = () => {
    if (closeGateLoading) return <div className="flex justify-center p-10"><Spinner /></div>;
    const rows = (closeGateData ?? []).map(c => ({
      id: c.id,
      date: c.gate_date,
      site: c.site?.name,
      status: c.gate_status === 'green' ? <Badge status="green">Pass</Badge> : 
              c.gate_status === 'amber' ? <Badge status="amber">Issues</Badge> : 
              <Badge status="red">Failed</Badge>,
      override: c.overrideApprovedBy ? <Badge status="amber">Overridden</Badge> : '-',
    }));
    return (
      <DataTable
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'site', label: 'Site' },
          { key: 'status', label: 'Status' },
          { key: 'override', label: 'Override' },
        ]}
        rows={rows}
      />
    );
  };

  const renderCash = () => {
    if (cashLoading) return <div className="flex justify-center p-10"><Spinner /></div>;
    const rows = (cashData ?? []).map(c => ({
      id: c.id,
      date: c.recon_date,
      site: c.site?.name,
      expected: `MVR ${Number(c.expected_cash).toFixed(2)}`,
      actual: `MVR ${Number(c.actual_cash_counted).toFixed(2)}`,
      variance: Number(c.actual_cash_counted) - Number(c.expected_cash) !== 0 
        ? <span className="text-palato-red">MVR {(Number(c.actual_cash_counted) - Number(c.expected_cash)).toFixed(2)}</span>
        : '0.00',
      status: c.status === 'green' ? <Badge status="green">OK</Badge> : <Badge status="red">Variance</Badge>,
    }));
    return (
      <DataTable
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'site', label: 'Site' },
          { key: 'expected', label: 'Expected' },
          { key: 'actual', label: 'Actual' },
          { key: 'variance', label: 'Variance' },
          { key: 'status', label: 'Status' },
        ]}
        rows={rows}
      />
    );
  };

  const renderTemperatures = () => {
    if (tempsLoading) return <div className="flex justify-center p-10"><Spinner /></div>;
    const rows = (tempsData ?? []).map(t => ({
      id: t.id,
      date: t.log_date,
      site: t.site?.name,
      unit: t.unit_name,
      temp: `${t.temp_c}°C`,
      status: t.within_range ? <Badge status="green">OK</Badge> : <Badge status="red">Out of bounds</Badge>,
    }));
    return (
      <DataTable
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'site', label: 'Site' },
          { key: 'unit', label: 'Unit' },
          { key: 'temp', label: 'Temp' },
          { key: 'status', label: 'Status' },
        ]}
        rows={rows}
      />
    );
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        title="Reporting & Analytics"
        subtitle="Extract historical data across all operations"
      />

      <Card className="mb-6">
        <SectionHead>Report Filters</SectionHead>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Report Type">
            <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} className={inputCls}>
              <option value="waste">Waste Log</option>
              <option value="dispatch">Dispatch & Variances</option>
              <option value="incidents">Incidents</option>
              <option value="close_gate">Close Gate</option>
              <option value="cash">Cash Reconciliation</option>
              <option value="temperatures">Temperatures</option>
            </select>
          </Field>
          <Field label="Start Date">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="End Date">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Site (Optional)">
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className={inputCls}>
              <option value="">All Sites</option>
              {sites?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <SectionHead>
            {reportType === 'waste' && 'Waste Report'}
            {reportType === 'dispatch' && 'Dispatch Report'}
            {reportType === 'incidents' && 'Incidents Report'}
            {reportType === 'close_gate' && 'Close Gate Report'}
            {reportType === 'cash' && 'Cash Reconciliation Report'}
            {reportType === 'temperatures' && 'Temperature Logs'}
          </SectionHead>
          {/* In the future, we could add a CSV export button here */}
          <Btn onClick={() => window.print()} className="!py-1.5 !px-3 !text-xs">Print / PDF</Btn>
        </div>
        
        {reportType === 'waste' && renderWaste()}
        {reportType === 'dispatch' && renderDispatch()}
        {reportType === 'incidents' && renderIncidents()}
        {reportType === 'close_gate' && renderCloseGate()}
        {reportType === 'cash' && renderCash()}
        {reportType === 'temperatures' && renderTemperatures()}
      </Card>
    </div>
  );
}
