/**
 * BFF (Backend for Frontend) API Route
 *
 * Single entry point for all FAST2 API calls from the client.
 * Handles OAuth2 authentication and routes requests to FAST2 API.
 *
 * In Joomla, this would be a Joomla component controller.
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyToRealApi } from '@/lib/bff/proxyToRealApi';

/**
 * Handle all HTTP methods
 * In Next.js 15, params is a Promise that must be awaited
 */
async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const resolvedParams = await params;

    // Reconstruct the path
    const path = '/' + resolvedParams.path.join('/');
    const method = request.method;

    // Get request body for POST/PUT
    let body = null;
    if (method === 'POST' || method === 'PUT') {
      // Special handling for multipart/form-data (file uploads)
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('multipart/form-data')) {
        // Pass FormData directly
        body = await request.formData();
      } else {
        body = await request.json();
      }
    }

    // Add query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const fullPath = queryString ? `${path}?${queryString}` : path;

    console.log(`[BFF] ${method} ${fullPath}`);

    // Route to FAST2 API (with OAuth2)
    const response = await proxyToRealApi(fullPath, method, body);
    const data = await response.json();

    // Filter out confidential work orders from list responses
    if (method === 'GET' && fullPath.includes('/arbetsorder') && Array.isArray(data)) {
      console.log('[BFF] Filtering work orders, total:', data.length);
      const filteredData = data.filter((workOrder: any) => {
        const isConfidential = workOrder.externtNr === 'CONFIDENTIAL';
        if (isConfidential) {
          console.log('[BFF] Filtered out confidential work order:', workOrder.arbetsorderId || workOrder.id);
        }
        return !isConfidential;
      });
      console.log('[BFF] After filtering:', filteredData.length);
      return NextResponse.json(filteredData, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[BFF] Error:', error);
    return NextResponse.json(
      {
        error: 'BFF Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, context);
}
