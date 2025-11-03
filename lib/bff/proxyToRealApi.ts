/**
 * BFF Proxy to Real FAST2 API
 *
 * Routes requests to real FAST2 API with two-tier authentication:
 * 1. OAuth2 for API Gateway (WSO2)
 * 2. API token from username/password login for actual API calls
 */

import { getValidToken as getOAuth2Token, clearTokenCache as clearOAuth2Cache } from './oauth2Client';
import { getValidApiToken, clearApiTokenCache } from './apiAuthClient';

interface ProxyConfig {
  fast2BaseUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

/**
 * Check if path is an auth endpoint (use OAuth2 only)
 */
function isAuthEndpoint(path: string): boolean {
  return path.includes('/auth/login') ||
         path.includes('/auth/refresh') ||
         path.includes('/auth/logout') ||
         path.includes('/auth/loginsso');
}

/**
 * Check if response indicates authentication failure
 */
async function isAuthError(response: Response): Promise<boolean> {
  if (response.status === 401 || response.status === 403) {
    return true;
  }

  // Clone the response so we can read the body without consuming it
  const clone = response.clone();
  try {
    const text = await clone.text();
    return text.includes('Invalid JWT token') ||
           text.includes('Invalid Credentials') ||
           text.includes('900901'); // WSO2 invalid credentials code
  } catch {
    return false;
  }
}

/**
 * Internal function to make the actual API request
 */
async function makeRequest(
  path: string,
  method: string,
  body: unknown,
  fast2BaseUrl: string,
  oauth2TokenEndpoint: string,
  consumerKey: string,
  consumerSecret: string,
  username: string,
  password: string
): Promise<Response> {
  const url = `${fast2BaseUrl}${path}`;

  // Step 1: Get OAuth2 token (required for API Gateway)
  const oauth2Token = await getOAuth2Token({
    tokenEndpoint: oauth2TokenEndpoint,
    consumerKey,
    consumerSecret,
  });

  // Build headers with OAuth2 Bearer token
  const headers: HeadersInit = {
    'Authorization': `Bearer ${oauth2Token.access_token}`,
  };

  // Step 2: For non-auth endpoints, also get and add X-Auth-Token
  if (!isAuthEndpoint(path)) {
    const apiToken = await getValidApiToken({
      fast2BaseUrl,
      oauth2TokenEndpoint,
      consumerKey,
      consumerSecret,
      username,
      password,
    });

    // Add X-Auth-Token header for API authentication
    headers['X-Auth-Token'] = apiToken.access_token;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    if (body instanceof FormData) {
      // For file uploads, don't set Content-Type (browser will set it with boundary)
      options.body = body;
    } else {
      // For JSON requests
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  // Forward request to FAST2 API
  return await fetch(url, options);
}

/**
 * Proxy a request to the real FAST2 API
 *
 * Authentication flow:
 * 1. For /auth/* endpoints: Use OAuth2 token only
 * 2. For data endpoints: Use API token (which internally uses OAuth2 for gateway)
 *
 * Automatically retries once if authentication fails (e.g., token invalidated externally)
 */
export async function proxyToRealApi(
  path: string,
  method: string,
  body?: unknown,
  config?: ProxyConfig
): Promise<Response> {

  // Get config from env if not provided
  const fast2BaseUrl = config?.fast2BaseUrl || process.env.FAST2_BASE_URL;
  const consumerKey = config?.consumerKey || process.env.CONSUMER_KEY;
  const consumerSecret = config?.consumerSecret || process.env.CONSUMER_SECRET;
  const oauth2TokenEndpoint = process.env.OAUTH2_TOKEN_ENDPOINT || `${fast2BaseUrl}/oauth2/token`;
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;

  if (!fast2BaseUrl || !consumerKey || !consumerSecret) {
    throw new Error('Missing FAST2 API configuration');
  }

  if (!isAuthEndpoint(path) && (!username || !password)) {
    throw new Error('Missing USERNAME or PASSWORD for API authentication');
  }

  // Try the request
  let response = await makeRequest(
    path, method, body,
    fast2BaseUrl, oauth2TokenEndpoint,
    consumerKey, consumerSecret,
    username || '', password || ''
  );

  // If authentication failed, clear both token caches and retry once
  if (await isAuthError(response)) {
    console.log('[Auth] Authentication error detected, clearing all caches and retrying...');
    clearOAuth2Cache();
    clearApiTokenCache();

    response = await makeRequest(
      path, method, body,
      fast2BaseUrl, oauth2TokenEndpoint,
      consumerKey, consumerSecret,
      username || '', password || ''
    );
  }

  return response;
}
