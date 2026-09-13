'use client';

import React, { useRef, useState } from 'react';
import { Camera, Trash2, Loader2, UploadCloud, User } from 'lucide-react';
import { compressAndCropAvatar } from '@/lib/services/storage-service';

interface AvatarUploadProps {
  currentPhotoURL?: string | null;
  displayName?: string;
  onFileSelected?: (file: File, previewUrl: string) => void;
  onPhotoRemoved?: () => void;
  size?: 'sm' | 'md' | 'lg';
  isUploading?: boolean;
  disabled?: boolean;
}

export function AvatarUpload({
  currentPhotoURL,
  displayName = 'U',
  onFileSelected,
  onPhotoRemoved,
  size = 'md',
  isUploading = false,
  disabled = false,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeImage = preview || currentPhotoURL;

  const sizeClasses = {
    sm: 'h-14 w-14 text-lg',
    md: 'h-20 w-20 text-2xl',
    lg: 'h-24 w-24 text-3xl',
  }[size];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Harap pilih file format gambar (JPG, PNG, atau WEBP).');
      return;
    }

    // Limit to 5MB pre-compression
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 5 MB.');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      const { dataUrl } = await compressAndCropAvatar(file, 360, 0.85);
      setPreview(dataUrl);
      if (onFileSelected) {
        onFileSelected(file, dataUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses gambar.';
      setError(msg);
    } finally {
      setProcessing(false);
      // Reset input value so re-selecting same file triggers change
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onPhotoRemoved) {
      onPhotoRemoved();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || processing || isUploading}
      />

      <div className="relative group">
        {/* Avatar Display */}
        <div
          onClick={() => !disabled && !processing && !isUploading && fileInputRef.current?.click()}
          className={`relative flex items-center justify-center rounded-full overflow-hidden border-2 transition-all cursor-pointer select-none ${sizeClasses} ${
            activeImage
              ? 'border-slate-200 shadow-xs bg-slate-100'
              : 'border-blue-200 bg-blue-50 text-blue-700 font-bold shadow-xs'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-blue-400 group-hover:shadow-md'}`}
          title="Klik untuk memilih foto"
        >
          {activeImage ? (
            <img
              src={activeImage}
              alt="Foto Profil"
              className="h-full w-full object-cover"
            />
          ) : displayName ? (
            <span>{displayName.charAt(0).toUpperCase()}</span>
          ) : (
            <User className="h-1/2 w-1/2 text-slate-400" />
          )}

          {/* Hover Overlay */}
          {!disabled && !processing && !isUploading && (
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-medium">
              <Camera className="h-5 w-5 mb-0.5 drop-shadow-xs" />
              <span>Ganti</span>
            </div>
          )}

          {/* Loading Overlay */}
          {(processing || isUploading) && (
            <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>

        {/* Small Camera Badge */}
        {!disabled && !processing && !isUploading && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs hover:bg-blue-700 border-2 border-white transition-transform hover:scale-110 cursor-pointer"
            title="Pilih foto profil"
          >
            <Camera className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Action Buttons & Helpers */}
      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || processing || isUploading}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer disabled:opacity-50"
        >
          <UploadCloud className="h-3 w-3" />
          <span>{activeImage ? 'Ganti Foto' : 'Unggah Foto'}</span>
        </button>

        {activeImage && (
          <>
            <span className="text-slate-300 text-xs">•</span>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || processing || isUploading}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:underline cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              <span>Hapus</span>
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="text-[10px] text-rose-600 font-medium mt-1 text-center max-w-[200px]">
          {error}
        </p>
      )}
    </div>
  );
}
