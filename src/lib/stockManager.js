import mongoose from 'mongoose';
import { getEcomProduct } from '@/app/models/EcomProduct';

/**
 * Decrement stock for ordered items across products and variants.
 * Handles both base product stock and specific variant stock gracefully.
 *
 * @param {Array} items - List of items from the placed order
 */
export async function decrementStockForItems(items) {
  if (!Array.isArray(items) || items.length === 0) return;

  try {
    const Product = await getEcomProduct();

    for (const item of items) {
      if (item.isAddon) continue;
      const prodId = item.productId || item.id || item._id;
      if (!prodId) continue;

      const qty = Math.max(1, Number(item.quantity || item.qty || 1));

      const query = {
        $or: [
          { id: String(prodId) },
          ...(mongoose.Types.ObjectId.isValid(String(prodId)) ? [{ _id: new mongoose.Types.ObjectId(String(prodId)) }] : [])
        ]
      };

      const product = await Product.findOne(query);
      if (!product) continue;

      let variantFound = false;

      // 1. Decrement variant stock if line item maps to a variant
      if (Array.isArray(product.variants) && product.variants.length > 0) {
        const itemSku = item.sku || item.variant?.sku;
        const itemAttrs = item.selectedVariantAttrs || item.variant?.attrs;

        let variantMatch = null;
        if (itemSku) {
          variantMatch = product.variants.find(v => v.sku && v.sku === itemSku);
        }
        if (!variantMatch && itemAttrs && typeof itemAttrs === 'object') {
          variantMatch = product.variants.find(v => {
            const vAttrs = v.attrs instanceof Map ? Object.fromEntries(v.attrs) : (v.attrs || {});
            return JSON.stringify(vAttrs) === JSON.stringify(itemAttrs);
          });
        }

        if (variantMatch) {
          variantFound = true;
          if (typeof variantMatch.stock === 'number') {
            variantMatch.stock = Math.max(0, variantMatch.stock - qty);
            product.markModified('variants');
          }
        }
      }

      // 2. Decrement base product stock
      if (typeof product.stock === 'number') {
        product.stock = Math.max(0, product.stock - qty);
      }

      await product.save();
    }
  } catch (err) {
    console.error('[decrementStockForItems error]', err);
  }
}
