export const dynamic = 'force-dynamic';
import { requireCustomer } from '@/app/lib/customerAuth';
import { getEcomCustomer } from '@/app/models/EcomCustomer';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  const { customer, error } = requireCustomer(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return Response.json({ success: false, message: 'Current and new passwords are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return Response.json({ success: false, message: 'New password must be at least 6 characters.' }, { status: 400 });
    }

    const Customer = await getEcomCustomer();
    const user = await Customer.findById(customer.id);

    if (!user) {
      return Response.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return Response.json({ success: false, message: 'Incorrect current password.' }, { status: 401 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return Response.json({ success: true, message: 'Password changed successfully.' });
  } catch (e) {
    console.error('[store-auth/change-password] Error:', e);
    return Response.json({ success: false, message: 'Server error. Please try again.' }, { status: 500 });
  }
}
