export const dynamic = 'force-dynamic';
import { getEcomAddonCategory } from '@/app/models/EcomAddonCategory';
import { requirePermission } from '@/app/lib/auth';
import { uploadFile, isUploadFile } from '@/lib/upload';

export async function GET(request) {
  const { error } = await requirePermission(request, 'ecommerce');
  if (error) return error;

  try {
    const Category = await getEcomAddonCategory();
    const categories = await Category.find().sort({ order: 1, createdAt: -1 }).lean();
    return Response.json(categories);
  } catch (error) {
    return Response.json({ message: "Failed to fetch addon categories", error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requirePermission(request, 'ecommerce', 'create');
  if (error) return error;

  try {
    const formData = await request.formData();
    
    const name = formData.get("name");
    const order = Number(formData.get("order")) || 0;
    const isActive = formData.get("isActive") !== "false";

    if (!name) {
      return Response.json({ message: "Name is required" }, { status: 400 });
    }

    const imageFile = formData.get("image");
    let imageUrl = "";
    if (isUploadFile(imageFile)) {
      imageUrl = await uploadFile(imageFile, "ecom", "addon_category");
    }

    const Category = await getEcomAddonCategory();
    const category = new Category({
      name,
      order,
      isActive,
      image: imageUrl
    });

    await category.save();
    return Response.json(category);
  } catch (error) {
    console.error("Addon Category POST Error:", error);
    return Response.json({ message: "Failed to create addon category", error: error.message }, { status: 500 });
  }
}
