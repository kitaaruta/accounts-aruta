'use client';

import React from 'react';
import Link from 'next/link';
import { DocsContent } from '@/components/docs/DocsContent';
import { ShieldCheck, ArrowLeft, UserCircle } from 'lucide-react';

export default function PublicDocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-transform group-hover:scale-105">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">Aruta SSO</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                  Developer Docs
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Single Source of Truth Identity</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <UserCircle className="h-4 w-4 text-slate-500" />
              <span>Profil Akun</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <DocsContent inAdmin={false} />
      </main>
    </div>
  );
}
