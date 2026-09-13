'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { ArutaAuthClient, ArutaUser, ArutaTokenResponse } from '@/lib/sdk/aruta-auth-client';

export interface ArutaAuthResult {
  code: string;
  state?: string;
  user?: ArutaUser;
  token?: ArutaTokenResponse;
}

export interface ArutaLoginButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  mode?: 'redirect' | 'popup';
  client?: ArutaAuthClient;
  onAuthSuccess?: (result: ArutaAuthResult) => void;
  onAuthError?: (error: Error) => void;
}

export function ArutaBrandIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="6" fill="currentColor" fillOpacity="0.15" />
      {/* Modern stylized 'A' for Aruta */}
      <path
        d="M6 18L12 6L18 18M8.5 13.5H15.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default function ArutaLoginButton({
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  label = 'Masuk dengan Akun Aruta',
  loading = false,
  disabled = false,
  className = '',
  mode = 'redirect',
  client,
  onAuthSuccess,
  onAuthError,
}: ArutaLoginButtonProps) {
  const [popupActive, setPopupActive] = useState(false);

  const handlePopupClick = async () => {
    if (disabled || loading || popupActive) return;

    if (onClick) {
      onClick();
      return;
    }

    setPopupActive(true);

    if (client) {
      try {
        const result = await client.loginWithPopup();
        setPopupActive(false);
        if (onAuthSuccess) onAuthSuccess(result);
      } catch (err: any) {
        setPopupActive(false);
        if (onAuthError) onAuthError(err);
      }
      return;
    }

    if (href && typeof window !== 'undefined') {
      const width = 520;
      const height = 680;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popupUrl = new URL(href, window.location.origin);
      popupUrl.searchParams.set('display', 'popup');

      const popup = window.open(
        popupUrl.toString(),
        'ARUTA_SSO_POPUP',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        setPopupActive(false);
        if (onAuthError) {
          onAuthError(new Error('Browser memblokir jendela popup. Izinkan popup untuk login.'));
        }
        return;
      }

      const checkClosedTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosedTimer);
          window.removeEventListener('message', messageListener);
          setPopupActive(false);
        }
      }, 500);

      const messageListener = (event: MessageEvent) => {
        if (event.data?.type === 'ARUTA_SSO_AUTH_SUCCESS' || event.data?.type === 'TEN_SSO_AUTH_SUCCESS') {
          clearInterval(checkClosedTimer);
          window.removeEventListener('message', messageListener);
          setPopupActive(false);
          if (onAuthSuccess) {
            onAuthSuccess({
              code: event.data.code,
              state: event.data.state,
            });
          }
        }

        if (event.data?.type === 'ARUTA_SSO_AUTH_ERROR' || event.data?.type === 'TEN_SSO_AUTH_ERROR') {
          clearInterval(checkClosedTimer);
          window.removeEventListener('message', messageListener);
          setPopupActive(false);
          if (onAuthError) {
            onAuthError(new Error(event.data.error_description || 'Otorisasi SSO dibatalkan'));
          }
        }
      };

      window.addEventListener('message', messageListener);
    }
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 shadow-xs focus:ring-blue-500',
    dark: 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-xs focus:ring-slate-700',
    light: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-xs focus:ring-slate-300',
  }[variant];

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-2 rounded-lg',
    md: 'px-4 py-2.5 text-xs sm:text-sm font-medium gap-2.5 rounded-xl',
    lg: 'px-5 py-3 text-sm font-semibold gap-3 rounded-xl',
  }[size];

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size];

  const isSpinning = loading || popupActive;

  const content = (
    <>
      {isSpinning ? (
        <Loader2 className={`${iconSizes} animate-spin shrink-0`} />
      ) : (
        <ArutaBrandIcon className={`${iconSizes} shrink-0`} />
      )}
      <span>
        {popupActive ? 'Menunggu Popup SSO...' : loading ? 'Menghubungkan...' : label}
      </span>
    </>
  );

  const baseClasses = `inline-flex items-center justify-center font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variantClasses} ${sizeClasses} ${className}`;

  if (mode === 'popup') {
    return (
      <button
        type="button"
        onClick={handlePopupClick}
        disabled={disabled || isSpinning}
        className={baseClasses}
      >
        {content}
      </button>
    );
  }

  if (href && !disabled) {
    return (
      <a href={href} className={baseClasses}>
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isSpinning}
      className={baseClasses}
    >
      {content}
    </button>
  );
}
