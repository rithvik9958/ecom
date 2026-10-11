import { NextResponse } from 'next/server';
import { getEcomCustomer } from '@/app/models/EcomCustomer';
import { signCustomerToken } from '@/app/lib/customerAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/store-auth/google/callback
 * Google redirects here after the user approves (or denies) the consent screen.
 * Exchanges the code for a user profile, then finds-or-creates a customer.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const code = searchParams.get('code');
  const state = searchParams.get('state') || '/'; // The post-login redirect path
  const oauthError = searchParams.get('error');

  // User denied permission on Google's consent screen
  if (oauthError) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent('Google login was cancelled.')}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent('Google login failed. No code received.')}`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = `${baseUrl}/api/store-auth/google/callback`;

    // Step 1: Exchange the code for an access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('[Google OAuth] Token exchange failed:', tokenData);
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent('Google login failed. Could not get access token.')}`);
    }

    // Step 2: Use the access token to get the user's profile from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userInfoRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent('Could not retrieve email from Google. Please try again.')}`);
    }

    // Step 3: Find or create the customer in MongoDB
    const Customer = await getEcomCustomer();

    let customer = await Customer.findOne({ email: googleUser.email.toLowerCase() });

    if (customer) {
      // Existing customer — update Google ID and profile picture if not set
      const updates = {};
      if (!customer.googleId) updates.googleId = googleUser.id;
      if (!customer.profileImage && googleUser.picture) updates.profileImage = googleUser.picture;
      if (Object.keys(updates).length > 0) {
        await Customer.findByIdAndUpdate(customer._id, { $set: updates });
        customer = { ...customer.toObject(), ...updates };
      }
    } else {
      // New customer — create account using Google profile (no password)
      customer = await Customer.create({
        name: googleUser.name,
        email: googleUser.email.toLowerCase(),
        googleId: googleUser.id,
        profileImage: googleUser.picture || '',
        isActive: true,
        role: 'customer',
      });
    }

    // Step 4: Issue our own JWT token
    const token = signCustomerToken({
      id: customer._id,
      email: customer.email,
      name: customer.name,
      role: 'customer',
    });

    const userPayload = encodeURIComponent(JSON.stringify({
      id: customer._id,
      name: customer.name,
      email: customer.email,
      role: 'customer',
      profileImage: customer.profileImage || '',
      addresses: customer.addresses || [],
    }));

    // Step 5: Redirect to the client-side handoff page with the token
    return NextResponse.redirect(
      `${baseUrl}/auth/google/success?token=${token}&user=${userPayload}&redirect=${encodeURIComponent(state)}`
    );

  } catch (err) {
    console.error('[Google OAuth Callback] Error:', err);
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`);
  }
}
