import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/lib/mockStore';

// GET /api/v1/arbetsorder/:id - Get work order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check auth token
    const authToken = request.headers.get('X-Auth-Token');
    if (!authToken) {
      return NextResponse.json(
        { error: 'Missing authentication token' },
        { status: 401 }
      );
    }

    const workOrder = mockStore.getWorkOrder(id);

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error('Error getting work order:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
