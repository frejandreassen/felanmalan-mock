import { NextRequest, NextResponse } from 'next/server';
import { fastaStrukturenStore } from '@/lib/fastaStrukturenStore';

// GET /api/v1/fastastrukturen/objekt/[id] - Get specific objekt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check auth token (mock validation)
    const authToken = request.headers.get('X-Auth-Token');
    if (!authToken) {
      return NextResponse.json(
        { error: 'Missing authentication token' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const objekt = fastaStrukturenStore.getObjektById(id);

    if (!objekt) {
      return NextResponse.json(
        { error: 'Objekt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(objekt);
  } catch (error) {
    console.error('Error fetching objekt:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
