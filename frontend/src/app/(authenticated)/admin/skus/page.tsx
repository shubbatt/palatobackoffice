'use client';

import { useState } from 'react';
import { skus as skusApi } from '@/lib/api';
import { Card, Btn, Field, SectionHead, Badge, inputCls, Spinner, PageHeader, DataTable } from '@/components/ui';
import toast from 'react-hot-toast';
import { mutate } from 'swr';
import { useSkuCosts } from '@/hooks/useData';
import { SkuCost } from '@/types';

export default function AdminSkusPage() {
  const { data: skus, isLoading } = useSkuCosts();
  const [form, setForm] = useState({
    sku: '',
    category: '',
    recipe_cost: '',
    retail_price: '',
    is_controlled: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.sku || !form.recipe_cost || !form.retail_price) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        recipe_cost: Number(form.recipe_cost),
        retail_price: Number(form.retail_price),
      };

      if (editingId) {
        await skusApi.update(editingId, payload);
        toast.success('SKU updated');
      } else {
        await skusApi.store(payload);
        toast.success('SKU created');
      }
      setForm({ sku: '', category: '', recipe_cost: '', retail_price: '', is_controlled: false });
      setEditingId(null);
      mutate('/sku-costs');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to save SKU');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (sku: SkuCost) => {
    setEditingId(sku.id);
    setForm({
      sku: sku.sku,
      category: sku.category ?? '',
      recipe_cost: sku.recipe_cost.toString(),
      retail_price: sku.retail_price.toString(),
      is_controlled: sku.is_controlled,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this SKU?')) return;
    try {
      await skusApi.destroy(id);
      toast.success('SKU deactivated');
      mutate('/sku-costs');
    } catch (e: any) {
      toast.error('Failed to deactivate SKU');
    }
  };

  const fmt = (n: number) => `MVR ${Number(n).toLocaleString()}`;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Manage SKUs"
        subtitle="Add, update, or deactivate products and costs"
      />

      <Card className="mb-6">
        <SectionHead>{editingId ? 'Edit SKU' : 'Add New SKU'}</SectionHead>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="SKU / Name">
            <input value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="e.g. Croissant" className={inputCls} disabled={editingId !== null} />
          </Field>
          <Field label="Category">
            <input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Pastry" className={inputCls} />
          </Field>
          <Field label="Recipe Cost (MVR)">
            <input type="number" min="0" step="0.01" value={form.recipe_cost} onChange={(e) => set('recipe_cost', e.target.value)} placeholder="0.00" className={inputCls} />
          </Field>
          <Field label="Retail Price (MVR)">
            <input type="number" min="0" step="0.01" value={form.retail_price} onChange={(e) => set('retail_price', e.target.value)} placeholder="0.00" className={inputCls} />
          </Field>
          <Field label="Controlled Item">
            <label className="flex items-center gap-2 h-11">
              <input type="checkbox" checked={form.is_controlled} onChange={(e) => set('is_controlled', e.target.checked)} className="rounded border-border text-accent focus:ring-accent" />
              <span className="text-sm text-text">Track separately as controlled stock</span>
            </label>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          {editingId && (
            <button className="text-sm font-medium text-muted hover:text-text" onClick={() => { setEditingId(null); setForm({ sku: '', category: '', recipe_cost: '', retail_price: '', is_controlled: false }); }}>
              Cancel
            </button>
          )}
          <Btn onClick={submit} loading={submitting} disabled={submitting || !form.sku || !form.recipe_cost || !form.retail_price}>
            {editingId ? 'Update SKU' : 'Create SKU'}
          </Btn>
        </div>
      </Card>

      <Card>
        <SectionHead>Active SKUs</SectionHead>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <DataTable
            columns={[
              { key: 'sku', label: 'SKU' },
              { key: 'category', label: 'Category' },
              { key: 'cost', label: 'Recipe Cost', align: 'right' },
              { key: 'price', label: 'Retail Price', align: 'right' },
              { key: 'controlled', label: 'Controlled', align: 'center' },
              { key: 'actions', label: 'Actions', align: 'right' },
            ]}
            rows={(skus ?? []).map((s) => ({
              id: s.id,
              sku: <span className="font-semibold text-text">{s.sku}</span>,
              category: <span className="text-sm text-muted">{s.category || '-'}</span>,
              cost: <span className="text-sm text-muted">{fmt(s.recipe_cost)}</span>,
              price: <span className="text-sm font-medium text-text">{fmt(s.retail_price)}</span>,
              controlled: s.is_controlled ? <Badge status="amber">Yes</Badge> : <span className="text-sm text-muted">-</span>,
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
