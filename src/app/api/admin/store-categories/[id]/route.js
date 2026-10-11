export const dynamic = 'force-dynamic';
import { getEcomCategory } from '@/app/models/EcomCategory';
import { requirePermission } from '@/app/lib/auth';
import { uploadFile, isUploadFile, deleteFile } from '@/lib/upload';

export async function PUT(request, props) {
  const params = await props.params;
  const { error } = await requirePermission(request, 'products', 'update');
  if (error) return error;

  try {
    const Category = await getEcomCategory();
    let category = await Category.findOne({ id: params.id });
    
    if (!category) {
      try {
        category = await Category.findById(params.id);
      } catch(e) {}
    }
    
    if (!category) {
      return Response.json({ message: `Category not found for id: ${params.id}` }, { status: 404 });
    }

    const formData = await request.formData();

    // Check what is being updated (for simple toggles vs full update)
    const isActiveField = formData.get("isActive");
    if (isActiveField !== null && Array.from(formData.keys()).length <= 2) {
      category.isActive = isActiveField !== "false";
      await category.save();
      return Response.json(category);
    }

    const title = formData.get("title");
    if (title) category.title = title;
    
    const description = formData.get("description");
    if (description !== null) category.description = description;

    if (isActiveField !== null) category.isActive = isActiveField !== "false";

    try {
      if (formData.get("megaMenu")) {
        category.megaMenu = JSON.parse(formData.get("megaMenu"));
      }
      if (formData.get("plpCarousel")) {
        category.plpCarousel = JSON.parse(formData.get("plpCarousel"));
      }
      if (formData.get("plpCarouselSettings")) {
        category.plpCarouselSettings = JSON.parse(formData.get("plpCarouselSettings"));
      }
      if (formData.has("filterType")) {
        category.filterType = formData.get("filterType");
      }
      if (formData.get("filters")) {
        category.filters = JSON.parse(formData.get("filters"));
      }
      if (formData.get("filterConfig")) {
        category.filterConfig = JSON.parse(formData.get("filterConfig"));
      }
    } catch (e) {
      console.warn("Failed to parse JSON", e);
    }

    // Handle file upload
    const imageFile = formData.get("image");
    if (isUploadFile(imageFile)) {
      if (category.image) await deleteFile(category.image);
      category.image = await uploadFile(imageFile, "ecom", "cat");
    }

    // Handle PLP Carousel Slide Image Uploads
    if (category.plpCarouselSettings && category.plpCarouselSettings.customSlides) {
      for (let i = 0; i < category.plpCarouselSettings.customSlides.length; i++) {
        const slideFile = formData.get(`plpSlideImage_${i}`);
        if (isUploadFile(slideFile)) {
          // Ideally delete old image here if we had tracking for it, but keeping it simple
          category.plpCarouselSettings.customSlides[i].image = await uploadFile(slideFile, "ecom", "plp");
        }
      }
    }

    await category.save();
    return Response.json(category);
  } catch (error) {
    console.error("Category Update Error:", error);
    return Response.json({ message: "Failed to update category", error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, props) {
  const params = await props.params;
  const { error } = await requirePermission(request, 'products', 'delete');
  if (error) return error;

  try {
    const Category = await getEcomCategory();
    let category = await Category.findOne({ id: params.id });
    
    if (!category) {
      try {
        category = await Category.findById(params.id);
      } catch(e) {}
    }
    
    if (!category) {
      return Response.json({ message: `Category not found for id: ${params.id}` }, { status: 404 });
    }

    if (category.thumbnail) await deleteFile(category.thumbnail);
    
    await Category.findByIdAndDelete(category._id);
    
    return Response.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Category Deletion Error:", error);
    return Response.json({ message: "Failed to delete category", error: error.message }, { status: 500 });
  }
}
