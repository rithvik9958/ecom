export const dynamic = 'force-dynamic';
import { getEcomProduct } from '@/app/models/EcomProduct';
import { requirePermission } from '@/app/lib/auth';
import { uploadFile, isUploadFile } from '@/lib/upload';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export async function GET(request) {
  const { error } = await requirePermission(request, 'products'); 
  if (error) return error;

  try {
    const Product = await getEcomProduct();
    const products = await Product.find().sort({ order: 1, createdAt: -1 }).lean();
    return Response.json(products);
  } catch (error) {
    return Response.json({ message: "Failed to fetch products", error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requirePermission(request, 'products', 'create');
  if (error) return error;

  try {
    const formData = await request.formData();

    const title = formData.get("title");
    const description = formData.get("description") || "";
    const category = formData.get("category");
    const unit = formData.get("unit") || "pcs";
    const price = Number(formData.get("price")) || 0;
    const mrp = Number(formData.get("mrp")) || 0;
    const stock = Number(formData.get("stock")) || 0;
    const maxQuantityPerOrder = Number(formData.get("maxQuantityPerOrder")) || 0;
    const rating = Number(formData.get("rating")) || 0;
    const reviewsCount = Number(formData.get("reviewsCount")) || 0;
    const useManualRating = formData.get("useManualRating") === "true";
    const manualRating = formData.get("manualRating") ? Number(formData.get("manualRating")) : undefined;
    const manualReviewsCount = Number(formData.get("manualReviewsCount")) || 0;
    const isActive = formData.get("isActive") !== "false";
    const homepageSection = formData.get("homepageSection") || "none";
    const deliveryMode = formData.get("deliveryMode") || "courier";
    const courierDays = formData.get("courierDays") || "2-3";
    const allowExpressUpgrade = formData.get("allowExpressUpgrade") !== "false";
    const expressDeliveryMode = formData.get("expressDeliveryMode") || "slot";
    
    let tags = [];
    let attributes = [];
    let addOns = [];
    let productDetails = [];
    let dynAttrs = {};
    let variants = [];
    try {
      if (formData.get("tags")) tags = JSON.parse(formData.get("tags"));
      if (formData.get("attributes")) attributes = JSON.parse(formData.get("attributes"));
      if (formData.get("addOns")) addOns = JSON.parse(formData.get("addOns"));
      if (formData.get("productDetails")) productDetails = JSON.parse(formData.get("productDetails"));
      // Dynamic attribute template system
      if (formData.get("attrs")) dynAttrs = JSON.parse(formData.get("attrs"));
      if (formData.get("variants")) {
        const parsed = JSON.parse(formData.get("variants"));
        variants = Array.isArray(parsed) ? parsed.map(v => ({
          sku: v.sku || '',
          price: Number(v.price) || 0,
          mrp: Number(v.mrp) || 0,
          stock: Number(v.stock) || 0,
          images: Array.isArray(v.images) ? v.images : [],
          isActive: v.isActive !== false,
          attrs: (v.attrs && typeof v.attrs === 'object') ? v.attrs : {}
        })) : [];
      }
    } catch (e) {}
    const attributeTemplateSlug = formData.get("attributeTemplateSlug") || null;
    
    // Calculate discount percentage
    let discountedPrice = price;
    let discountPercentage = 0;
    if (mrp > price) {
        discountPercentage = Math.round(((mrp - price) / mrp) * 100);
    }

    if (!title || !category || !price) {
      return Response.json({ message: "Title, Category, and Price are required" }, { status: 400 });
    }

    // Handle file uploads
    const thumbnailFile = formData.get("thumbnail");
    let thumbnailUrl = "";

    if (isUploadFile(thumbnailFile)) {
      thumbnailUrl = await uploadFile(thumbnailFile, "ecom", "thumb");
    }

    // Handle Gallery Uploads
    const newGalleryCount = parseInt(formData.get("newGalleryCount") || "0");
    const galleryImages = [];
    for (let i = 0; i < newGalleryCount; i++) {
      const file = formData.get(`gallery_${i}`);
      if (isUploadFile(file)) {
        galleryImages.push(await uploadFile(file, "ecom", "gallery"));
      }
    }

    // Generate unique ID
    const id = uuidv4().split('-')[0];

    const Product = await getEcomProduct();
    const newProduct = await Product.create({
      id,
      title,
      description,
      category,
      unit,
      price,
      mrp,
      discountedPrice,
      discountPercentage,
      stock,
      maxQuantityPerOrder,
      rating,
      reviewsCount,
      useManualRating,
      manualRating,
      manualReviewsCount,
      isActive,
      tags,
      attributes,
      addOns,
      productDetails,
      deliveryMode,
      courierDays,
      allowExpressUpgrade,
      expressDeliveryMode,
      thumbnail: thumbnailUrl,
      images: galleryImages,
      homepageSection,
      attributeTemplateSlug,
      attrs: dynAttrs,
      variants,
    });
    
    // Purge cache so the new product is visible
    revalidatePath('/', 'layout');

    return Response.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Store Product Creation Error:", error);
    return Response.json({ message: "Failed to create product", error: error.message }, { status: 500 });
  }
}
