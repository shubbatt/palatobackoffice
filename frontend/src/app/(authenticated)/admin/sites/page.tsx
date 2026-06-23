'use client';

import { useState } from 'react';
import { sites as sitesApi } from '@/lib/api';
import { Card, Btn, Field, SectionHead, Badge, inputCls, Spinner, PageHeader, DataTable } from '@/components/ui';
import toast from 'react-hot-toast';
import { mutate } from 'swr';
import { useSites } from '@/hooks/useData';
import { Site } from '@/types';

export default function AdminSitesPage() {
  const { data: sites, isLoading } = useSites();
  const [form, setForm] = useState({
    name: '',
    type: 'outlet',
    opening_owner: '',
    closing_owner: '',
    operating_hours: '',
    primary_supply_source: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.type) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await sitesApi.update(editingId, form);
        toast.success('Site updated');
      } else {
        await sitesApi.store(form);
        toast.success('Site created');
      }
      setForm({ name: '', type: 'outlet', opening_owner: '', closing_owner: '', operating_hours: '', primary_supply_source: '' });
      setEditingId(null);
      mutate('/sites');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to save site');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (site: Site) => {
    setEditingId(site.id);
    setForm({
      name: site.name,
      type: site.type,
      opening_owner: site.opening_owner ?? '',
      closing_owner: site.closing_owner ?? '',
      operating_hours: site.operating_hours ?? '',
      primary_supply_source: site.primary_supply_source ?? '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this site?')) return;
    try {
      await sitesApi.destroy(id);
      toast.success('Site deactivated');
      mutate('/sites');
    } catch (e: any) {
      toast.error('Failed to deactivate site');
    }
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Manage Sites"
        subtitle="Add, update, or deactivate physical locations"
      />

      <Card className="mb-6">
        <SectionHead>{editingId ? 'Edit Site' : 'Add New Site'}</SectionHead>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Site Name">
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Malé Bakery" className={inputCls} />
          </Field>
          <Field label="Site Type">
            <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
              <option value="outlet">Outlet</option>
              <option value="production">Production</option>
              <option value="warehouse">Warehouse</option>
            </select>
          </Field>
          <Field label="Operating Hours">
            <input value={form.operating_hours} onChange={(e) => set('operating_hours', e.target.value)} placeholder="e.g. 06:00 - 22:00" className={inputCls} />
          </Field>
          <Field label="Opening Owner">
            <input value={form.opening_owner} onChange={(e) => set('opening_owner', e.target.value)} placeholder="e.g. Alice" className={inputCls} />
          </Field>
          <Field label="Closing Owner">
            <input value={form.closing_owner} onChange={(e) => set('closing_owner', e.target.value)} placeholder="e.g. Bob" className={inputCls} />
          </Field>
          <Field label="Primary Supply Source">
            <input value={form.primary_supply_source} onChange={(e) => set('primary_supply_source', e.target.value)} placeholder="e.g. Central Kitchen" className={inputCls} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          {editingId && (
            <button className="text-sm font-medium text-muted hover:text-text" onClick={() => { setEditingId(null); setForm({ name: '', type: 'outlet', opening_owner: '', closing_owner: '', operating_hours: '', primary_supply_source: '' }); }}>
              Cancel
            </button>
          )}
          <Btn onClick={submit} loading={submitting} disabled={submitting || !form.name}>
            {editingId ? 'Update Site' : 'Create Site'}
          </Btn>
        </div>
      </Card>

      <Card>
        <SectionHead>Active Sites</SectionHead>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <DataTable
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'type', label: 'Type' },
              { key: 'hours', label: 'Hours' },
              { key: 'opening', label: 'Opening Owner' },
              { key: 'closing', label: 'Closing Owner' },
              { key: 'supply', label: 'Supply Source' },
              { key: 'actions', label: 'Actions', align: 'right' },
            ]}
            rows={(sites ?? []).map((s) => ({
              id: s.id,
              name: <span className="font-semibold text-text">{s.name}</span>,
              type: <Badge status={s.type === 'production' ? 'green' : 'blue'}>{s.type}</Badge>,
              hours: <span className="text-sm text-muted">{s.operating_hours || '-'}</span>,
              opening: <span className="text-sm text-muted">{s.opening_owner || '-'}</span>,
              closing: <span className="text-sm text-muted">{s.closing_owner || '-'}</span>,
              supply: <span className="text-sm text-muted">{s.primary_supply_source || '-'}</span>,
              actions: (
                <div className="flex justify-end gap-2">
                  <button onClick={() => handleEdit(s)} className="text-xs font-semibold text-palato-blue hover:text-palato-blue/80">Edit</button>
                  <button onClick={() => handleDelete(s.id)} className="text-xs font-semibold text-palato-red hover:text-palato-red/80">Deactivate</button>
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  );
}
