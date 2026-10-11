export const dynamic = 'force-dynamic';
import bcrypt from 'bcryptjs';
import { getEcomCustomer } from '@/app/models/EcomCustomer';
import { signCustomerToken } from '@/app/lib/customerAuth';

export async function POST(request) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password) {
      return Response.json(
        { success: false, message: 'Name, email and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { success: false, message: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const Customer = await getEcomCustomer();
    const exists = await Customer.findOne({ email: email.toLowerCase() });
    if (exists) {
      return Response.json(
        { success: false, message: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const customer = await Customer.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      phone: phone || '',
    });

    const token = signCustomerToken({
      id:    customer._id,
      email: customer.email,
      name:  customer.name,
      role:  'customer',
    });

    return Response.json(
      {
        success: true,
        message: 'Account created successfully.',
        token,
        user: {
          id:    customer._id,
          name:  customer.name,
          email: customer.email,
          phone: customer.phone,
          role:  'customer',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[store-auth/register] Error:', error);
    return Response.json(
      { success: false, message: 'Server error.', error: error.message },
      { status: 500 }
    );
  }
}
