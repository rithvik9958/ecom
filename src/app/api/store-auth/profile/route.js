export const dynamic = 'force-dynamic';
import { requireCustomer } from '@/app/lib/customerAuth';
import { getEcomCustomer } from '@/app/models/EcomCustomer';

// GET /api/store-auth/profile — get profile + addresses
export async function GET(request) {
  const { customer, error } = requireCustomer(request);
  if (error) return error;
  try {
    const Customer = await getEcomCustomer();
    const user = await Customer.findById(customer.id).select('-password -resetPasswordCode -resetPasswordExpires');
    if (!user) return Response.json({ success: false, message: 'Not found.' }, { status: 404 });
    return Response.json({ success: true, user });
  } catch (e) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

// PATCH /api/store-auth/profile — update name, phone
export async function PATCH(request) {
  const { customer, error } = requireCustomer(request);
  if (error) return error;
  try {
    const body = await request.json();
    const allowed = {};
    if (body.name)   allowed.name   = body.name;
    if (body.phone)  allowed.phone  = body.phone;
    if (body.dob !== undefined)    allowed.dob    = body.dob;
    if (body.gender !== undefined) allowed.gender = body.gender;

    const Customer = await getEcomCustomer();
    const updated = await Customer.findByIdAndUpdate(
      customer.id,
      { $set: allowed },
      { new: true, select: '-password -resetPasswordCode -resetPasswordExpires' }
    );
    return Response.json({ success: true, user: updated });
  } catch (e) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
