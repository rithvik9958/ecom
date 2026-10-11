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
    } catch (e) {}
  }
  return { customerId };
}

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id || id === 'undefined') return Response.json({ success: false, message: 'ID required' }, { status: 400 });

    const body = await request.json();
    const { guestId, _id, customerId: reqCustomerId, ...updateData } = body;
    const { customerId } = await getAuthIdentifiers(request);

    if (!guestId && !customerId) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const Address = await getEcomAddress();

    // Security check: ensure they own the address
    const query = { _id: id };
    if (customerId) query.customerId = customerId;
    else query.guestId = guestId;

    const existing = await Address.findOne(query);
    if (!existing) {
      return Response.json({ success: false, message: 'Address not found or unauthorized' }, { status: 404 });
    }

    if (updateData.isDefault) {
      const defQuery = customerId ? { customerId } : { guestId };
      await Address.updateMany(defQuery, { isDefault: false });
    }

    const updated = await Address.findOneAndUpdate(query, updateData, { new: true });
    return Response.json({ success: true, address: updated });
  } catch (error) {
    console.error('[store-addresses PUT]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id || id === 'undefined') return Response.json({ success: false, message: 'ID required' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');
    const { customerId } = await getAuthIdentifiers(request);

    if (!guestId && !customerId) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const Address = await getEcomAddress();
    
    const query = { _id: id };
    if (customerId) query.customerId = customerId;
    else query.guestId = guestId;

    const deleted = await Address.findOneAndDelete(query);
    if (!deleted) {
      return Response.json({ success: false, message: 'Address not found or unauthorized' }, { status: 404 });
    }

    if (deleted.isDefault) {
      const userQuery = customerId ? { customerId } : { guestId };
      const nextAddress = await Address.findOne(userQuery).sort({ createdAt: -1 });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return Response.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.error('[store-addresses DELETE]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
