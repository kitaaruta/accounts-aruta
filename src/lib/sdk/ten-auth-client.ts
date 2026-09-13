/**
 * Compatibility wrapper for TEN SSO / Aruta SSO SDK.
 * Re-exports ArutaAuthClient as TenAuthClient for backwards compatibility.
 */

export * from './aruta-auth-client';
export { ArutaAuthClient as TenAuthClient } from './aruta-auth-client';
export type { ArutaAuthConfig as TenAuthConfig } from './aruta-auth-client';
export type { ArutaTokenResponse as TenTokenResponse } from './aruta-auth-client';
export type { ArutaUser as TenUser } from './aruta-auth-client';
