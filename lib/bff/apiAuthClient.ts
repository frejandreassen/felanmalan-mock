/**
 * API Authentication Client for FAST2 API
 *
 * Handles username/password login and token management
 * This is separate from OAuth2 which is only for API Gateway access
 */

import { getValidToken as getOAuth2Token } from './oauth2Client';

export interface ApiToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  obtained_at: number;
}

export interface ApiAuthConfig {
  fast2BaseUrl: string;
  oauth2TokenEndpoint: string;
  consumerKey: string;
  consumerSecret: string;
  username: string;
  password: string;
}

/**
 * Check if API token is expired
 */
export function isApiTokenExpired(token: ApiToken | null, bufferSeconds = 0): boolean {
  if (!token) return true;
  const now = Date.now();
  const expiresAt = token.obtained_at + (token.expires_in * 1000);
  return now >= (expiresAt - bufferSeconds * 1000);
}

/**
 * Login to FAST2 API with username/password
 * Requires OAuth2 token for API Gateway access
 */
export async function loginToApi(config: ApiAuthConfig): Promise<ApiToken> {
  const { fast2BaseUrl, oauth2TokenEndpoint, consumerKey, consumerSecret, username, password } = config;

  // Step 1: Get OAuth2 token for API Gateway
  const oauth2Token = await getOAuth2Token({
    tokenEndpoint: oauth2TokenEndpoint,
    consumerKey,
    consumerSecret,
  });

  // Step 2: Login with username/password using OAuth2 token
  const loginUrl = `${fast2BaseUrl}/ao-produkt/v1/auth/login`;

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${oauth2Token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API login failed: ${response.status} ${errorText}`);
  }

  const tokenData = await response.json();

  return {
    ...tokenData,
    obtained_at: Date.now(),
  };
}

/**
 * Refresh API token using refresh_token
 */
export async function refreshApiToken(
  refreshToken: string,
  config: Pick<ApiAuthConfig, 'fast2BaseUrl' | 'oauth2TokenEndpoint' | 'consumerKey' | 'consumerSecret'>
): Promise<ApiToken> {
  const { fast2BaseUrl, oauth2TokenEndpoint, consumerKey, consumerSecret } = config;

  // Step 1: Get OAuth2 token for API Gateway
  const oauth2Token = await getOAuth2Token({
    tokenEndpoint: oauth2TokenEndpoint,
    consumerKey,
    consumerSecret,
  });

  // Step 2: Refresh using refresh_token
  const refreshUrl = `${fast2BaseUrl}/ao-produkt/v1/auth/refresh`;

  const response = await fetch(refreshUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${oauth2Token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API token refresh failed: ${response.status} ${errorText}`);
  }

  const tokenData = await response.json();

  return {
    ...tokenData,
    obtained_at: Date.now(),
  };
}

// Simple in-memory token cache
class ApiTokenCache {
  private token: ApiToken | null = null;

  get(): ApiToken | null {
    return this.token;
  }

  set(token: ApiToken): void {
    this.token = token;
  }

  clear(): void {
    this.token = null;
  }

  isValid(): boolean {
    return !isApiTokenExpired(this.token);
  }
}

const apiTokenCache = new ApiTokenCache();

/**
 * Get valid API token (from cache or login)
 * Automatically re-logins when token expires
 */
export async function getValidApiToken(config: ApiAuthConfig): Promise<ApiToken> {
  // Check if cached token is still valid
  if (apiTokenCache.isValid()) {
    const cachedToken = apiTokenCache.get();
    if (cachedToken) {
      console.log('[Auth] Using cached API token');
      return cachedToken;
    }
  }

  // Token expired or not found, login again
  console.log('[Auth] Token expired, logging in again...');
  try {
    const token = await loginToApi(config);
    apiTokenCache.set(token);
    console.log('[Auth] Successfully logged in, token expires in', token.expires_in, 'seconds');
    return token;
  } catch (error) {
    console.error('[Auth] Login failed:', error);
    throw error;
  }
}

export function clearApiTokenCache(): void {
  apiTokenCache.clear();
}
