export const dynamic = 'force-dynamic';
import bcrypt from 'bcryptjs';
import { getEcomCustomer } from '@/app/models/EcomCustomer';
import { signCustomerToken } from '@/app/lib/customerAuth';

/**
 * POST /api/store-auth/login
 * Body: { email, password }
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { success: false, message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const Customer = await getEcomCustomer();
    const customer = await Customer.findOne({ email: email.toLowerCase().trim() });

    // Generic message to prevent email enumeration
    if (!customer) {
      return Response.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (!customer.isActive) {
      return Response.json(
        { success: false, message: 'Your account has been disabled. Please contact support.' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return Response.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const token = signCustomerToken({
      id:    customer._id,
      email: customer.email,
      name:  customer.name,
      role:  'customer',
    });

    return Response.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id:    customer._id,
        name:  customer.name,
        email: customer.email,
        phone: customer.phone || '',
        role:  'customer',
      },
    });
  } catch (error) {
    console.error('[store-auth/login] Error:', error);
    return Response.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
