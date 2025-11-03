import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Get password from environment
    const appPassword = process.env.APP_PASSWORD;

    // If no password is set in env, allow access
    if (!appPassword) {
      return NextResponse.json({ success: true });
    }

    // Check if password matches
    if (password === appPassword) {
      const response = NextResponse.json({ success: true });

      // Set cookie that expires in 24 hours
      response.cookies.set('app_auth', appPassword, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Fel lösenord' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ett fel uppstod' },
      { status: 500 }
    );
  }
}
