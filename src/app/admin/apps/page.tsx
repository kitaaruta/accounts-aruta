'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  listRegisteredApps, 
  saveRegisteredApp, 
  deleteRegisteredApp,
  logSSOEvent 
} from '@/lib/services/firestore-service';
import { RegisteredApp } from '@/types/sso';
import { 
  AppWindow, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Globe,
  Code2 
} from 'lucide-react';

export default function AdminAppsManagementPage() {
  const [apps, setApps] = useState<RegisteredApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedApp, setSelectedApp] = useState<RegisteredApp | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formRedirectUris, setFormRedirectUris] = useState('');
  const [formScopes, setFormScopes] = useState('openid, profile, email');
  const [formIsActive, setFormIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      const data = await listRegisteredApps();
      setApps(data);
    } catch (e) {
      console.error('Failed loading apps:', e);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedApp(null);
    setFormName('');
    setFormDesc('');
    setFormRedirectUris('https://riset.aruta.id/auth/callback');
    setFormScopes('openid, profile, email');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (app: RegisteredApp) => {
    setModalMode('edit');
    setSelectedApp(app);
    setFormName(app.name);
    setFormDesc(app.description);
    setFormRedirectUris(app.redirectUris.join('\n'));
    setFormScopes(app.allowedScopes.join(', '));
    setFormIsActive(app.isActive);
    setIsModalOpen(true);
  };

  const handleDeleteApp = async (app: RegisteredApp) => {
    if (confirm(`Hapus integrasi aplikasi "${app.name}"? Aplikasi ini tidak lagi dapat melakukan autorisasi via SSO Aruta.`)) {
      try {
        await deleteRegisteredApp(app.id);
        await logSSOEvent('app_authorized', 'admin@aruta.id', `Aplikasi ${app.name} dihapus dari SSO`, 'admin');
        showNotification('success', `Aplikasi ${app.name} berhasil dihapus.`);
        await loadApps();
      } catch (err) {
        showNotification('error', 'Gagal menghapus aplikasi.');
      }
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showNotification('error', 'Nama aplikasi wajib diisi.');
      return;
    }

    const uris = formRedirectUris.split('\n').map(u => u.trim()).filter(Boolean);
    const scopes = formScopes.split(',').map(s => s.trim()).filter(Boolean);

    if (uris.length === 0) {
      showNotification('error', 'Harap masukkan minimal satu Redirect URI yang valid.');
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'create') {
        const randId = Math.random().toString(36).substring(2, 8);
        const newClientId = 'aruta_app_' + randId;
        const newClientSecret = 'sec_live_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
        const newApp: RegisteredApp = {
          id: 'app-' + randId,
          name: formName.trim(),
          description: formDesc.trim(),
          clientId: newClientId,
          clientSecret: newClientSecret,
          redirectUris: uris,
          allowedScopes: scopes.length > 0 ? scopes : ['openid', 'profile', 'email'],
          isActive: formIsActive,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveRegisteredApp(newApp);
        await logSSOEvent('app_authorized', 'admin@aruta.id', `Aplikasi baru didaftarkan: ${formName}`, 'admin');
        showNotification('success', `Aplikasi "${formName}" berhasil didaftarkan.`);
      } else if (selectedApp) {
        const updated: RegisteredApp = {
          ...selectedApp,
          name: formName.trim(),
          description: formDesc.trim(),
          redirectUris: uris,
          allowedScopes: scopes.length > 0 ? scopes : ['openid', 'profile', 'email'],
          isActive: formIsActive,
          updatedAt: new Date().toISOString(),
        };
        await saveRegisteredApp(updated);
        await logSSOEvent('app_authorized', 'admin@aruta.id', `Konfigurasi aplikasi ${formName} diperbarui`, 'admin');
        showNotification('success', `Aplikasi "${formName}" berhasil diperbarui.`);
      }
      setIsModalOpen(false);
      await loadApps();
    } catch (err: unknown) {
      console.error('Error saving app:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan konfigurasi aplikasi.';
      showNotification('error', `Gagal menyimpan: ${msg}`);
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
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Aplikasi Terdaftar (Apps & Clients)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola aplikasi eksternal yang diizinkan mengautentikasi dan mengotorisasi pengguna melalui SSO Aruta
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/docs"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <Code2 className="h-4 w-4 text-blue-600" />
              <span>Panduan Integrasi Developer</span>
            </Link>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Daftarkan Aplikasi Baru</span>
            </button>
          </div>
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

        {/* App List */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              Memuat daftar aplikasi SSO...
            </div>
          ) : apps.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
              Belum ada aplikasi yang didaftarkan.
            </div>
          ) : (
            apps.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                      <AppWindow className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900">{app.name}</h2>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            app.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {app.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 max-w-xl">
                        {app.description || 'Tidak ada deskripsi'}
                      </p>

                      {/* Scopes */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 font-medium">Izin Cakupan:</span>
                        {app.allowedScopes.map((scope) => (
                          <span
                            key={scope}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 border border-slate-200/80"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                    <button
                      onClick={() => handleOpenEdit(app)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteApp(app)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>

                {/* Credentials & Redirect URIs Box */}
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Client ID & Secret */}
                  <div className="space-y-2 rounded-lg bg-slate-50 p-3 border border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Client ID:</span>
                      <button
                        onClick={() => copyToClipboard(app.clientId, app.id + '_id')}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                      >
                        {copiedKey === app.id + '_id' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedKey === app.id + '_id' ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-[11px] text-slate-800 bg-white p-1.5 rounded border border-slate-200 select-all">
                      {app.clientId}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-semibold text-slate-500">Client Secret:</span>
                      <button
                        onClick={() => copyToClipboard(app.clientSecret, app.id + '_sec')}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                      >
                        {copiedKey === app.id + '_sec' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedKey === app.id + '_sec' ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-[11px] text-slate-800 bg-white p-1.5 rounded border border-slate-200 select-all">
                      {app.clientSecret}
                    </div>
                  </div>

                  {/* Whitelist Redirect URIs */}
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-2">
                      <Globe className="h-3.5 w-3.5 text-slate-400" />
                      <span>Whitelist Redirect URIs:</span>
                    </div>
                    <div className="space-y-1">
                      {app.redirectUris.map((uri, i) => (
                        <div key={i} className="font-mono text-[11px] text-slate-700 truncate bg-white px-2 py-1 rounded border border-slate-200">
                          {uri}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Create/Edit App rendered via Portal */}
        {isModalOpen && mounted && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === 'create' ? 'Daftarkan Aplikasi Klien SSO Baru' : `Edit Konfigurasi: ${selectedApp?.name}`}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Aplikasi
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="e.g. Pusat Riset Arut Utara"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Deskripsi fungsi dan tujuan aplikasi..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Allowed Redirect URIs (satu per baris)
                  </label>
                  <textarea
                    rows={3}
                    value={formRedirectUris}
                    onChange={(e) => setFormRedirectUris(e.target.value)}
                    required
                    placeholder="https://riset.aruta.id/auth/callback&#10;http://localhost:3000/auth/callback"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-mono text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    URL callback di mana kode otorisasi SSO boleh dikirimkan.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cakupan Izin (Allowed Scopes)
                  </label>
                  <input
                    type="text"
                    value={formScopes}
                    onChange={(e) => setFormScopes(e.target.value)}
                    placeholder="openid, profile, email, roles"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="appActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="appActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Aktifkan aplikasi (dapat meminta autorisasi SSO)
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {saving ? 'Menyimpan...' : modalMode === 'create' ? 'Daftarkan App' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </DashboardLayout>
  );
}
