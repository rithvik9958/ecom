export const dynamic = 'force-dynamic';
import { getEcomAddonCategory } from '@/app/models/EcomAddonCategory';
import { requirePermission } from '@/app/lib/auth';
import { uploadFile, isUploadFile, deleteFile } from '@/lib/upload';

export async function PUT(request, props) {
  const params = await props.params;
  const { error } = await requirePermission(request, 'ecommerce', 'update');
  if (error) return error;

  try {
    const Category = await getEcomAddonCategory();
    const category = await Category.findById(params.id);
    
    if (!category) {
      return Response.json({ message: "Category not found" }, { status: 404 });
    }

    const formData = await request.formData();
    
    if (formData.has("name")) category.name = formData.get("name");
    if (formData.has("order")) category.order = Number(formData.get("order"));
    if (formData.has("isActive")) category.isActive = formData.get("isActive") !== "false";

    const imageFile = formData.get("image");
    if (isUploadFile(imageFile)) {
      if (category.image) {
        await deleteFile(category.image);
      }
      category.image = await uploadFile(imageFile, "ecom", "addon_category");
    }

    await category.save();
    return Response.json(category);
  } catch (error) {
    console.error("Addon Category PUT Error:", error);
    return Response.json({ message: "Failed to update addon category", error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, props) {
  const params = await props.params;
  const { error } = await requirePermission(request, 'ecommerce', 'delete');
  if (error) return error;

  try {
    const Category = await getEcomAddonCategory();
    const category = await Category.findById(params.id);
    
    if (!category) {
      return Response.json({ message: "Category not found" }, { status: 404 });
    }

    if (category.image) {
      await deleteFile(category.image);
    }

    await Category.findByIdAndDelete(params.id);
    return Response.json({ success: true, message: "Category deleted" });
  } catch (error) {
    return Response.json({ message: "Failed to delete addon category", error: error.message }, { status: 500 });
  }
}
