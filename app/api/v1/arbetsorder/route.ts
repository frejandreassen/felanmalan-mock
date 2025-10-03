import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/lib/mockStore';

// POST /api/v1/arbetsorder - Create work order
export async function POST(request: NextRequest) {
  try {
    // Check auth token (mock validation)
    const authToken = request.headers.get('X-Auth-Token');
    if (!authToken) {
      return NextResponse.json(
        { error: 'Missing authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.objekt?.id) {
      return NextResponse.json(
        { error: 'objekt.id is required' },
        { status: 400 }
      );
    }

    if (!body.information?.beskrivning) {
      return NextResponse.json(
        { error: 'information.beskrivning is required' },
        { status: 400 }
      );
    }

    // Create work order
    const workOrder = mockStore.createWorkOrder({
      externtId: body.externtId,
      objekt: {
        id: body.objekt.id,
        namn: body.objekt.namn || 'Unknown',
        adress: body.objekt.adress
      },
      utrymme: body.utrymme ? {
        id: body.utrymme.id,
        namn: body.utrymme.namn
      } : undefined,
      enhet: body.enhet ? {
        id: body.enhet.id,
        namn: body.enhet.namn
      } : undefined,
      information: {
        beskrivning: body.information.beskrivning,
        kommentar: body.information.kommentar
      },
      kund: body.kund,
      annanAnmalare: body.annanAnmalare,
      arbetsorderTyp: body.arbetsorderTyp || {
        arbetsordertypKod: 'F',
        arbetsordertypBesk: 'Felanmälan'
      },
      prio: body.prio || {
        prioKod: '10',
        prioBesk: 'Normal'
      },
      tilltrade: body.tilltrade,
      bilder: body.bilder
    });

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

// GET /api/v1/arbetsorder - List work orders
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
    const objektId = searchParams.get('objektId') || undefined;
    const statusKod = searchParams.get('statusKod') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const workOrders = mockStore.listWorkOrders({
      objektId,
      statusKod,
      limit
    });

    return NextResponse.json({
      total: workOrders.length,
      workOrders
    });
  } catch (error) {
    console.error('Error listing work orders:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
