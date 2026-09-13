'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { buildAuthLink } from '@/lib/auth/oauth-flow';
import { ShieldCheck, Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Harap masukkan alamat email Anda.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      console.error('Forgot password error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengirim instruksi pemulihan.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pemulihan Kata Sandi</h1>
          <p className="mt-1 text-xs text-slate-500">
            Kirimkan tautan reset kata sandi akun SSO Aruta Anda
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          {submitted ? (
            <div className="text-center py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Email Pemulihan Terkirim</h2>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Jika alamat <strong className="text-slate-800">{email}</strong> terdaftar di sistem SSO, Anda akan menerima tautan reset kata sandi dalam beberapa saat.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  href={buildAuthLink('/auth/login', searchParams)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Kembali ke Halaman Masuk</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Lupa Kata Sandi?</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Masukkan email yang terhubung dengan akun Anda, kami akan mengirim instruksi untuk mereset kata sandi.
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
                    Alamat Email Terdaftar
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>Kirim Tautan Reset</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <Link
                  href={buildAuthLink('/auth/login', searchParams)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Batal dan kembali ke Masuk</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Memuat...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
