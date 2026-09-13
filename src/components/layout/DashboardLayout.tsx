'use client';

import React from 'react';
import { AppNavbar } from './AppNavbar';
import { AppSidebar } from './AppSidebar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppNavbar />
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <AppSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Aruta.id SSO Infrastructure. All rights reserved.</span>
          <span className="font-mono text-[11px] text-slate-400">Next.js &bull; Cloudflare Wrangler &bull; Firebase Auth & Firestore</span>
        </div>
      </footer>
    </div>
  );
}
