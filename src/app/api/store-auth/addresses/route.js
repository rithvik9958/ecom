export const dynamic = 'force-dynamic';
import { requireCustomer } from '@/app/lib/customerAuth';
import { getEcomCustomer } from '@/app/models/EcomCustomer';

// GET /api/store-auth/addresses — list all addresses
export async function GET(request) {
  const { customer, error } = requireCustomer(request);
  if (error) return error;
  try {
    const Customer = await getEcomCustomer();
    const user = await Customer.findById(customer.id).select('addresses');
    return Response.json({ success: true, addresses: user?.addresses || [] });
  } catch (e) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}

// POST /api/store-auth/addresses — add new address
export async function POST(request) {
  const { customer, error } = requireCustomer(request);
  if (error) return error;
  try {
    const body = await request.json();
    const { name, phone, email, flat, locality, city, state, pincode, type, isDefault } = body;
    
    if (!name || !phone || !flat || !locality || !city || !pincode) {
      return Response.json({ success: false, message: 'Missing required address fields.' }, { status: 400 });
    }

    const Customer = await getEcomCustomer();
    const user = await Customer.findById(customer.id);

    if (isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
    }

    user.addresses.push({
      name, phone, email: email || user.email, flat, locality, city, state, pincode, type: type || 'home', isDefault: !!isDefault
    });
    
    await user.save();

    return Response.json({ success: true, addresses: user.addresses });
  } catch (e) {
    console.error('[store-auth/addresses] POST error:', e);
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
