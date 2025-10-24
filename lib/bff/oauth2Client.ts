/**
 * OAuth2 Client for WSO2 API Gateway
 *
 * Used by BFF to obtain tokens from WSO2 when connecting to real API
 */

export interface OAuth2Token {
  access_token: string;
  scope: string;
  token_type: string;
  expires_in: number;
  obtained_at: number;
}

export interface OAuth2Config {
  tokenEndpoint: string;
  consumerKey: string;
  consumerSecret: string;
}

/**
 * Create Basic Auth header for OAuth2
 */
function createBasicAuthHeader(consumerKey: string, consumerSecret: string): string {
  const credentials = `${consumerKey}:${consumerSecret}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');
  return `Basic ${base64Credentials}`;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: OAuth2Token | null, bufferSeconds = 60): boolean {
  if (!token) return true;
  const now = Date.now();
  const expiresAt = token.obtained_at + (token.expires_in * 1000);
  return now >= (expiresAt - bufferSeconds * 1000);
}

/**
 * Obtain OAuth2 token from WSO2
 */
export async function obtainOAuth2Token(config: OAuth2Config): Promise<OAuth2Token> {
  const { tokenEndpoint, consumerKey, consumerSecret } = config;

  const authHeader = createBasicAuthHeader(consumerKey, consumerSecret);
  const body = new URLSearchParams({ grant_type: 'client_credentials' });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OAuth2 token request failed: ${response.status} ${errorText}`);
  }

  const tokenData = await response.json();

  return {
    ...tokenData,
    obtained_at: Date.now(),
  };
}

// Simple in-memory token cache
class TokenCache {
  private token: OAuth2Token | null = null;

  get(): OAuth2Token | null {
    return this.token;
  }

  set(token: OAuth2Token): void {
    this.token = token;
  }

  clear(): void {
    this.token = null;
  }

  isValid(): boolean {
    return !isTokenExpired(this.token);
  }
}

const tokenCache = new TokenCache();

/**
 * Get valid OAuth2 token (from cache or obtain new)
 */
export async function getValidToken(config: OAuth2Config): Promise<OAuth2Token> {
  if (tokenCache.isValid()) {
    const cachedToken = tokenCache.get();
    if (cachedToken) {
      return cachedToken;
    }
  }

  const token = await obtainOAuth2Token(config);
  tokenCache.set(token);
  return token;
}

export function clearTokenCache(): void {
  tokenCache.clear();
}
