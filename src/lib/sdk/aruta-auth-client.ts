/**
 * Aruta SSO Official Client SDK
 * Universal TypeScript/JavaScript client library for connecting applications to Aruta Single Sign-On (SSO).
 * Compatible with Node.js 18+, Next.js, Express, React, Vue, Bun, and Deno.
 */

export interface ArutaAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  baseUrl?: string;
  scopes?: string[];
}

export interface ArutaTokenResponse {
  accessToken: string;
  idToken?: string;
  tokenType: string;
  expiresIn: number;
  scope?: string;
}

export interface ArutaUser {
  sub: string;
  name: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  role?: string;
  avatar?: string;
  phone?: string;
  organization?: string;
  [key: string]: any;
}

export class ArutaAuthClient {
  private clientId: string;
  private clientSecret?: string;
  private redirectUri: string;
  private baseUrl: string;
  private scopes: string[];

  constructor(config: ArutaAuthConfig) {
    if (!config.clientId) throw new Error('[ArutaAuthClient] clientId is required.');
    if (!config.redirectUri) throw new Error('[ArutaAuthClient] redirectUri is required.');

    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.baseUrl = (config.baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://accounts.aruta.id')).replace(/\/$/, '');
    this.scopes = config.scopes || ['openid', 'profile', 'email'];
  }

  /**
   * Generates the OAuth 2.0 / OIDC authorization URL to redirect the user to login.
   */
  public getLoginUrl(options?: { state?: string; scope?: string[] }): string {
    const scope = options?.scope ? options.scope.join(' ') : this.scopes.join(' ');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope,
    });

    if (options?.state) {
      params.append('state', options.state);
    }

    return `${this.baseUrl}/api/oauth/authorize?${params.toString()}`;
  }

  /**
   * Opens a centered popup window to authenticate the user without navigating away.
   */
  public loginWithPopup(options?: {
    width?: number;
    height?: number;
    state?: string;
    scope?: string[];
  }): Promise<{ code: string; state?: string; user?: ArutaUser; token?: ArutaTokenResponse }> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        return reject(new Error('[ArutaAuthClient] loginWithPopup can only be called in browser environments.'));
      }

      const width = options?.width || 520;
      const height = options?.height || 680;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authUrl = new URL(this.getLoginUrl({ state: options?.state, scope: options?.scope }));
      authUrl.searchParams.set('display', 'popup');

      const popup = window.open(
        authUrl.toString(),
        'ARUTA_SSO_LOGIN',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        return reject(new Error('[ArutaAuthClient] Failed to open popup. Please check your browser popup blocker settings.'));
      }

      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          window.removeEventListener('message', messageListener);
          reject(new Error('[ArutaAuthClient] Popup login was closed by user.'));
        }
      }, 500);

      const messageListener = async (event: MessageEvent) => {
        if (event.data?.type === 'ARUTA_SSO_AUTH_SUCCESS' || event.data?.type === 'TEN_SSO_AUTH_SUCCESS') {
          clearInterval(timer);
          window.removeEventListener('message', messageListener);
          const code = event.data.code;
          const returnedState = event.data.state;

          if (this.clientSecret) {
            try {
              const { token, user } = await this.handleCallback(code);
              return resolve({ code, state: returnedState, user, token });
            } catch {
              return resolve({ code, state: returnedState });
            }
          }

          return resolve({ code, state: returnedState });
        }

        if (event.data?.type === 'ARUTA_SSO_AUTH_ERROR' || event.data?.type === 'TEN_SSO_AUTH_ERROR') {
          clearInterval(timer);
          window.removeEventListener('message', messageListener);
          return reject(new Error(event.data.error_description || event.data.error || 'Authentication denied.'));
        }
      };

      window.addEventListener('message', messageListener);
    });
  }

  /**
   * Exchanges an authorization code for access token and ID token.
   */
  public async exchangeCode(code: string): Promise<ArutaTokenResponse> {
    if (!code) throw new Error('[ArutaAuthClient] Authorization code is required.');

    const payload: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
    };

    if (this.clientSecret) {
      payload.client_secret = this.clientSecret;
    }

    const response = await fetch(`${this.baseUrl}/api/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || data.error || 'Failed to exchange authorization code.');
    }

    return {
      accessToken: data.access_token,
      idToken: data.id_token,
      tokenType: data.token_type || 'Bearer',
      expiresIn: data.expires_in || 3600,
      scope: data.scope,
    };
  }

  /**
   * Retrieves the authenticated user's profile using their Bearer access token.
   */
  public async getUserInfo(accessToken: string): Promise<ArutaUser> {
    if (!accessToken) throw new Error('[ArutaAuthClient] Access token is required.');

    const response = await fetch(`${this.baseUrl}/api/oauth/userinfo`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || data.error || 'Failed to fetch userinfo.');
    }

    return {
      sub: data.sub,
      name: data.name,
      username: data.username || data.sub,
      email: data.email,
      emailVerified: data.email_verified,
      role: data.role,
      avatar: data.avatar || data.picture,
      phone: data.phone,
      organization: data.organization,
    };
  }

  /**
   * Convenient 1-step handler for OAuth callback: exchanges code and retrieves user profile immediately.
   */
  public async handleCallback(code: string): Promise<{ token: ArutaTokenResponse; user: ArutaUser }> {
    const token = await this.exchangeCode(code);
    const user = await this.getUserInfo(token.accessToken);
    return { token, user };
  }

  /**
   * Revokes an active token (RFC 7009).
   */
  public async revokeToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/oauth/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetches the OpenID Connect discovery metadata document.
   */
  public async getOpenIdConfiguration(): Promise<Record<string, any>> {
    const res = await fetch(`${this.baseUrl}/.well-known/openid-configuration`);
    return await res.json();
  }
}
