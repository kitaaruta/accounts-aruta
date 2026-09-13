'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { resolveOAuthRedirect, buildAuthLink } from '@/lib/auth/oauth-flow';
import { getAppByClientId } from '@/lib/services/firestore-service';
import { RegisteredApp } from '@/types/sso';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Sparkles, AppWindow } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetApp, setTargetApp] = useState<RegisteredApp | null>(null);

  const redirectInfo = resolveOAuthRedirect(searchParams);

  useEffect(() => {
    if (redirectInfo.clientId) {
      getAppByClientId(redirectInfo.clientId)
        .then((app) => setTargetApp(app))
        .catch(() => setTargetApp(null));
    }
  }, [redirectInfo.clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Harap masukkan email dan kata sandi');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);

      // Seamlessly redirect to the consent screen or target URL
      router.push(redirectInfo.targetUrl);
    } catch (err: unknown) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Gagal masuk. Periksa kembali email dan kata sandi Anda.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setEmail('admin@aruta.id');
      setPassword('Admin@ArutaId2026!');
    } else {
      setEmail('user@aruta.id');
      setPassword('User@ArutaId2026!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Aruta Single Sign-On</h1>
          <p className="mt-1 text-xs text-slate-500">
            Satu akun untuk mengakses seluruh ekosistem aplikasi Aruta.id
          </p>
        </div>

        {/* SSO Target Application Alert Banner if during SSO */}
        {redirectInfo.isSSOFlow && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shrink-0 shadow-xs">
              <AppWindow className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {targetApp?.name || redirectInfo.clientId || 'Aplikasi Mitra'}
                </p>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-medium">SSO</span>
              </div>
              <p className="text-[11px] text-slate-600 truncate mt-0.5">
                Masuk untuk melanjutkan otorisasi akses aplikasi ini
              </p>
            </div>
          </div>
        )}

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Masuk ke Akun</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {redirectInfo.isSSOFlow
                ? 'Gunakan akun Aruta Anda untuk mengotorisasi aplikasi'
                : 'Masukkan kredensial akun SSO terpusat Anda'}
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@aruta.id"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
                <Link
                  href={buildAuthLink('/auth/forgot-password', searchParams)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Masuk SSO</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-2">
              <Sparkles className="h-3 w-3 text-blue-500" />
              <span>Login Cepat Demo:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('admin')}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
              >
                Akun Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('user')}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
              >
                Akun Member
              </button>
            </div>
          </div>
        </div>

        {/* Register footer link */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Belum memiliki akun SSO?{' '}
          <Link href={buildAuthLink('/auth/register', searchParams)} className="font-semibold text-blue-600 hover:underline">
            Daftar Akun Baru
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}
