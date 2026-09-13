'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  getSSOSettings, 
  saveSSOSettings, 
  listRoles,
  logSSOEvent 
} from '@/lib/services/firestore-service';
import { SSOSettings, SSORole } from '@/types/sso';
import { 
  Settings, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Globe, 
  Mail, 
  Building, 
  Clock 
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SSOSettings | null>(null);
  const [roles, setRoles] = useState<SSORole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [appName, setAppName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState(72);
  const [defaultRoleId, setDefaultRoleId] = useState('role-member');
  const [allowedDomains, setAllowedDomains] = useState('aruta.id\nlocalhost');

  useEffect(() => {
    async function load() {
      try {
        const [s, r] = await Promise.all([getSSOSettings(), listRoles()]);
        setSettings(s);
        setRoles(r);

        setAppName(s.appName);
        setCompanyName(s.companyName);
        setSupportEmail(s.supportEmail);
        setAllowRegistration(s.allowRegistration);
        setRequireEmailVerification(s.requireEmailVerification);
        setSessionTimeoutHours(s.sessionTimeoutHours);
        setDefaultRoleId(s.defaultRoleId);
        setAllowedDomains(s.allowedRedirectDomains.join('\n'));
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const domains = allowedDomains.split('\n').map(d => d.trim()).filter(Boolean);
      const updated: SSOSettings = {
        appName,
        companyName,
        supportEmail,
        allowRegistration,
        requireEmailVerification,
        sessionTimeoutHours: Number(sessionTimeoutHours),
        defaultRoleId,
        allowedRedirectDomains: domains,
        updatedAt: new Date().toISOString(),
      };
      await saveSSOSettings(updated);
      await logSSOEvent('app_authorized', 'admin@aruta.id', 'Konfigurasi SSO diperbarui', 'admin');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Pengaturan Infrastruktur SSO</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi kebijakan autentikasi global, durasi sesi, dan parameter ekosistem Aruta.id
          </p>
        </div>

        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Pengaturan infrastruktur SSO berhasil disimpan ke Cloud Firestore.</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Branding & Identity */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Building className="h-4 w-4 text-slate-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Identitas & Branding SSO</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Layanan SSO
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  required
                  placeholder="Aruta Single Sign-On"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Organisasi / Entitas
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="Aruta.id"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Kontak Dukungan
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  required
                  placeholder="admin@aruta.id"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Registration & Access Policies */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Kebijakan Akun & Sesi</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <input
                  type="checkbox"
                  id="allowReg"
                  checked={allowRegistration}
                  onChange={(e) => setAllowRegistration(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="allowReg" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Izinkan Pendaftaran Akun Mandiri (Public Registration)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Jika dinonaktifkan, akun baru hanya dapat dibuat oleh Administrator melalui menu Pengguna.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Peran Default Akun Baru
                  </label>
                  <select
                    value={defaultRoleId}
                    onChange={(e) => setDefaultRoleId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Masa Berlaku Sesi Login (Jam)
                  </label>
                  <input
                    type="number"
                    value={sessionTimeoutHours}
                    onChange={(e) => setSessionTimeoutHours(Number(e.target.value))}
                    min={1}
                    max={720}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security & Redirect Domains Whitelist */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-slate-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Domain Whitelist Otorisasi SSO</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Domain yang Diizinkan (satu per baris)
              </label>
              <textarea
                rows={3}
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-mono text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Aplikasi luar hanya boleh melakukan redirect otorisasi jika domain mereka terdaftar dalam whitelist ini.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Menyimpan Pengaturan...' : 'Simpan Semua Pengaturan'}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
