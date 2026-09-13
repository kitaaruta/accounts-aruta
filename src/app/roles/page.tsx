'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  listRoles, 
  saveRole, 
  deleteRole, 
  listPermissions,
  logSSOEvent 
} from '@/lib/services/firestore-service';
import { SSORole, SSOPermission } from '@/types/sso';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Key, 
  Lock 
} from 'lucide-react';

export default function RolesPage() {
  const [roles, setRoles] = useState<SSORole[]>([]);
  const [permissions, setPermissions] = useState<SSOPermission[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedRole, setSelectedRole] = useState<SSORole | null>(null);

  // Form
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [r, p] = await Promise.all([listRoles(), listPermissions()]);
      setRoles(r);
      setPermissions(p);
    } catch (e) {
      console.error('Failed loading roles data:', e);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedRole(null);
    setFormName('');
    setFormDesc('');
    setSelectedPerms(['sso.authorize']);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: SSORole) => {
    setModalMode('edit');
    setSelectedRole(role);
    setFormName(role.name);
    setFormDesc(role.description);
    setSelectedPerms(role.permissions);
    setIsModalOpen(true);
  };

  const togglePermission = (permKey: string) => {
    if (selectedPerms.includes(permKey)) {
      setSelectedPerms(selectedPerms.filter(k => k !== permKey));
    } else {
      setSelectedPerms([...selectedPerms, permKey]);
    }
  };

  const handleDeleteRole = async (role: SSORole) => {
    if (role.isSystemRole) {
      alert('Peran sistem inti tidak dapat dihapus untuk menjaga integritas keamanan SSO.');
      return;
    }

    if (confirm(`Hapus peran "${role.name}"? Pengguna dengan peran ini perlu dialihkan ke peran lain.`)) {
      try {
        await deleteRole(role.id);
        await logSSOEvent('role_assigned', 'admin@aruta.id', `Peran ${role.name} dihapus`, 'admin');
        showNotification('success', `Peran "${role.name}" berhasil dihapus.`);
        await loadData();
      } catch (e) {
        showNotification('error', 'Gagal menghapus peran.');
      }
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'create') {
        const newRoleId = 'role-' + formName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const newRole: SSORole = {
          id: newRoleId,
          name: formName,
          description: formDesc,
          permissions: selectedPerms,
          isSystemRole: false,
          createdAt: new Date().toISOString(),
        };
        await saveRole(newRole);
        await logSSOEvent('role_assigned', 'admin@aruta.id', `Peran baru dibuat: ${formName}`, 'admin');
        showNotification('success', `Peran baru "${formName}" berhasil ditambahkan.`);
      } else if (selectedRole) {
        const updated: SSORole = {
          ...selectedRole,
          name: formName,
          description: formDesc,
          permissions: selectedPerms,
          updatedAt: new Date().toISOString(),
        };
        await saveRole(updated);
        await logSSOEvent('role_assigned', 'admin@aruta.id', `Peran ${formName} diperbarui`, 'admin');
        showNotification('success', `Peran "${formName}" berhasil diperbarui.`);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (e) {
      showNotification('error', 'Gagal menyimpan peran.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Peran & Matriks Akses (Roles)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur tingkat wewenang akun dan delegasikan izin ke aplikasi-aplikasi dalam ekosistem SSO
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Peran Baru</span>
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`flex items-center gap-2.5 rounded-lg p-3 text-xs border ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Roles List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 py-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              Memuat data peran sistem...
            </div>
          ) : (
            roles.map((role) => (
              <div
                key={role.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">{role.name}</h2>
                        {role.isSystemRole && (
                          <span className="text-[10px] text-blue-600 font-medium">System Core Role</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(role)}
                        className="p-1.5 rounded-md text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Peran"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      {!role.isSystemRole && (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          className="p-1.5 rounded-md text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Peran"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-700 block">
                      Izin yang Dimiliki ({role.permissions.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((pKey) => (
                        <span
                          key={pKey}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-700 border border-slate-200"
                        >
                          <Key className="h-2.5 w-2.5 text-slate-400" />
                          {pKey}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>ID: <code className="font-mono text-slate-600">{role.id}</code></span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Create/Edit Role */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === 'create' ? 'Buat Peran Baru' : `Edit Peran: ${selectedRole?.name}`}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Peran
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="e.g. Finance Officer"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deskripsi Peran
                  </label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Jelaskan cakupan wewenang peran ini..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Tetapkan Hak Akses (Permissions)
                  </label>
                  <div className="space-y-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                    {permissions.map((perm) => {
                      const checked = selectedPerms.includes(perm.key);
                      return (
                        <label
                          key={perm.id}
                          className="flex items-start gap-2.5 p-1.5 rounded hover:bg-white cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(perm.key)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-800">{perm.name}</span>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-200/70 px-1.5 rounded">
                                {perm.key}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">{perm.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {saving ? 'Menyimpan...' : modalMode === 'create' ? 'Simpan Peran' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
