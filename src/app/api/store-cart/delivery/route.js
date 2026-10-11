import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/config';
import { getEcomCartItem } from '@/app/models/EcomCartItem';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    await connectDB();
    const { groupId, deliveryDate, deliverySlot, deliveryMode } = await req.json();

    if (!groupId) {
      return NextResponse.json({ success: false, message: 'groupId is required' }, { status: 400 });
    }

    // Identify user
    const tkn = req.headers.get('authorization')?.split(' ')[1];
    let customerId = null;
    let guestId = null;

    if (tkn && tkn !== 'null') {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(tkn, process.env.JWT_SECRET || 'secret');
        customerId = decoded.id;
      } catch (e) {
        guestId = req.headers.get('x-guest-id');
      }
    } else {
      guestId = req.headers.get('x-guest-id');
    }

    const query = { $or: [{ groupId }, { _id: groupId }] };
    if (customerId) query.customerId = customerId;
    else if (guestId) query.guestId = guestId;
    else return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    // Update all items in this group
    const CartItem = await getEcomCartItem();
    
    const updatePayload = { deliveryDate, deliverySlot };
    if (deliveryMode) updatePayload.deliveryMode = deliveryMode;

    const result = await CartItem.updateMany(
      query,
      { $set: updatePayload }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
