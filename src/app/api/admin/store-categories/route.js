export const dynamic = 'force-dynamic';
import { getEcomCategory } from '@/app/models/EcomCategory';
import { requirePermission } from '@/app/lib/auth';
import { uploadFile, isUploadFile } from '@/lib/upload';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  const { error } = await requirePermission(request, 'products'); 
  if (error) return error;

  try {
    const Category = await getEcomCategory();
    const categories = await Category.find().sort({ order: 1, createdAt: -1 }).lean();
    return Response.json(categories);
  } catch (error) {
    return Response.json({ message: "Failed to fetch categories", error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requirePermission(request, 'products', 'create');
  if (error) return error;

  try {
    const formData = await request.formData();

    const title = formData.get("title");
    const description = formData.get("description") || "";
    const isActive = formData.get("isActive") !== "false";
    let megaMenu = null;
    let plpCarousel = [];
    let plpCarouselSettings = { type: 'custom', excludeCategories: [], customSlides: [] };
    let filterType = formData.get("filterType") || 'automatic';
    let filters = [];
    let filterConfig = {
      mode: 'inherit',
      showPriceFilter: true,
      showRatingFilter: true,
      showInStockFilter: true,
      showDiscountFilter: true,
      enabledGlobalFilters: []
    };
    try {
      if (formData.get("megaMenu")) {
        megaMenu = JSON.parse(formData.get("megaMenu"));
      }
      if (formData.get("plpCarousel")) {
        plpCarousel = JSON.parse(formData.get("plpCarousel"));
      }
      if (formData.get("plpCarouselSettings")) {
        plpCarouselSettings = JSON.parse(formData.get("plpCarouselSettings"));
      }
      if (formData.get("filters")) {
        filters = JSON.parse(formData.get("filters"));
      }
      if (formData.get("filterConfig")) {
        filterConfig = JSON.parse(formData.get("filterConfig"));
      }
    } catch (e) {
      console.warn("Failed to parse JSON", e);
    }
    
    if (!title) {
      return Response.json({ message: "Title is required" }, { status: 400 });
    }

    // Handle file uploads
    const imageFile = formData.get("image");
    let imageUrl = "";

    if (isUploadFile(imageFile)) {
      imageUrl = await uploadFile(imageFile, "ecom", "cat");
    }

    // Handle PLP Carousel Slide Image Uploads
    if (plpCarouselSettings && plpCarouselSettings.customSlides) {
      for (let i = 0; i < plpCarouselSettings.customSlides.length; i++) {
        const slideFile = formData.get(`plpSlideImage_${i}`);
        if (isUploadFile(slideFile)) {
          plpCarouselSettings.customSlides[i].image = await uploadFile(slideFile, "ecom", "plp");
        }
      }
    }

    // Generate unique ID / Slug
    const id = uuidv4().split('-')[0];
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const Category = await getEcomCategory();
    const newCategory = await Category.create({
      id,
      slug,
      title,
      description,
      isActive,
      image: imageUrl,
      ...(megaMenu && { megaMenu }),
      plpCarousel,
      plpCarouselSettings,
      filterType,
      filters,
      filterConfig
    });

    return Response.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Store Category Creation Error:", error);
    return Response.json({ message: "Failed to create category", error: error.message }, { status: 500 });
  }
}
