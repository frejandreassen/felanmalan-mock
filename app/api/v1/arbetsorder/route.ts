import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/lib/mockStore';

// POST /api/v1/arbetsorder - Create work order
export async function POST(request: NextRequest) {
  try {
    // Check X-Auth-Token header (exact copy of real API)
    const authToken = request.headers.get('X-Auth-Token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields according to ArbetsorderPostIn spec
    const errors: string[] = [];

    if (!body.arbetsordertypKod) {
      errors.push('arbetsordertypKod is required');
    }

    if (!body.kundNr) {
      errors.push('kundNr is required');
    }

    if (!body.objektId) {
      errors.push('objektId is required');
    }

    if (body.ursprung === undefined || body.ursprung === null) {
      errors.push('ursprung is required');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errors
        },
        { status: 400 }
      );
    }

    // Create work order matching ArbetsorderPostIn structure
    const workOrder = mockStore.createWorkOrder({
      // Required fields
      arbetsordertypKod: body.arbetsordertypKod,
      kundNr: body.kundNr,
      objektId: body.objektId,
      ursprung: body.ursprung,

      // Optional fields
      externtId: body.externtId,
      externtNr: body.externtNr,
      buntId: body.buntId,
      resursId: body.resursId,
      statusKod: body.statusKod,
      utrymmesId: body.utrymmesId,
      enhetsId: body.enhetsId,
      enhetsNotering: body.enhetsNotering,
      nyEnhet: body.nyEnhet,
      frasNr: body.frasNr,
      information: body.information,
      tilltradeKod: body.tilltradeKod,
      prioKod: body.prioKod,
      anmalare: body.anmalare,
      planering: body.planering,
      ekonomi: body.ekonomi,
      fakturera: body.fakturera,
      kundPrimarKontaktsatt: body.kundPrimarKontaktsatt,
      bokning: body.bokning
    });

    // Return response matching ArbetsorderPostUt structure
    return NextResponse.json(
      {
        id: workOrder.id
      },
      { status: 201 }
    );
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
    // Check X-Auth-Token header (exact copy of real API)
    const authToken = request.headers.get('X-Auth-Token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
