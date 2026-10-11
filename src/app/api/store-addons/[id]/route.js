export const dynamic = 'force-dynamic';
import { getEcomAddon } from '@/app/models/EcomAddon';
import { getEcomAddonCategory } from '@/app/models/EcomAddonCategory';
import { uploadFile, isUploadFile, deleteFile } from '@/lib/upload';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const Addon = await getEcomAddon();
    const addon = await Addon.findById(id);
    
    if (!addon) {
      return Response.json({ success: false, message: 'Addon not found' }, { status: 404 });
    }

    const formData = await request.formData();
    
    if (formData.has('name')) addon.name = formData.get('name');
    if (formData.has('price')) addon.price = Number(formData.get('price'));
    if (formData.has('mrp')) addon.mrp = Number(formData.get('mrp')) || 0;
    if (formData.has('isActive')) addon.isActive = formData.get('isActive') !== 'false';
    if (formData.has('category')) {
      const cat = formData.get('category');
      addon.category = cat ? cat : null;
    }

    const imageFile = formData.get('image');
    if (isUploadFile(imageFile)) {
      if (addon.image) {
        await deleteFile(addon.image);
      }
      addon.image = await uploadFile(imageFile, 'ecom', 'addon');
    }

    await addon.save();
    
    // Populate the category before returning so the frontend table has category.name
    const populatedAddon = await Addon.findById(addon._id).populate({ path: 'category', select: 'name', model: 'EcomAddonCategory' });
    
    return Response.json({ success: true, addon: populatedAddon });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const Addon = await getEcomAddon();
    await Addon.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
