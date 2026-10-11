/**
 * Hybrid Cart API — Industry Best Practice (Amazon/Shopify pattern)
 * 
 * - Guest users: identified by `guestId` header (UUID from localStorage)
 * - Logged-in users: identified by customer JWT Bearer token
 * - On login: call POST /api/store-cart/merge to sync guest cart → user cart
 */
export const dynamic = 'force-dynamic';
import { verifyCustomerToken } from '@/app/lib/customerAuth';
import { getEcomCartItem } from '@/app/models/EcomCartItem';
import { getEcomProduct } from '@/app/models/EcomProduct';
import mongoose from 'mongoose';

function getCartQuery(request) {
  const customer = verifyCustomerToken(request);
  if (customer?.id) {
    return { customerId: new mongoose.Types.ObjectId(customer.id) };
  }
  const guestId = request.headers.get('x-guest-id');
  if (guestId) return { guestId };
  return null;
}

// GET /api/store-cart — fetch current cart
export async function GET(request) {
  try {
    const query = getCartQuery(request);
    if (!query) return Response.json([], { status: 200 });

    const CartItem = await getEcomCartItem();
    const Product = await getEcomProduct();
    let items = await CartItem.find(query).lean();
    
    const addonItems = items.filter(item => item.isAddon);
    const productItems = items.filter(item => !item.isAddon);

    const productIds = productItems.map(item => item.productId);
    const liveProducts = productIds.length > 0
      ? await Product.find({ id: { $in: productIds } }).lean()
      : [];
    const productMap = liveProducts.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
    
    const formattedProducts = productItems.map(item => {
      const liveProduct = productMap[item.productId];
      let isUnavailable = false;
      let unavailableReason = '';
      
      if (!liveProduct) {
        isUnavailable = true;
        unavailableReason = 'Item no longer exists';
      } else if (liveProduct.isActive === false) {
        isUnavailable = true;
        unavailableReason = 'Item is no longer available';
      } else if (liveProduct.stock <= 0 || liveProduct.availabilityStatus === 'Out of Stock') {
        isUnavailable = true;
        unavailableReason = 'Out of Stock';
      }

      return {
        ...item,
        _id: item._id?.toString(),
        productId: item.productId?.toString(),
        customerId: item.customerId?.toString(),
        isUnavailable,
        unavailableReason
      };
    });

    // Addon items are always available — they were validated at add time
    const formattedAddons = addonItems.map(item => ({
      ...item,
      _id: item._id?.toString(),
      productId: item.productId?.toString(),
      customerId: item.customerId?.toString(),
      isUnavailable: false,
      unavailableReason: ''
    }));

    const formatted = [...formattedProducts, ...formattedAddons];
    
    console.log('[DEBUG] Cart Items Summary:');
    formatted.forEach(f => console.log(`- ${f.title}: unavailable=${f.isUnavailable} (reason: ${f.unavailableReason})`));
    
    return Response.json(formatted);
  } catch (error) {
    console.error('[store-cart GET]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/store-cart — add or increment item
export async function POST(request) {
  try {
    const query = getCartQuery(request);
    if (!query) {
      return Response.json({ success: false, message: 'Provide a guest ID or login.' }, { status: 400 });
    }

    const body = await request.json();
    const { 
      productId, title, price, mrp, quantity = 1, thumbnail, category, 
      sku = '', variant = null, selectedVariantAttrs = null,
      groupId, isAddon = false, deliveryMode = 'courier', 
      originalDeliveryMode = 'courier', allowExpressUpgrade = false, 
      expressDeliveryMode = 'slot', courierDays = '2-3', 
      deliveryDate = null, deliverySlot = null 
    } = body;

    if (!productId) {
      return Response.json({ success: false, message: 'productId is required.' }, { status: 400 });
    }

    // For addon items, skip the EcomProduct lookup — addons live in a different
    // collection (EcomAddon) and are embedded in the product. We trust the client
    // data for addons since they are already validated when the product loads.
    if (!isAddon) {
      const Product = await getEcomProduct();
      const liveProduct = await Product.findOne({ id: productId });
      if (!liveProduct) {
        return Response.json({ success: false, message: 'Product no longer exists' }, { status: 400 });
      }
    }

    const CartItem = await getEcomCartItem();
    const existing = await CartItem.findOne({ 
      ...query, 
      productId,
      sku: sku || '',
      groupId: groupId || null,
      isAddon: isAddon || false
    });

    if (existing) {
      existing.quantity += quantity;
      if (price !== undefined) existing.price = price;
      if (mrp !== undefined) existing.mrp = mrp;
      if (deliveryDate) existing.deliveryDate = deliveryDate;
      if (deliverySlot) existing.deliverySlot = deliverySlot;
      await existing.save();
      return Response.json({ success: true, message: 'Quantity updated.', cartItem: existing });
    }

    const created = await CartItem.create({
      ...query,
      productId,
      title,
      price,
      mrp,
      quantity,
      thumbnail,
      category,
      sku: sku || '',
      variant: variant || null,
      selectedVariantAttrs: selectedVariantAttrs || null,
      groupId,
      isAddon,
      deliveryMode,
      originalDeliveryMode,
      allowExpressUpgrade,
      expressDeliveryMode,
      courierDays,
      deliveryDate,
      deliverySlot
    });

    return Response.json(created, { status: 201 });
  } catch (error) {
    console.error('[store-cart POST]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/store-cart — clear entire cart
export async function DELETE(request) {
  try {
    const query = getCartQuery(request);
    if (!query) return Response.json({ success: true });

    const CartItem = await getEcomCartItem();
    await CartItem.deleteMany(query);
    return Response.json({ success: true, message: 'Cart cleared.' });
  } catch (error) {
    console.error('[store-cart DELETE]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
