/**
 * POST /api/store-cart/merge
 * Merge guest cart into user cart after login.
 * Called by StoreAuthContext immediately after a successful customer login.
 */
export const dynamic = 'force-dynamic';
import { requireCustomer } from '@/app/lib/customerAuth';
import { getEcomCartItem } from '@/app/models/EcomCartItem';
import mongoose from 'mongoose';

export async function POST(request) {
  const { customer, error } = requireCustomer(request);
  if (error) return error;

  try {
    const { guestId } = await request.json();
    if (!guestId) return Response.json({ success: true, message: 'No guest cart to merge.' });

    const CartItem  = await getEcomCartItem();
    const customerId = new mongoose.Types.ObjectId(customer.id);

    const guestItems = await CartItem.find({ guestId });
    if (!guestItems.length) return Response.json({ success: true, message: 'Guest cart is empty.' });

    for (const guestItem of guestItems) {
      const existing = await CartItem.findOne({ customerId, productId: guestItem.productId });
      if (existing) {
        // Merge: take the higher quantity (user may have also added the item)
        existing.quantity = Math.max(existing.quantity, guestItem.quantity);
        await existing.save();
        await guestItem.deleteOne();
      } else {
        // Transfer ownership to the logged-in user
        guestItem.customerId = customerId;
        guestItem.guestId    = null;
        await guestItem.save();
      }
    }

    const merged = await CartItem.find({ customerId });
    return Response.json({ success: true, items: merged });
  } catch (error) {
    console.error('[store-cart/merge]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
