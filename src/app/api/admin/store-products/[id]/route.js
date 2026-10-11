export const dynamic = 'force-dynamic';
import { getEcomProduct } from '@/app/models/EcomProduct';
import { requirePermission } from '@/app/lib/auth';
import { uploadFile, isUploadFile, deleteFile } from '@/lib/upload';
import { processProductAlerts } from '@/lib/alertNotifier';
import { revalidatePath } from 'next/cache';

export async function PUT(request, props) {
  const params = await props.params;
  const { error } = await requirePermission(request, 'products', 'update');
  if (error) return error;

  try {
    const Product = await getEcomProduct();
    let product = await Product.findOne({ id: params.id });
    
    if (!product) {
      try {
        product = await Product.findById(params.id);
      } catch (err) {
        // CastError if params.id is not an ObjectId
      }
    }
    
    if (!product) {
      return Response.json({ message: `Product not found for id: ${params.id}` }, { status: 404 });
    }

    const oldStock = Number(product.stock || 0);
    const oldPrice = Number(product.price || 0);

    const formData = await request.formData();
    console.log('[DEBUG] Product PUT request for id:', params.id, 'FormData keys:', Array.from(formData.keys()));

    // Check what is being updated (for simple toggles vs full update)
    const isActiveField = formData.get("isActive");
    console.log('[DEBUG] isActiveField:', isActiveField);
    
    if (isActiveField !== null && Array.from(formData.keys()).length <= 2) {
      // Just a status toggle
      product.isActive = isActiveField !== "false";
      try {
        await product.save();
        console.log('[DEBUG] Successfully saved toggle, isActive is now:', product.isActive);
      } catch (saveErr) {
        console.error('[DEBUG] Failed to save toggle:', saveErr);
      }
      revalidatePath('/', 'layout');
      return Response.json(product);
    }

    const title = formData.get("title");
    if (title) product.title = title;
    
    const description = formData.get("description");
    if (description !== null) product.description = description;

    const category = formData.get("category");
    if (category) product.category = category;

    const priceRaw = formData.get("price");
    if (priceRaw !== null) product.price = Number(priceRaw);

    const mrpRaw = formData.get("mrp");
    if (mrpRaw !== null) product.mrp = Number(mrpRaw);

    if (formData.has("stock")) product.stock = Number(formData.get("stock"));
    if (formData.has("maxQuantityPerOrder")) product.maxQuantityPerOrder = Number(formData.get("maxQuantityPerOrder")) || 0;
    if (formData.has("rating")) product.rating = Number(formData.get("rating"));
    if (formData.has("reviewsCount")) product.reviewsCount = Number(formData.get("reviewsCount"));
    if (formData.has("useManualRating")) product.useManualRating = formData.get("useManualRating") === "true";
    if (formData.has("manualRating")) product.manualRating = Number(formData.get("manualRating")) || 0;
    if (formData.has("manualReviewsCount")) product.manualReviewsCount = Number(formData.get("manualReviewsCount")) || 0;
    if (formData.has("isActive")) product.isActive = formData.get("isActive") !== "false";
    if (formData.has("homepageSection")) product.homepageSection = formData.get("homepageSection");
    if (formData.has("deliveryMode")) product.deliveryMode = formData.get("deliveryMode");
    if (formData.has("courierDays")) product.courierDays = formData.get("courierDays");
    if (formData.has("allowExpressUpgrade")) product.allowExpressUpgrade = formData.get("allowExpressUpgrade") !== "false";
    if (formData.has("expressDeliveryMode")) product.expressDeliveryMode = formData.get("expressDeliveryMode");

    try {
      if (formData.has("tags")) product.tags = JSON.parse(formData.get("tags"));
      if (formData.has("attributes")) product.attributes = JSON.parse(formData.get("attributes"));
      if (formData.has("addOns")) product.addOns = JSON.parse(formData.get("addOns"));
      if (formData.has("productDetails")) product.productDetails = JSON.parse(formData.get("productDetails"));
      // Dynamic attribute template system
      if (formData.has("attributeTemplateSlug")) product.attributeTemplateSlug = formData.get("attributeTemplateSlug") || null;
      if (formData.has("attrs")) {
        product.attrs = JSON.parse(formData.get("attrs"));
        product.markModified("attrs");
      }
      if (formData.has("variants")) {
        const parsed = JSON.parse(formData.get("variants"));
        product.variants = Array.isArray(parsed) ? parsed.map(v => ({
          sku: v.sku || '',
          price: Number(v.price) || 0,
          mrp: Number(v.mrp) || 0,
          stock: Number(v.stock) || 0,
          images: Array.isArray(v.images) ? v.images : [],
          isActive: v.isActive !== false,
          attrs: (v.attrs && typeof v.attrs === 'object') ? v.attrs : {}
        })) : [];
        product.markModified("variants");
      }
    } catch (e) {}

    // Recalculate discount
    product.discountedPrice = product.price;
    if (product.mrp > product.price) {
        product.discountPercentage = Math.round(((product.mrp - product.price) / product.mrp) * 100);
    } else {
        product.discountPercentage = 0;
    }

    const thumbnailFile = formData.get("thumbnail");
    if (isUploadFile(thumbnailFile)) {
      if (product.thumbnail) await deleteFile(product.thumbnail);
      product.thumbnail = await uploadFile(thumbnailFile, "ecom", "thumb");
    }

    // Handle Gallery Uploads
    const existingImagesRaw = formData.get("existingImages");
    if (existingImagesRaw) {
      product.images = JSON.parse(existingImagesRaw);
    }
    
    const newGalleryCount = parseInt(formData.get("newGalleryCount") || "0");
    for (let i = 0; i < newGalleryCount; i++) {
      const file = formData.get(`gallery_${i}`);
      if (isUploadFile(file)) {
        product.images.push(await uploadFile(file, "ecom", "gallery"));
      }
    }

    try {
      await product.save();
      console.log('[DEBUG] Successfully saved full update');
      
      const totalStock = Number(product.stock || 0) + (Array.isArray(product.variants) ? product.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : 0);

      // Trigger in-app & email product alerts in background
      processProductAlerts({
        productId: String(product._id),
        productObjectId: String(product._id),
        productCustomId: product.id,
        productSlug: product.slug,
        newStock: totalStock,
        oldStock,
        newPrice: Number(product.price || 0),
        oldPrice,
        productTitle: product.title,
        productThumbnail: product.thumbnail || product.images?.[0] || '',
      }).catch(err => console.error('[Alerts Notifier Error]:', err));
    } catch (saveErr) {
      console.error('[DEBUG] Failed to save full update:', saveErr);
      throw saveErr;
    }
    
    // Purge cache so changes are instantly visible on the storefront
    revalidatePath('/', 'layout');
    
    // Convert to plain object so Map fields (attrs, variant.attrs) serialize correctly
    return Response.json(product.toObject());
  } catch (error) {
    console.error("Product Update Error:", error);
    return Response.json({ message: "Failed to update product", error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, props) {
  const params = await props.params;
  const { error } = await requirePermission(request, 'products', 'delete');
  if (error) return error;

  try {
    const Product = await getEcomProduct();
    let product = await Product.findOne({ id: params.id });
    
    if (!product) {
      try {
        product = await Product.findById(params.id);
      } catch (err) {}
    }
    
    if (!product) {
      return Response.json({ message: `Product not found for id: ${params.id}` }, { status: 404 });
    }

    if (product.thumbnail) await deleteFile(product.thumbnail);
    
    await Product.findByIdAndDelete(product._id);
    
    return Response.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Product Deletion Error:", error);
    return Response.json({ message: "Failed to delete product", error: error.message }, { status: 500 });
  }
}
