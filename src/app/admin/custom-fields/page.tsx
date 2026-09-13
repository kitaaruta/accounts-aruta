'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  getMasterCustomFields, 
  saveMasterCustomField, 
  deleteMasterCustomField,
  logSSOEvent 
} from '@/lib/services/firestore-service';
import { AppCustomField } from '@/types/sso';
import { 
  SlidersHorizontal, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ListOrdered, 
  Phone, 
  Type, 
  Hash, 
  X, 
  Save, 
  ExternalLink,
  ShieldAlert,
  Info,
  AppWindow
} from 'lucide-react';

export default function CustomFieldsAdminPage() {
  const [fields, setFields] = useState<AppCustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirmField, setDeleteConfirmField] = useState<AppCustomField | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form input state
  const [fieldId, setFieldId] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'select' | 'tel' | 'number'>('text');
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldDescription, setFieldDescription] = useState('');
  const [fieldOptionsText, setFieldOptionsText] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [isSystemField, setIsSystemField] = useState(false);

  const loadFields = async () => {
    try {
      setLoading(true);
      const data = await getMasterCustomFields();
      setFields(data);
    } catch (err) {
      console.error('Error loading custom fields:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setFieldId('');
    setFieldKey('');
    setFieldLabel('');
    setFieldType('text');
    setFieldPlaceholder('');
    setFieldDescription('');
    setFieldOptionsText('');
    setFieldRequired(false);
    setIsSystemField(false);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (field: AppCustomField) => {
    setIsEditing(true);
    setFieldId(field.id || `cf_${field.key}`);
    setFieldKey(field.key);
    setFieldLabel(field.label);
    setFieldType(field.type || 'text');
    setFieldPlaceholder(field.placeholder || '');
    setFieldDescription(field.description || '');
    setFieldOptionsText((field.options || []).join('\n'));
    setFieldRequired(!!field.required);
    setIsSystemField(!!field.isSystemField);
    setError(null);
    setModalOpen(true);
  };

  const handleLabelChange = (newLabel: string) => {
    setFieldLabel(newLabel);
    if (!isEditing && !fieldKey) {
      // Auto-generate key from label
      const slug = newLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      setFieldKey(slug);
    }
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldLabel.trim()) {
      setError('Label formulir wajib diisi.');
      return;
    }

    const cleanKey = fieldKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanKey) {
      setError('Kunci unik field (Key) wajib diisi (hanya huruf kecil, angka, dan garis bawah).');
      return;
    }

    // Check duplicate key if creating new
    if (!isEditing && fields.some(f => f.key.toLowerCase() === cleanKey)) {
      setError(`Kunci field "${cleanKey}" sudah digunakan. Harap gunakan kunci lain.`);
      return;
    }

    let parsedOptions: string[] | undefined = undefined;
    if (fieldType === 'select') {
      parsedOptions = fieldOptionsText
        .split('\n')
        .map(opt => opt.trim())
        .filter(Boolean);
      
      if (parsedOptions.length === 0) {
        // also check comma-separated
        parsedOptions = fieldOptionsText
          .split(',')
          .map(opt => opt.trim())
          .filter(Boolean);
      }

      if (parsedOptions.length === 0) {
        setError('Pilihan dropdown (select) minimal harus memiliki 1 opsi.');
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      const payload: AppCustomField = {
        id: fieldId || `cf_${cleanKey}`,
        key: cleanKey,
        label: fieldLabel.trim(),
        type: fieldType,
        placeholder: fieldPlaceholder.trim() || undefined,
        description: fieldDescription.trim() || undefined,
        options: parsedOptions,
        required: fieldRequired,
        isSystemField: isSystemField,
      };

      await saveMasterCustomField(payload);
      await logSSOEvent('app_authorized', 'admin@aruta.id', `Custom field ${isEditing ? 'diperbarui' : 'dibuat'}: ${payload.label} (${payload.key})`, 'admin');

      setSuccessMessage(`Field "${payload.label}" berhasil disimpan!`);
      setTimeout(() => setSuccessMessage(null), 3500);

      setModalOpen(false);
      await loadFields();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan field kustom.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async () => {
    if (!deleteConfirmField) return;
    try {
      setDeleting(true);
      await deleteMasterCustomField(deleteConfirmField.key);
      await logSSOEvent('app_revoked', 'admin@aruta.id', `Custom field dihapus: ${deleteConfirmField.label} (${deleteConfirmField.key})`, 'admin');
      
      setSuccessMessage(`Field "${deleteConfirmField.label}" berhasil dihapus.`);
      setTimeout(() => setSuccessMessage(null), 3500);

      setDeleteConfirmField(null);
      await loadFields();
    } catch (err) {
      console.error('Failed to delete field:', err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredFields = fields.filter(
    (f) =>
      f.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const systemFieldsCount = fields.filter(f => f.isSystemField).length;
  const customFieldsCount = fields.filter(f => !f.isSystemField).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Katalog Form Profil Kustom</h1>
                <p className="text-xs text-slate-500">
                  Kelola daftar kolom data tambahan yang dapat dipilih oleh aplikasi klien saat pendaftaran pengguna
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/apps"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <AppWindow className="h-3.5 w-3.5 text-slate-500" />
              <span>Kembali ke Aplikasi</span>
            </Link>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Field Kustom</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Info Banner: Standard Fields vs Custom Fields */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4.5 text-xs text-slate-700">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0 mt-0.5 shadow-xs">
              <Info className="h-4 w-4" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900">Bagaimana Form Dinamis SSO Bekerja?</h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Akun SSO Aruta memiliki <strong>Form Standar Umum</strong> yang selalu aktif dan wajib untuk setiap akun: 
                <span className="font-medium text-blue-900"> Nama Lengkap, Username (@username), Email, Kata Sandi, dan Foto Profil</span>.
              </p>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Katalog di bawah ini adalah <strong>Form Profil Tambahan</strong>. Setiap aplikasi klien yang Anda daftarkan di menu 
                <Link href="/admin/apps" className="font-semibold text-blue-700 hover:underline mx-1">Aplikasi Terdaftar</Link> 
                dapat memilih field mana saja yang wajib atau dibutuhkan oleh aplikasi mereka (misal Kamus Bahasa membutuhkan <em>Sub-Dialek</em>, Komunitas membutuhkan <em>Asal Desa</em>).
              </p>
            </div>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Form Tambahan</span>
              <Layers className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{fields.length}</p>
            <span className="text-[10px] text-slate-400">Siap digunakan di seluruh aplikasi</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Form Bawaan / Standar</span>
              <Lock className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-600">{systemFieldsCount}</p>
            <span className="text-[10px] text-slate-400">Katalog dasar ekosistem Aruta</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Form Kustom Tambahan</span>
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-purple-600">{customFieldsCount}</p>
            <span className="text-[10px] text-slate-400">Dibuat khusus oleh administrator</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama field, kunci (key), atau deskripsi..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Menampilkan <strong>{filteredFields.length}</strong> dari {fields.length} field
          </span>
        </div>

        {/* Fields Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
              <span>Memuat katalog field profil...</span>
            </div>
          ) : filteredFields.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <SlidersHorizontal className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">Tidak ada field yang cocok</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian Anda atau buat field baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Field / Label</th>
                    <th className="py-3 px-4">Kunci Data (Key)</th>
                    <th className="py-3 px-4">Tipe Input</th>
                    <th className="py-3 px-4">Deskripsi / Opsi</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFields.map((field) => {
                    const isSystem = !!field.isSystemField;
                    return (
                      <tr key={field.key} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{field.label}</span>
                            {field.required && (
                              <span className="text-[10px] bg-rose-50 text-rose-600 font-medium px-1.5 py-0.2 rounded border border-rose-100">
                                Wajib
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-purple-700 font-medium">
                          <code>{field.key}</code>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
                            {field.type === 'text' && <Type className="h-3 w-3 text-blue-500" />}
                            {field.type === 'select' && <ListOrdered className="h-3 w-3 text-emerald-500" />}
                            {field.type === 'tel' && <Phone className="h-3 w-3 text-amber-500" />}
                            {field.type === 'number' && <Hash className="h-3 w-3 text-indigo-500" />}
                            <span className="capitalize">
                              {field.type === 'text' && 'Teks Bebas'}
                              {field.type === 'select' && 'Pilihan Dropdown'}
                              {field.type === 'tel' && 'Telepon / WhatsApp'}
                              {field.type === 'number' && 'Angka / Nomor'}
                            </span>
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          {field.description && (
                            <p className="text-[11px] text-slate-600 line-clamp-1">{field.description}</p>
                          )}
                          {field.type === 'select' && field.options && field.options.length > 0 && (
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                              Opsi: {field.options.slice(0, 3).join(', ')}
                              {field.options.length > 3 && ` (+${field.options.length - 3} lainnya)`}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {isSystem ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                              <Lock className="h-2.5 w-2.5" />
                              <span>Bawaan Sistem</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-100">
                              <Sparkles className="h-2.5 w-2.5" />
                              <span>Kustom</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(field)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Edit Field"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            {!isSystem ? (
                              <button
                                onClick={() => setDeleteConfirmField(field)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Hapus Field Kustom"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : (
                              <span
                                className="p-1.5 text-slate-300 cursor-not-allowed"
                                title="Field bawaan sistem tidak dapat dihapus"
                              >
                                <Lock className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Tambah / Edit Field */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isEditing ? 'Edit Field Formulir' : 'Tambah Field Formulir Kustom'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Field ini akan dapat dicentang sebagai syarat registrasi pada setiap aplikasi klien.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSaveField} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Label Formulir (Nama Tampilan) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fieldLabel}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    placeholder="Contoh: Nomor Induk Anggota, Wilayah Adat..."
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Kunci Unik (Key API / Firestore) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Hanya huruf kecil, angka, underscore</span>
                  </div>
                  <input
                    type="text"
                    value={fieldKey}
                    onChange={(e) => setFieldKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    placeholder="e.g. member_id, village_origin"
                    required
                    disabled={isEditing && isSystemField}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:bg-slate-100 disabled:text-slate-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipe Masukan (Input Type)
                  </label>
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value as 'text' | 'select' | 'tel' | 'number')}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  >
                    <option value="text">Teks Bebas (text input)</option>
                    <option value="select">Pilihan Dropdown (select menu)</option>
                    <option value="tel">Nomor Telepon / WhatsApp (tel input)</option>
                    <option value="number">Angka / Numerik (number input)</option>
                  </select>
                </div>

                {fieldType === 'select' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Opsi Dropdown Pilihan <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">1 baris untuk setiap opsi</span>
                    </div>
                    <textarea
                      rows={4}
                      value={fieldOptionsText}
                      onChange={(e) => setFieldOptionsText(e.target.value)}
                      placeholder={'Opsi Pertama\nOpsi Kedua\nOpsi Ketiga\nLainnya...'}
                      required
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Placeholder Masukan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={fieldPlaceholder}
                    onChange={(e) => setFieldPlaceholder(e.target.value)}
                    placeholder="Contoh: Masukkan nomor identitas..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Keterangan Bantuan / Deskripsi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={fieldDescription}
                    onChange={(e) => setFieldDescription(e.target.value)}
                    placeholder="Contoh: Digunakan untuk verifikasi keanggotaan riset"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="fieldRequired"
                    checked={fieldRequired}
                    onChange={(e) => setFieldRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="fieldRequired" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Tandai sebagai field wajib (wajib diisi pengguna jika aplikasi memilih field ini)
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{saving ? 'Menyimpan...' : 'Simpan Field'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus */}
        {deleteConfirmField && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-3 border border-rose-100">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Hapus Field Kustom?</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus field <strong>{deleteConfirmField.label}</strong> (<code>{deleteConfirmField.key}</code>)?
                Field ini tidak akan lagi muncul sebagai opsi pilihan di aplikasi klien baru.
              </p>

              <div className="mt-6 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmField(null)}
                  disabled={deleting}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteField}
                  disabled={deleting}
                  className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
