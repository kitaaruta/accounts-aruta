'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  listAllUsers, 
  saveUserProfile, 
  deleteUserProfile, 
  listRoles,
  logSSOEvent,
  isUsernameAvailable 
} from '@/lib/services/firestore-service';
import { SSOUser, SSORole } from '@/types/sso';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  X, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Filter,
  ExternalLink,
  AtSign,
  Loader2,
  Check
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<SSOUser[]>([]);
  const [roles, setRoles] = useState<SSORole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<SSOUser | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formUsernameStatus, setFormUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [formUsernameMessage, setFormUsernameMessage] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('Member');
  const [formStatus, setFormStatus] = useState<'active' | 'suspended'>('active');
  const [formCompany, setFormCompany] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formPassword, setFormPassword] = useState('');

  // Live availability check for create mode
  useEffect(() => {
    if (modalMode !== 'create' || !formUsername) {
      setFormUsernameStatus('idle');
      setFormUsernameMessage('');
      return;
    }

    const clean = formUsername.replace(/^@/, '').toLowerCase().trim();
    if (clean.length < 3) {
      setFormUsernameStatus('invalid');
      setFormUsernameMessage('Minimal 3 karakter.');
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      setFormUsernameStatus('invalid');
      setFormUsernameMessage('Hanya huruf kecil, angka, dan underscore (_).');
      return;
    }

    setFormUsernameStatus('checking');
    setFormUsernameMessage('Memeriksa ketersediaan...');

    const timer = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(clean);
        if (available) {
          setFormUsernameStatus('available');
          setFormUsernameMessage(`Username @${clean} tersedia!`);
        } else {
          setFormUsernameStatus('taken');
          setFormUsernameMessage(`Username @${clean} sudah digunakan.`);
        }
      } catch (err) {
        setFormUsernameStatus('idle');
        setFormUsernameMessage('');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formUsername, modalMode]);

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [u, r] = await Promise.all([listAllUsers(), listRoles()]);
      setUsers(u);
      setRoles(r);
    } catch (err) {
      console.error('Failed loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedUser(null);
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormRole(roles[1]?.name || 'Member');
    setFormStatus('active');
    setFormCompany('');
    setFormTitle('');
    setFormPassword('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: SSOUser) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormName(user.displayName);
    setFormUsername(user.username || '');
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormStatus(user.status === 'suspended' ? 'suspended' : 'active');
    setFormCompany(user.company || '');
    setFormTitle(user.title || '');
    setFormPassword('');
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (user: SSOUser) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun "${user.displayName}" (@${user.username || user.uid}) dari sistem SSO? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await deleteUserProfile(user.uid);
        await logSSOEvent('user_deleted', user.email, `Akun ${user.displayName} (@${user.username}) dihapus oleh admin`, user.uid);
        showNotification('success', `Pengguna ${user.displayName} berhasil dihapus.`);
        await loadData();
      } catch (err: unknown) {
        showNotification('error', 'Gagal menghapus pengguna.');
      }
    }
  };

  const handleToggleStatus = async (user: SSOUser) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const updated: SSOUser = { ...user, status: nextStatus, updatedAt: new Date().toISOString() };
    await saveUserProfile(updated);
    await logSSOEvent('user_updated', user.email, `Status akun diubah menjadi ${nextStatus}`, user.uid);
    showNotification('success', `Status ${user.displayName} diubah menjadi ${nextStatus}.`);
    await loadData();
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'create') {
        const cleanUser = formUsername.replace(/^@/, '').toLowerCase().trim();
        if (!/^[a-z0-9_]{3,20}$/.test(cleanUser)) {
          showNotification('error', 'Username harus 3-20 karakter huruf kecil, angka, atau underscore (_).');
          setSaving(false);
          return;
        }

        const available = await isUsernameAvailable(cleanUser);
        if (!available) {
          showNotification('error', `Username @${cleanUser} sudah terdaftar. Pilih username lain.`);
          setSaving(false);
          return;
        }

        if (!formPassword || formPassword.length < 6) {
          showNotification('error', 'Kata sandi awal minimal 6 karakter.');
          setSaving(false);
          return;
        }

        const newUid = 'usr_' + Math.random().toString(36).substring(2, 10);
        const newUser: SSOUser = {
          uid: newUid,
          username: cleanUser,
          email: formEmail,
          displayName: formName,
          role: formRole,
          status: formStatus,
          emailVerified: true,
          company: formCompany,
          title: formTitle,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        await saveUserProfile(newUser);
        await logSSOEvent('user_created', formEmail, `Akun baru dibuat oleh admin: ${formName} (@${cleanUser})`, newUid);
        showNotification('success', `Pengguna baru "${formName}" (@${cleanUser}) berhasil didaftarkan di SSO.`);
      } else if (selectedUser) {
        const updated: SSOUser = {
          ...selectedUser,
          displayName: formName,
          role: formRole,
          status: formStatus,
          company: formCompany,
          title: formTitle,
          updatedAt: new Date().toISOString(),
        };
        await saveUserProfile(updated);
        await logSSOEvent('user_updated', selectedUser.email, `Akun diperbarui oleh admin`, selectedUser.uid);
        showNotification('success', `Data pengguna "${formName}" berhasil diperbarui.`);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      showNotification('error', 'Gagal menyimpan data pengguna.');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.company && u.company.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchRole = selectedRole === 'all' || u.role.toLowerCase() === selectedRole.toLowerCase();
    return matchSearch && matchRole;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Manajemen Pengguna (Users)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Hanya melalui modul inilah akun SSO dibuat, diedit, dinonaktifkan, dan dihapus
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>

        {/* Notification Alert */}
        {notification && (
          <div
            className={`flex items-center gap-2.5 rounded-lg p-3 text-xs border ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, email, atau organisasi..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Semua Peran (Roles)</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Peran (Role)</th>
                  <th className="py-3 px-4">Organisasi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Terdaftar</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      Memuat daftar pengguna SSO...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      Tidak ada pengguna yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200">
                            {u.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">{u.displayName}</span>
                              <span className="text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                @{u.username || u.uid}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800 border border-slate-200">
                          <Shield className="h-3 w-3 text-slate-500" />
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {u.company || '-'}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border transition-colors ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                          <span className="capitalize">{u.status}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/profile/@${u.username || u.uid}`}
                            target="_blank"
                            className="p-1.5 rounded-md text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Buka Kartu Profil Publik"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-md text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Pengguna"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-md text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Akun"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Create / Edit User */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === 'create' ? 'Tambah Pengguna SSO Baru' : `Edit Pengguna: ${selectedUser?.displayName}`}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="Nama Lengkap"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Username (@handle unik)
                    </label>
                    <span className="text-[10px] text-amber-600 font-medium">Permanen (tidak dapat diubah)</span>
                  </div>
                  {modalMode === 'create' ? (
                    <div>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400">@</span>
                        <input
                          type="text"
                          value={formUsername}
                          onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          required
                          placeholder="contoh: budi_ten"
                          className={`w-full rounded-lg border py-2 pl-7 pr-8 text-xs text-slate-800 font-mono transition-all ${
                            formUsernameStatus === 'available'
                              ? 'border-emerald-300 bg-emerald-50/20 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                              : formUsernameStatus === 'taken'
                              ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                              : formUsernameStatus === 'invalid'
                              ? 'border-amber-300 bg-amber-50/20 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                              : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          }`}
                        />
                        <div className="absolute right-2.5 top-2.5 flex items-center">
                          {formUsernameStatus === 'checking' && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          )}
                          {formUsernameStatus === 'available' && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                          {formUsernameStatus === 'taken' && (
                            <AlertCircle className="h-4 w-4 text-rose-500" />
                          )}
                        </div>
                      </div>

                      {formUsernameStatus === 'available' && (
                        <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 mt-1">
                          <Check className="h-3 w-3 shrink-0" />
                          <span>{formUsernameMessage}</span>
                        </p>
                      )}
                      {formUsernameStatus === 'taken' && (
                        <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{formUsernameMessage}</span>
                        </p>
                      )}
                      {formUsernameStatus === 'invalid' && (
                        <p className="text-[11px] font-medium text-amber-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{formUsernameMessage}</span>
                        </p>
                      )}
                      {formUsernameStatus === 'checking' && (
                        <p className="text-[11px] font-medium text-blue-600 flex items-center gap-1 mt-1">
                          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                          <span>{formUsernameMessage}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={`@${formUsername || selectedUser?.username || 'user'}`}
                      disabled
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 px-3 text-xs text-slate-500 font-mono cursor-not-allowed"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Email (Identitas SSO)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                    disabled={modalMode === 'edit'}
                    placeholder="nama@aruta.id"
                    className={`w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      modalMode === 'edit' ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
                    }`}
                  />
                </div>

                {modalMode === 'create' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kata Sandi Awal
                    </label>
                    <input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      required
                      placeholder="Minimal 6 karakter"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Peran (Role)
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Akun
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'active' | 'suspended')}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="active">Active (Dapat Login)</option>
                      <option value="suspended">Suspended (Ditangguhkan)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Organisasi / Lembaga
                    </label>
                    <input
                      type="text"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      placeholder="e.g. Komunitas Arut Utara"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Staff"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {saving ? 'Menyimpan...' : modalMode === 'create' ? 'Buat Akun' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
