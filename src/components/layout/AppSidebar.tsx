'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  LayoutDashboard, 
  Grid2X2, 
  Users, 
  Shield, 
  Key, 
  AppWindow, 
  Settings, 
  UserCircle, 
  Layers,
  ShieldCheck,
  ChevronRight,
  Code2,
  SlidersHorizontal
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard Admin', href: '/admin', icon: LayoutDashboard },
  { label: 'Manajemen Pengguna', href: '/admin/users', icon: Users },
  { label: 'Aplikasi Terdaftar', href: '/admin/apps', icon: AppWindow },
  { label: 'Form Profil Kustom', href: '/admin/custom-fields', icon: SlidersHorizontal },
  { label: 'Peran (Roles)', href: '/admin/roles', icon: Shield },
  { label: 'Hak Akses (Permissions)', href: '/admin/permissions', icon: Key },
  { label: 'Dokumentasi Developer', href: '/admin/docs', icon: Code2 },
  { label: 'Pengaturan SSO', href: '/admin/settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role?.toLowerCase().includes('admin');

  return (
    <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-4 flex flex-col justify-between">
      <div>
        {/* Admin Navigation */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-2">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Pusat Kendali Admin</span>
          </div>
          <nav className="flex flex-wrap md:flex-col gap-1">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="h-3 w-3 text-white/80" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Return to profile link */}
        <div className="pt-2 border-t border-slate-100">
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <UserCircle className="h-4 w-4 text-slate-400" />
            <span>Kembali ke Kartu Profil</span>
          </Link>
        </div>
      </div>

      {/* Role badge card */}
      {userProfile && (
        <div className="mt-8 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 hidden md:block">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold text-slate-700">Status Autentikasi</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Terhubung sebagai: <strong className="text-slate-800">{userProfile.role}</strong>
          </p>
          <div className="mt-2 text-[10px] text-slate-400 font-mono">
            UID: {userProfile.uid.substring(0, 14)}...
          </div>
        </div>
      )}
    </aside>
  );
}
