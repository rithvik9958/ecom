import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/store-auth/google
 * Builds the Google OAuth authorization URL and redirects the user to Google.
 * Query param: ?redirect=/some-page (where to go after successful login)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const redirectAfter = searchParams.get('redirect') || '/';

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const callbackUrl = `${baseUrl}/api/store-auth/google/callback`;

  if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent('Google OAuth is not configured. Please add GOOGLE_CLIENT_ID to your .env file.')}`
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    // Carry the post-login destination through the OAuth round-trip
    state: redirectAfter,
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(googleAuthUrl);
}
