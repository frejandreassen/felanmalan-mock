/**
 * BFF (Backend for Frontend) API Route
 *
 * This is the single entry point for all FAST2 API calls from the client.
 * It routes to either:
 * - Mock API (when MOCK_API=true)
 * - Real FAST2 API (when MOCK_API=false) with OAuth2 authentication
 *
 * In Joomla, this would be a Joomla component controller that does the same routing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyToRealApi } from '@/lib/bff/proxyToRealApi';
import { proxyToMockApi } from '@/lib/bff/proxyToMockApi';

const USE_MOCK_API = process.env.MOCK_API === 'true';

/**
 * Handle all HTTP methods
 */
async function handleRequest(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the path
    const path = '/' + params.path.join('/');
    const method = request.method;

    // Get request body for POST/PUT
    let body = null;
    if (method === 'POST' || method === 'PUT') {
      body = await request.json();
    }

    // Add query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const fullPath = queryString ? `${path}?${queryString}` : path;

    console.log(`BFF: ${method} ${fullPath} (${USE_MOCK_API ? 'MOCK' : 'REAL'} API)`);

    if (USE_MOCK_API) {
      // Route to mock API
      const result = await proxyToMockApi(fullPath, method, body);
      return NextResponse.json(result.data, { status: result.status });
    } else {
      // Route to real API (with OAuth2)
      const response = await proxyToRealApi(fullPath, method, body);
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error) {
    console.error('BFF Error:', error);
    return NextResponse.json(
      {
        error: 'BFF Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(request, context);
}

export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(request, context);
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(request, context);
}
