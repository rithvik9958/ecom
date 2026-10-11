export const dynamic = 'force-dynamic';
import { getEcomCustomer } from '@/app/models/EcomCustomer';
import { signResetToken } from '@/app/lib/customerAuth';
import { sendPasswordResetEmail } from '@/lib/email';

/**
 * POST /api/store-auth/forgot-password
 *
 * Accepts: { email }
 * Behaviour:
 *  - Always responds with success:true to prevent email enumeration attacks.
 *  - If the account exists: signs a 1-hour reset token and emails the link.
 *  - If RESEND_API_KEY is missing: logs the URL to the server console (dev mode).
 */
export async function POST(request) {
  console.log('[forgot-password route] HIT! Request received.');
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || '').toLowerCase().trim();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return Response.json(
        { success: false, message: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const Customer = await getEcomCustomer();
    const customer = await Customer.findOne({ email });

    // Intentional: don't reveal whether the account exists
    if (!customer) {
      return Response.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    if (!customer.isActive) {
      // Still return a vague success message for security
      return Response.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Generate a signed JWT reset token (1 hour expiry)
    const resetToken = signResetToken(customer._id);

    // Send the email (degrades gracefully if RESEND_API_KEY is missing)
    try {
      await sendPasswordResetEmail(customer.email, customer.name, resetToken);
    } catch (emailErr) {
      console.error('[forgot-password] Email send failed:', emailErr);
      // Still return success to the user; the URL is logged to console in dev
    }

    return Response.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('[store-auth/forgot-password] Error:', error);
    return Response.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
