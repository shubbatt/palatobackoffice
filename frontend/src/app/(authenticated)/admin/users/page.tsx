'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { users, sites } from '@/lib/api';
import { PageHeader, Card, DataTable, Btn, Badge, Field, inputCls, Spinner, AlertBanner } from '@/components/ui';
import { ROLE_LABELS, type UserRole } from '@/lib/store';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { data: usersData, mutate: mutateUsers, error: usersErr } = useSWR('/users', () => users.list().then(res => res.data));
  const { data: sitesData } = useSWR('/sites', () => sites.list().then(res => res.data));

  const [isEditing, setIsEditing] = useState<any>(null); // null = not editing, {} = new user, {...user} = editing user
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp_number: '',
    password: '',
    role: 'shift_manager',
    site_id: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      whatsapp_number: '',
      password: '',
      role: 'shift_manager',
      site_id: '',
      is_active: true,
    });
    setIsEditing({});
  };

  const openEdit = (u: any) => {
    setFormData({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      whatsapp_number: u.whatsapp_number || '',
      password: '', // leave empty unless changing
      role: u.role || 'shift_manager',
      site_id: u.site_id?.toString() || '',
      is_active: !!u.is_active,
    });
    setIsEditing(u);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        site_id: formData.site_id ? parseInt(formData.site_id, 10) : null,
      };
      if (isEditing.id) {
        if (!payload.password) delete payload.password; // Don't send empty password when updating
        await users.update(isEditing.id, payload);
        toast.success('User updated');
      } else {
        await users.store(payload);
        toast.success('User created');
      }
      mutateUsers();
      setIsEditing(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await users.destroy(id);
      toast.success('User deactivated');
      mutateUsers();
    } catch (err) {
      toast.error('Failed to deactivate user');
    }
  };

  if (usersErr) return <AlertBanner severity="red">Failed to load users.</AlertBanner>;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Manage Users"
        subtitle="Manage user accounts, roles, and site assignments."
        action={<Btn onClick={openCreate} icon={<span>+</span>}>Add User</Btn>}
      />

      {isEditing && (
        <Card className="mb-6 border-accent/50 bg-surface/50 shadow-lg shadow-black/40">
          <h2 className="text-lg font-bold mb-4">{isEditing.id ? 'Edit User' : 'Create New User'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name">
                <input required className={inputCls} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </Field>
              <Field label="Email Address">
                <input required type="email" className={inputCls} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </Field>
              <Field label="Phone">
                <input className={inputCls} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </Field>
              <Field label="WhatsApp Number">
                <input className={inputCls} value={formData.whatsapp_number} onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })} />
              </Field>
              <Field label="Role">
                <select required className={inputCls} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Assigned Site (Optional)">
                <select className={inputCls} value={formData.site_id} onChange={e => setFormData({ ...formData, site_id: e.target.value })}>
                  <option value="">None (Head Office / All Sites)</option>
                  {sitesData?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>
              <Field label={isEditing.id ? "New Password (leave empty to keep current)" : "Password"}>
                <input required={!isEditing.id} minLength={6} type="password" className={inputCls} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              </Field>
              <Field label="Account Status">
                <div className="flex items-center gap-2 h-full py-2">
                  <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded border-border bg-surface text-accent focus:ring-accent" />
                  <span className="text-sm">Active Account</span>
                </div>
              </Field>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Btn variant="ghost" onClick={() => setIsEditing(null)}>Cancel</Btn>
              <Btn type="submit" loading={submitting}>Save User</Btn>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {!usersData ? (
          <div className="flex justify-center p-8"><Spinner /></div>
        ) : (
          <DataTable
            headers={['Name', 'Email', 'Role', 'Site', 'Status', 'Actions']}
            rows={usersData}
            keyExtractor={(u: any) => u.id}
            renderRow={(u: any) => (
              <>
                <td className="px-4 py-3 text-sm font-medium">{u.name}</td>
                <td className="px-4 py-3 text-sm text-muted">{u.email}</td>
                <td className="px-4 py-3 text-sm"><Badge status="pending">{ROLE_LABELS[u.role as UserRole] || u.role}</Badge></td>
                <td className="px-4 py-3 text-sm">{u.site ? u.site.name : <span className="text-muted italic">None</span>}</td>
                <td className="px-4 py-3 text-sm">
                  {u.is_active ? <Badge status="green">Active</Badge> : <Badge status="red">Inactive</Badge>}
                </td>
                <td className="px-4 py-3 text-sm text-right flex justify-end gap-2">
                  <Btn size="sm" variant="ghost" onClick={() => openEdit(u)}>Edit</Btn>
                  {u.is_active && (
                    <Btn size="sm" variant="danger" onClick={() => handleDeactivate(u.id)}>Deactivate</Btn>
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
