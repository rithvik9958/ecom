export const dynamic = 'force-dynamic';
import { getEcomProduct } from '@/app/models/EcomProduct';
import { getEcomAddon } from '@/app/models/EcomAddon';
import { getEcomAddonCategory } from '@/app/models/EcomAddonCategory';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const Product = await getEcomProduct();
    await getEcomAddon(); // ensure model is registered for populate
    await getEcomAddonCategory(); // ensure model is registered for deep populate
    
    const rawId = id ? decodeURIComponent(id).trim() : '';
    
    const queryConditions = [{ id: rawId }, { slug: rawId }];
    if (rawId && rawId.length === 24 && /^[0-9a-fA-F]{24}$/.test(rawId)) {
      queryConditions.push({ _id: rawId });
    }

    // id can be either the string `id` field, slug, or a MongoDB _id
    const product = await Product.findOne({
      $or: queryConditions,
    }).populate({ 
      path: 'addOns', 
      model: 'EcomAddon',
      populate: { path: 'category', select: 'name image', model: 'EcomAddonCategory' } 
    });

    if (!product) {
      return Response.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    return Response.json(product);
  } catch (error) {
    console.error('[store-products/[id] GET]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
