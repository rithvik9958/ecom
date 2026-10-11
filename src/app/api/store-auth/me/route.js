export const dynamic = 'force-dynamic';
import { requireCustomer } from '@/app/lib/customerAuth';
import { getEcomCustomer } from '@/app/models/EcomCustomer';

export async function GET(request) {
  try {
    const { customer, error } = requireCustomer(request);
    if (error) return error;

    const Customer = await getEcomCustomer();
    const user = await Customer.findById(customer.id).select('-password -resetPasswordCode -resetPasswordExpires');
    if (!user) {
      return Response.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    return Response.json({
      success: true,
      user: {
        id:        user._id,
        name:      user.name,
        email:     user.email,
        phone:     user.phone,
        role:      'customer',
        addresses: user.addresses,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[store-auth/me] Error:', error);
    return Response.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
