import { NextRequest, NextResponse } from 'next/server';
import { fastaStrukturenStore } from '@/lib/fastaStrukturenStore';

// GET /api/v1/fastastrukturen/utrymmen - List utrymmen for an objekt
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
    const objektId = searchParams.get('objektId');
    const typ = searchParams.get('typ') as 'inomhus' | 'utomhus' | null;

    if (!objektId) {
      return NextResponse.json(
        { error: 'objektId query parameter is required' },
        { status: 400 }
      );
    }

    const utrymmen = fastaStrukturenStore.getUtrymmesForObjekt(
      objektId,
      typ || undefined
    );

    return NextResponse.json({
      objektId,
      total: utrymmen.length,
      utrymmen
    });
  } catch (error) {
    console.error('Error fetching utrymmen:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
