'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  listPermissions, 
  savePermission, 
  deletePermission,
  logSSOEvent 
} from '@/lib/services/firestore-service';
import { SSOPermission } from '@/types/sso';
import { 
  Key, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Layers, 
  Search 
} from 'lucide-react';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<SSOPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formKey, setFormKey] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<SSOPermission['category']>('sso');
  const [formDesc, setFormDesc] = useState('');

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await listPermissions();
      setPermissions(data);
    } catch (e) {
      console.error('Failed loading permissions:', e);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenCreate = () => {
    setFormKey('');
    setFormName('');
    setFormCategory('sso');
    setFormDesc('');
    setIsModalOpen(true);
  };

  const handleDelete = async (perm: SSOPermission) => {
    if (confirm(`Hapus izin "${perm.name}" (${perm.key})? Peran yang memiliki izin ini akan kehilangan wewenang tersebut.`)) {
      try {
        await deletePermission(perm.id);
        await logSSOEvent('role_assigned', 'admin@aruta.id', `Izin ${perm.key} dihapus`, 'admin');
        showNotification('success', `Izin "${perm.name}" berhasil dihapus.`);
        await loadPermissions();
      } catch (e) {
        showNotification('error', 'Gagal menghapus izin.');
      }
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanKey = formKey.toLowerCase().replace(/[^a-z0-9_.]/g, '');
      const newPerm: SSOPermission = {
        id: 'perm-' + Math.random().toString(36).substring(2, 9),
        key: cleanKey,
        name: formName,
        category: formCategory,
        description: formDesc,
      };
      await savePermission(newPerm);
      await logSSOEvent('role_assigned', 'admin@aruta.id', `Izin baru didaftarkan: ${cleanKey}`, 'admin');
      showNotification('success', `Izin "${formName}" berhasil ditambahkan.`);
      setIsModalOpen(false);
      await loadPermissions();
    } catch (e) {
      showNotification('error', 'Gagal menyimpan izin.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = permissions.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const categories = ['all', 'users', 'roles', 'apps', 'sso', 'settings', 'audit'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Katalog Hak Akses (Permissions)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar izin wewenang granular yang digunakan untuk otorisasi endpoint SSO dan kontrol modul
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Izin Baru</span>
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

        {/* Search & Category Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kunci izin atau nama..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              Memuat katalog hak akses...
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
              Tidak ada izin yang sesuai kriteria pencarian.
            </div>
          ) : (
            filtered.map((perm) => (
              <div
                key={perm.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-slate-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {perm.key}
                    </span>
                    <button
                      onClick={() => handleDelete(perm)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Hapus Izin"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 mt-1">{perm.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {perm.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="capitalize">Kategori: <strong className="text-slate-700 font-semibold">{perm.category}</strong></span>
                  <span className="font-mono">ID: {perm.id}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Create Permission */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900">Tambah Hak Akses Baru</h3>
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
                    Kunci Izin (Unique Permission Key)
                  </label>
                  <input
                    type="text"
                    value={formKey}
                    onChange={(e) => setFormKey(e.target.value)}
                    required
                    placeholder="e.g. reports.export"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-mono text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Izin
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="e.g. Ekspor Laporan"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as SSOPermission['category'])}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="users">Users</option>
                    <option value="roles">Roles</option>
                    <option value="apps">Apps</option>
                    <option value="sso">SSO</option>
                    <option value="settings">Settings</option>
                    <option value="audit">Audit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deskripsi Hak Akses
                  </label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Penjelasan efek otorisasi dari izin ini..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
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
                    {saving ? 'Menyimpan...' : 'Tambah Izin'}
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
