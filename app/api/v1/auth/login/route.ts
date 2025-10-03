import { NextRequest, NextResponse } from 'next/server';

// Mock authentication endpoint
// POST /api/v1/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Simple mock validation - accept any credentials
    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      );
    }

    // Generate a mock token
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return NextResponse.json({
      token,
      expires_in: 43200, // 12 hours
      user: {
        id: 'user_123',
        username: body.username,
        name: 'Mock User'
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
