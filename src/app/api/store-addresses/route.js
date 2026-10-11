export const dynamic = 'force-dynamic';
import { getEcomAddress } from '@/app/models/EcomAddress';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { verifyCustomerToken } from '@/app/lib/customerAuth';

async function getAuthIdentifiers(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  let customerId = null;

  const customer = verifyCustomerToken(request);
  if (customer) {
    customerId = customer.id;
  } else if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      customerId = decoded.id;
    } catch (e) {
      // invalid token
    }
  }
  return { customerId };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');
    const { customerId } = await getAuthIdentifiers(request);

    if (!guestId && !customerId) {
      return Response.json([], { status: 200 });
    }

    const query = {};
    if (customerId) {
      query.customerId = customerId;
    } else {
      query.guestId = guestId;
    }

    const Address = await getEcomAddress();
    const addresses = await Address.find(query).sort({ isDefault: -1, createdAt: -1 }).lean();
    
    const formatted = addresses.map(addr => ({
      ...addr,
      _id: addr._id?.toString(),
      customerId: addr.customerId?.toString(),
    }));

    return Response.json({ success: true, addresses: formatted });
  } catch (error) {
    console.error('[store-addresses GET]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { guestId, ...addressData } = body;
    const { customerId } = await getAuthIdentifiers(request);

    if (!guestId && !customerId) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const Address = await getEcomAddress();

    // If making default, unset other defaults
    if (addressData.isDefault) {
      const query = customerId ? { customerId } : { guestId };
      await Address.updateMany(query, { isDefault: false });
    }

    const created = await Address.create({
      ...addressData,
      customerId: customerId || null,
      guestId: customerId ? null : guestId, // If logged in, ignore guestId
    });

    return Response.json({ success: true, address: created }, { status: 201 });
  } catch (error) {
    console.error('[store-addresses POST]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
