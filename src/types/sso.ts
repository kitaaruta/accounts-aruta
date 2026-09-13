export interface AppCustomField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'tel' | 'number';
  placeholder?: string;
  description?: string;
  options?: string[];
  required?: boolean;
}

export interface SSOUser {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  roleId?: string;
  status: 'active' | 'suspended' | 'pending';
  emailVerified: boolean;
  phoneNumber?: string;
  company?: string;
  title?: string;
  customFields?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface SSORole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SSOPermission {
  id: string;
  key: string;
  name: string;
  category: 'users' | 'roles' | 'apps' | 'sso' | 'settings' | 'audit';
  description: string;
}

export interface RegisteredApp {
  id: string;
  name: string;
  description: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  logoUrl?: string;
  isActive: boolean;
  allowedScopes: string[];
  requiredCustomFields?: string[]; // Keys of custom fields requested by this app
  createdAt: string;
  updatedAt?: string;
}

export interface AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string;
  expiresAt: number;
  used: boolean;
}

export interface SSOSettings {
  appName: string;
  companyName: string;
  supportEmail: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  sessionTimeoutHours: number;
  defaultRoleId: string;
  allowedRedirectDomains: string[];
  updatedAt: string;
}

export interface SSOAuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: 'login' | 'logout' | 'register' | 'password_reset' | 'app_authorized' | 'user_created' | 'user_updated' | 'user_deleted' | 'role_assigned';
  detail: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}
