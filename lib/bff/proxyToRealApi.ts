/**
 * BFF Proxy to Real FAST2 API
 *
 * Routes requests to real FAST2 API with OAuth2 authentication
 */

import { getValidToken } from './oauth2Client';

interface ProxyConfig {
  fast2BaseUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

/**
 * Proxy a request to the real FAST2 API
 *
 * Steps:
 * 1. Get OAuth2 token from WSO2
 * 2. Make request to FAST2 API with X-Auth-Token header
 * 3. Return response
 */
export async function proxyToRealApi(
  path: string,
  method: string,
  body?: any,
  config?: ProxyConfig
): Promise<Response> {

  // Get config from env if not provided
  const fast2BaseUrl = config?.fast2BaseUrl || process.env.FAST2_BASE_URL;
  const consumerKey = config?.consumerKey || process.env.CONSUMER_KEY;
  const consumerSecret = config?.consumerSecret || process.env.CONSUMER_SECRET;

  if (!fast2BaseUrl || !consumerKey || !consumerSecret) {
    throw new Error('Missing FAST2 API configuration');
  }

  // Step 1: Get OAuth2 token from WSO2
  const oauth2Token = await getValidToken({
    tokenEndpoint: `${fast2BaseUrl}/oauth2/token`,
    consumerKey,
    consumerSecret,
  });

  // Step 2: Make request to FAST2 API with X-Auth-Token
  const url = `${fast2BaseUrl}${path}`;

  const headers: HeadersInit = {
    'X-Auth-Token': oauth2Token.access_token,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  // Step 3: Forward request to FAST2 API
  const response = await fetch(url, options);

  return response;
}
