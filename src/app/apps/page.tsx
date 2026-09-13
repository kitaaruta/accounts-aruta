'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { listRegisteredApps } from '@/lib/services/firestore-service';
import { RegisteredApp } from '@/types/sso';
import { 
  AppWindow, 
  ExternalLink, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles,
  Layers
} from 'lucide-react';

export default function AppsCatalogPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const [apps, setApps] = useState<RegisteredApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApps() {
      try {
        const data = await listRegisteredApps();
        // Hanya tampilkan aplikasi yang aktif
        setApps(data.filter((a) => a.isActive));
      } catch (err) {
        console.error('Error loading apps:', err);
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, []);

  const handleLaunchApp = (app: RegisteredApp) => {
    // Jalankan alur otorisasi SSO ke callback URL aplikasi
    const redirectUrl = app.redirectUris[0] || 'http://localhost:3000/apps';
    const ssoUrl = `/api/oauth/authorize?client_id=${encodeURIComponent(app.clientId)}&redirect_uri=${encodeURIComponent(redirectUrl)}&state=catalog_launcher&response_type=code`;
    window.open(ssoUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Kartu Profil</span>
          </Link>

          {userProfile && (
            <span className="text-xs text-slate-500 font-medium">
              Akun: <strong className="text-slate-800">{userProfile.displayName}</strong>
            </span>
          )}
        </div>

        {/* Clean Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Katalog Aplikasi Ekosistem</h1>
              <p className="text-xs text-slate-500">
                Aplikasi yang terhubung dan dapat Anda akses langsung menggunakan akun SSO Aruta
              </p>
            </div>
          </div>
        </div>

        {/* Apps List Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl border border-slate-200 bg-white animate-pulse p-5" />
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <AppWindow className="mx-auto h-10 w-10 text-slate-400 mb-3" />
            <h2 className="text-sm font-bold text-slate-800">Belum Ada Aplikasi Tersedia</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Saat ini belum ada aplikasi ekosistem yang terhubung dengan akun Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map((app) => (
              <div
                key={app.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <AppWindow className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                      <CheckCircle2 className="h-3 w-3" />
                      Akses Tersedia
                    </span>
                  </div>

                  <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {app.name}
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {app.description || 'Layanan terintegrasi ekosistem Aruta.id'}
                  </p>
                </div>

                <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">
                    SSO Ready
                  </span>
                  <button
                    onClick={() => handleLaunchApp(app)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Buka Aplikasi</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
