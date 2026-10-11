export const dynamic = 'force-dynamic';
import { verifyCustomerToken } from '@/app/lib/customerAuth';
import { getEcomCartItem } from '@/app/models/EcomCartItem';
import mongoose from 'mongoose';

function getCartQuery(request) {
  const customer = verifyCustomerToken(request);
  if (customer?.id) return { customerId: new mongoose.Types.ObjectId(customer.id) };
  const guestId = request.headers.get('x-guest-id');
  if (guestId) return { guestId };
  return null;
}

// PATCH /api/store-cart/[id] — update quantity
export async function PATCH(request, { params }) {
  try {
    const query = getCartQuery(request);
    if (!query) return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

    const { id } = await params;
    const { quantity } = await request.json();

    const CartItem = await getEcomCartItem();
    const item = await CartItem.findOne({ _id: id, ...query });
    if (!item) return Response.json({ success: false, message: 'Cart item not found.' }, { status: 404 });

    if (quantity <= 0) {
      await item.deleteOne();
      // If this item was a main item, delete all its addons
      if (!item.isAddon) {
        console.log(`[DELETE PATCH] Main item ${id} deleted. Proceeding to delete addons with groupId ${id} and ${item._id}`);
        const result = await CartItem.deleteMany({
          $or: [
            { groupId: id },
            { groupId: item._id },
            { groupId: item._id.toString() }
          ],
          ...query
        });
        console.log(`[DELETE PATCH] Addons deleted: ${result.deletedCount}`);
      }
      return Response.json({ success: true, deleted: true, id });
    }

    item.quantity = quantity;
    await item.save();
    return Response.json(item);
  } catch (error) {
    console.error('[store-cart/[id] PATCH]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/store-cart/[id] — remove single item
export async function DELETE(request, { params }) {
  try {
    const query = getCartQuery(request);
    if (!query) return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

    const { id } = await params;
    const CartItem = await getEcomCartItem();
    const item = await CartItem.findOneAndDelete({ _id: id, ...query });
    
    // If the deleted item was a main item, also delete all its addons
    if (item && !item.isAddon) {
      console.log(`[DELETE API] Main item ${id} deleted. Proceeding to delete addons with groupId ${id} and ${item._id}`);
      const result = await CartItem.deleteMany({
        $or: [
          { groupId: id },
          { groupId: item._id },
          { groupId: item._id.toString() }
        ],
        ...query
      });
      console.log(`[DELETE API] Addons deleted: ${result.deletedCount}`);
    }
    
    return Response.json({ success: true, message: 'Item removed.' });
  } catch (error) {
    console.error('[store-cart/[id] DELETE]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
