'use client';

import { useState } from 'react';
import { reports } from '@/lib/api';
import { PageHeader, Card, KpiCard, DataTable, Btn, Badge, Field, inputCls, Spinner } from '@/components/ui';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const res = await reports.custom(startDate, endDate);
      setData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Custom Reports"
        subtitle="View aggregated data across any date range."
      />

      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/3">
            <Field label="Start Date">
              <input 
                type="date" 
                className={inputCls} 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                max={endDate}
              />
            </Field>
          </div>
          <div className="w-full md:w-1/3">
            <Field label="End Date">
              <input 
                type="date" 
                className={inputCls} 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                min={startDate}
              />
            </Field>
          </div>
          <div className="w-full md:w-1/3">
            <Btn onClick={fetchReport} loading={loading} className="w-full justify-center">
              Generate Report
            </Btn>
          </div>
        </div>
      </Card>

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Open Incidents"
              value={data.incidents.filter((i: any) => !i.is_resolved).length}
              sub={`${data.red_incident_count} Critical`}
              status={data.red_incident_count > 0 ? 'red' : data.incidents.filter((i: any) => !i.is_resolved).length > 0 ? 'amber' : 'green'}
            />
            <KpiCard
              label="Total Waste"
              value={`$${Number(data.waste.total_recipe_cost).toFixed(2)}`}
              sub={`Retail: $${Number(data.waste.total_retail_value).toFixed(2)}`}
              status={data.waste.total_recipe_cost > 500 ? 'red' : 'green'}
            />
            <KpiCard
              label="Cash Variance"
              value={`$${Number(data.cash.total_variance).toFixed(2)}`}
              sub={`${data.cash.red_sites} Flagged Reconciliations`}
              status={Math.abs(data.cash.total_variance) > 50 ? 'red' : 'green'}
            />
            <KpiCard
              label="Temp Breaches"
              value={data.temperature_breaches.length}
              status={data.temperature_breaches.length > 0 ? 'red' : 'green'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-lg font-bold mb-4">Top Waste SKUs</h2>
              <DataTable
                headers={['SKU', 'Total Cost']}
                rows={data.waste.top_skus}
                keyExtractor={(item: any) => item.sku}
                renderRow={(item: any) => (
                  <>
                    <td className="px-4 py-3 font-medium text-sm">{item.sku}</td>
                    <td className="px-4 py-3 text-sm">${Number(item.total).toFixed(2)}</td>
                  </>
                )}
              />
            </Card>

            <Card>
              <h2 className="text-lg font-bold mb-4">All Incidents</h2>
              <DataTable
                headers={['Date', 'Ref', 'Site', 'Title', 'Status']}
                rows={data.incidents}
                keyExtractor={(i: any) => i.id}
                renderRow={(i: any) => (
                  <>
                    <td className="px-4 py-3 text-sm text-muted">{new Date(i.raised_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-mono text-xs">{i.reference}</td>
                    <td className="px-4 py-3 text-sm font-medium">{i.site?.name}</td>
                    <td className="px-4 py-3 text-sm truncate max-w-[150px]">{i.title}</td>
                    <td className="px-4 py-3 text-sm">
                      {i.is_resolved ? <Badge status="green">Resolved</Badge> : <Badge status={i.severity}>{i.severity}</Badge>}
                    </td>
                  </>
                )}
              />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
