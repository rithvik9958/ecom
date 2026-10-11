export const dynamic = 'force-dynamic';
import { verifyCustomerToken } from '@/app/lib/customerAuth';
import { getEcomWishlist } from '@/app/models/EcomWishlist';
import mongoose from 'mongoose';

// GET /api/store-wishlist — fetch wishlist for logged-in user
export async function GET(request) {
  try {
    const customer = verifyCustomerToken(request);
    if (!customer) {
      return Response.json({ success: false, productIds: [] }, { status: 200 });
    }

    const Wishlist = await getEcomWishlist();
    const doc = await Wishlist.findOne({ customerId: new mongoose.Types.ObjectId(customer.id) }).lean();
    return Response.json({ success: true, productIds: doc?.productIds || [] });
  } catch (err) {
    console.error('[store-wishlist GET]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST /api/store-wishlist — toggle a product in/out of wishlist
export async function POST(request) {
  try {
    const customer = verifyCustomerToken(request);
    if (!customer) {
      return Response.json({ success: false, message: 'Authentication required.' }, { status: 401 });
    }

    const { productId, action } = await request.json(); // action: 'add' | 'remove' | 'toggle'
    if (!productId) {
      return Response.json({ success: false, message: 'productId is required.' }, { status: 400 });
    }

    const Wishlist = await getEcomWishlist();
    const customerId = new mongoose.Types.ObjectId(customer.id);

    let doc = await Wishlist.findOne({ customerId });
    const currentIds = doc?.productIds || [];
    const isIn = currentIds.includes(productId);

    let finalAction = action;
    if (!finalAction || finalAction === 'toggle') {
      finalAction = isIn ? 'remove' : 'add';
    }

    if (finalAction === 'add' && !isIn) {
      doc = await Wishlist.findOneAndUpdate(
        { customerId },
        { $addToSet: { productIds: productId } },
        { upsert: true, new: true }
      );
    } else if (finalAction === 'remove' && isIn) {
      doc = await Wishlist.findOneAndUpdate(
        { customerId },
        { $pull: { productIds: productId } },
        { new: true }
      );
    }

    const updatedIds = doc?.productIds || [];
    return Response.json({
      success: true,
      productIds: updatedIds,
      added: finalAction === 'add',
    });
  } catch (err) {
    console.error('[store-wishlist POST]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST /api/store-wishlist/sync — sync localStorage wishlist to DB on login
export async function PUT(request) {
  try {
    const customer = verifyCustomerToken(request);
    if (!customer) {
      return Response.json({ success: false, message: 'Authentication required.' }, { status: 401 });
    }

    const { productIds } = await request.json();
    if (!Array.isArray(productIds)) {
      return Response.json({ success: false, message: 'productIds array required.' }, { status: 400 });
    }

    const Wishlist = await getEcomWishlist();
    const customerId = new mongoose.Types.ObjectId(customer.id);

    // Merge: union of DB wishlist + local wishlist
    const existing = await Wishlist.findOne({ customerId }).lean();
    const merged = [...new Set([...(existing?.productIds || []), ...productIds])];

    const doc = await Wishlist.findOneAndUpdate(
      { customerId },
      { productIds: merged },
      { upsert: true, new: true }
    );

    return Response.json({ success: true, productIds: doc.productIds });
  } catch (err) {
    console.error('[store-wishlist PUT]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
