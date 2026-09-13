/**
 * OAuth Flow Helpers
 * Preserves SSO flow across login, registration, password recovery, and account switching.
 */

export interface OAuthRedirectInfo {
  targetUrl: string;
  clientId: string | null;
  isSSOFlow: boolean;
}

/**
 * Extracts and safely resolves the target redirect URL and client ID from search parameters.
 */
export function resolveOAuthRedirect(searchParams: { get: (key: string) => string | null; toString: () => string }): OAuthRedirectInfo {
  const redirectParam = searchParams.get('redirect') || searchParams.get('return_url') || searchParams.get('redirect_to');
  const directClientId = searchParams.get('client_id');
  const directRedirectUri = searchParams.get('redirect_uri');

  // Case 1: An explicit internal relative return path is provided (e.g. from /oauth/consent)
  if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
    let extractedClientId: string | null = null;
    try {
      const parsed = new URL(redirectParam, 'http://localhost');
      extractedClientId = parsed.searchParams.get('client_id');
    } catch {
      // Ignored
    }

    return {
      targetUrl: redirectParam,
      clientId: extractedClientId || directClientId,
      isSSOFlow: !!(extractedClientId || directClientId),
    };
  }

  // Case 2: Direct OAuth parameters are provided on the URL (client_id + redirect_uri)
  if (directClientId && directRedirectUri) {
    const consentUrl = `/oauth/consent?${searchParams.toString()}`;
    return {
      targetUrl: consentUrl,
      clientId: directClientId,
      isSSOFlow: true,
    };
  }

  // Fallback: Default standard destination
  return {
    targetUrl: '/profile',
    clientId: null,
    isSSOFlow: false,
  };
}

/**
 * Preserves current search parameters when linking between auth pages (e.g. login <-> register).
 */
export function buildAuthLink(basePath: string, searchParams: { toString: () => string }): string {
  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}
