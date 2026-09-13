'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  listAllUsers, 
  listRegisteredApps, 
  listRoles, 
  listPermissions, 
  getRecentAuditLogs 
} from '@/lib/services/firestore-service';
import { SSOAuditLog } from '@/types/sso';
import { 
  Users, 
  AppWindow, 
  Shield, 
  Key, 
  Activity, 
  ArrowUpRight, 
  Plus, 
  CheckCircle, 
  Clock, 
  Server,
  Cloud 
} from 'lucide-react';

export default function AdminPortalPage() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    usersCount: 0,
    appsCount: 0,
    rolesCount: 0,
    permsCount: 0,
  });
  const [auditLogs, setAuditLogs] = useState<SSOAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [u, a, r, p, logs] = await Promise.all([
          listAllUsers(),
          listRegisteredApps(),
          listRoles(),
          listPermissions(),
          getRecentAuditLogs(8),
        ]);

        setStats({
          usersCount: u.length,
          appsCount: a.length,
          rolesCount: r.length,
          permsCount: p.length,
        });
        setAuditLogs(logs);
      } catch (e) {
        console.error('Failed loading admin data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Portal Administrator SSO</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pusat kendali infrastruktur identitas, otorisasi, dan manajemen akun ekosistem Aruta.id
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Kelola Pengguna</span>
            </Link>
            <Link
              href="/admin/apps"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <AppWindow className="h-3.5 w-3.5" />
              <span>Daftarkan App</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/users"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
            </div>
            <div className="mt-4">
              <span className="text-xs font-medium text-slate-500">Total Pengguna</span>
              <p className="text-2xl font-bold text-slate-900">{stats.usersCount}</p>
            </div>
          </Link>

          <Link
            href="/admin/apps"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <AppWindow className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
            </div>
            <div className="mt-4">
              <span className="text-xs font-medium text-slate-500">Aplikasi Terdaftar</span>
              <p className="text-2xl font-bold text-slate-900">{stats.appsCount}</p>
            </div>
          </Link>

          <Link
            href="/admin/roles"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <Shield className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-violet-600" />
            </div>
            <div className="mt-4">
              <span className="text-xs font-medium text-slate-500">Peran Sistem</span>
              <p className="text-2xl font-bold text-slate-900">{stats.rolesCount}</p>
            </div>
          </Link>

          <Link
            href="/admin/permissions"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Key className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <div className="mt-4">
              <span className="text-xs font-medium text-slate-500">Katalog Izin</span>
              <p className="text-2xl font-bold text-slate-900">{stats.permsCount}</p>
            </div>
          </Link>
        </div>

        {/* System & Architecture Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-slate-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Status Infrastruktur</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Operational
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3">
              <span className="text-[11px] text-slate-500 font-medium">Auth Provider</span>
              <p className="font-bold text-slate-900 mt-0.5">Firebase Authentication</p>
              <p className="text-[11px] text-slate-500 mt-1">Email, Password, Password Reset</p>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3">
              <span className="text-[11px] text-slate-500 font-medium">Database Layer</span>
              <p className="font-bold text-slate-900 mt-0.5">Cloud Firestore</p>
              <p className="text-[11px] text-slate-500 mt-1">NoSQL Identity & Permissions Graph</p>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3">
              <span className="text-[11px] text-slate-500 font-medium">Edge Deployment</span>
              <p className="font-bold text-slate-900 mt-0.5">Cloudflare Wrangler</p>
              <p className="text-[11px] text-slate-500 mt-1">Edge Cache & Global SSO Routing</p>
            </div>
          </div>
        </div>

        {/* Audit Trail Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">Aktivitas SSO & Audit Trail Terkini</h2>
            </div>
            <span className="text-xs text-slate-400">Pembaruan Real-Time</span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada aktivitas tercatat.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {log.detail}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Oleh: <span className="font-medium text-slate-700">{log.userEmail}</span> &bull; Aksi:{' '}
                        <span className="font-mono text-slate-600">{log.action}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
