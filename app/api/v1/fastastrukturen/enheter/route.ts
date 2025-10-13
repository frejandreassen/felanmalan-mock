import { NextRequest, NextResponse } from 'next/server';
import { fastaStrukturenStore } from '@/lib/fastaStrukturenStore';

// GET /api/v1/fastastrukturen/enheter - List enheter for a utrymme
export async function GET(request: NextRequest) {
  try {
    // Check auth token (mock validation)
    const authToken = request.headers.get('X-Auth-Token');
    if (!authToken) {
      return NextResponse.json(
        { error: 'Missing authentication token' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const utrymmesId = searchParams.get('utrymmesId');

    if (!utrymmesId) {
      return NextResponse.json(
        { error: 'utrymmesId query parameter is required' },
        { status: 400 }
      );
    }

    const enheter = fastaStrukturenStore.getEnheterForUtrymme(utrymmesId);

    return NextResponse.json({
      utrymmesId,
      total: enheter.length,
      enheter
    });
  } catch (error) {
    console.error('Error fetching enheter:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
