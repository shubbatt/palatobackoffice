'use client';

import { useState } from 'react';
import { users as usersApi } from '@/lib/api';
import { Card, Btn, Field, SectionHead, Badge, inputCls, Spinner, PageHeader, DataTable } from '@/components/ui';
import toast from 'react-hot-toast';
import { mutate } from 'swr';
import { useUsers, useSites } from '@/hooks/useData';
import { User, UserRole } from '@/types';

export default function AdminUsersPage() {
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: sites } = useSites();
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp_number: '',
    password: '',
    role: 'shift_manager',
    site_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.email || (!editingId && !form.password)) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        site_id: form.site_id ? Number(form.site_id) : null,
      };

      if (editingId) {
        await usersApi.update(editingId, payload);
        toast.success('User updated');
      } else {
        await usersApi.store(payload);
        toast.success('User created');
      }
      setForm({ name: '', email: '', phone: '', whatsapp_number: '', password: '', role: 'shift_manager', site_id: '' });
      setEditingId(null);
      mutate('/users');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      phone: (user as any).phone ?? '',
      whatsapp_number: (user as any).whatsapp_number ?? '',
      password: '', // blank password field for edit means no change
      role: user.role,
      site_id: user.site_id ? user.site_id.toString() : '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await usersApi.destroy(id);
      toast.success('User deactivated');
      mutate('/users');
    } catch (e: any) {
      toast.error('Failed to deactivate user');
    }
  };

  const roles = ['shift_manager', 'production_lead', 'operations_head', 'finance', 'owner'];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Manage Users"
        subtitle="Create staff accounts, assign roles, and allocate sites"
      />

      <Card className="mb-6">
        <SectionHead>{editingId ? 'Edit User' : 'Add New User'}</SectionHead>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Full Name">
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. John Doe" className={inputCls} />
          </Field>
          <Field label="Email Address">
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="e.g. john@palato.mv" className={inputCls} />
          </Field>
          <Field label="Phone (Optional)">
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="e.g. 7771234" className={inputCls} />
          </Field>
          <Field label="Password">
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder={editingId ? 'Leave blank to keep unchanged' : 'Enter strong password'} className={inputCls} />
          </Field>
          <Field label="Role">
            <select value={form.role} onChange={(e) => set('role', e.target.value)} className={inputCls}>
              {roles.map((r) => (
                <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
          </Field>
          <Field label="Assigned Site (Optional)">
            <select value={form.site_id} onChange={(e) => set('site_id', e.target.value)} className={inputCls}>
              <option value="">No Site (System-wide access)</option>
              {sites?.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          {editingId && (
            <button className="text-sm font-medium text-muted hover:text-text" onClick={() => { setEditingId(null); setForm({ name: '', email: '', phone: '', whatsapp_number: '', password: '', role: 'shift_manager', site_id: '' }); }}>
              Cancel
            </button>
          )}
          <Btn onClick={submit} loading={submitting} disabled={submitting || !form.name || !form.email || (!editingId && !form.password)}>
            {editingId ? 'Update User' : 'Create User'}
          </Btn>
        </div>
      </Card>

      <Card>
        <SectionHead>System Users</SectionHead>
        {usersLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <DataTable
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'role', label: 'Role' },
              { key: 'site', label: 'Assigned Site' },
              { key: 'status', label: 'Status' },
              { key: 'actions', label: 'Actions', align: 'right' },
            ]}
            rows={(users ?? []).map((u: any) => ({
              id: u.id,
              name: <span className="font-semibold text-text">{u.name}</span>,
              email: <span className="text-sm text-muted">{u.email}</span>,
              role: <span className="text-xs font-semibold capitalize text-palato-blue">{u.role.replace('_', ' ')}</span>,
              site: <span className="text-sm text-muted">{u.site ? u.site.name : '-'}</span>,
              status: u.is_active ? <Badge status="green">Active</Badge> : <Badge status="red">Inactive</Badge>,
              actions: (
                <div className="flex justify-end gap-2">
                  <button onClick={() => handleEdit(u)} className="text-xs font-semibold text-palato-blue hover:text-palato-blue/80">Edit</button>
                  {u.is_active && (
                    <button onClick={() => handleDelete(u.id)} className="text-xs font-semibold text-palato-red hover:text-palato-red/80">Deactivate</button>
                  )}
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  );
}
