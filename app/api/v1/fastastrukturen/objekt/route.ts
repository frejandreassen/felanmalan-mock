import { NextRequest, NextResponse } from 'next/server';
import { fastaStrukturenStore } from '@/lib/fastaStrukturenStore';

// GET /api/v1/fastastrukturen/objekt - List all reportable objekt
export async function GET(request: NextRequest) {
  try {
    // Check X-Auth-Token header (exact copy of real API)
    const authToken = request.headers.get('X-Auth-Token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const kategori = searchParams.get('kategori') || undefined;

    const objekt = fastaStrukturenStore.getAllObjekt(
      kategori ? { kategori } : undefined
    );

    return NextResponse.json({
      total: objekt.length,
      objekt
    });
  } catch (error) {
    console.error('Error fetching objekt:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
