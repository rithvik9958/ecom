export const dynamic = 'force-dynamic';
import bcrypt from 'bcryptjs';
import { getEcomCustomer } from '@/app/models/EcomCustomer';
import { verifyResetToken } from '@/app/lib/customerAuth';

/**
 * POST /api/store-auth/reset-password
 *
 * Accepts: { token, password }
 * - Verifies the JWT reset token (must have purpose: 'pw-reset', not expired)
 * - Hashes the new password and updates the customer record
 * - Clears any legacy resetPasswordCode / resetPasswordExpires fields
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token, password } = body;

    if (!token) {
      return Response.json(
        { success: false, message: 'Reset token is missing.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return Response.json(
        { success: false, message: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    // Verify the JWT reset token
    const decoded = verifyResetToken(token);
    if (!decoded) {
      return Response.json(
        {
          success: false,
          message: 'This reset link has expired or is invalid. Please request a new one.',
        },
        { status: 400 }
      );
    }

    const Customer = await getEcomCustomer();
    const customer = await Customer.findById(decoded.id);

    if (!customer) {
      return Response.json(
        { success: false, message: 'Account not found.' },
        { status: 404 }
      );
    }

    if (!customer.isActive) {
      return Response.json(
        { success: false, message: 'Your account has been disabled. Please contact support.' },
        { status: 403 }
      );
    }

    // Hash the new password
    const hashed = await bcrypt.hash(password, 12);

    await Customer.findByIdAndUpdate(decoded.id, {
      $set: { password: hashed },
      // Clear any legacy code-based reset fields
      $unset: { resetPasswordCode: '', resetPasswordExpires: '' },
    });

    return Response.json({
      success: true,
      message: 'Password updated successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('[store-auth/reset-password] Error:', error);
    return Response.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
