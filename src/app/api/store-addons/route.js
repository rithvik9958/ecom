export const dynamic = 'force-dynamic';
import { getEcomAddon } from '@/app/models/EcomAddon';
import { getEcomAddonCategory } from '@/app/models/EcomAddonCategory';
import { uploadFile, isUploadFile } from '@/lib/upload';

export async function GET(request) {
  try {
    const Addon = await getEcomAddon();
    await getEcomAddonCategory(); // Register model for populate
    const addons = await Addon.find().populate({ path: 'category', select: 'name', model: 'EcomAddonCategory' }).sort({ createdAt: -1 });
    return Response.json({ success: true, addons });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const price = Number(formData.get('price')) || 0;
    const mrp = Number(formData.get('mrp')) || 0;
    const isActive = formData.get('isActive') !== 'false';
    const category = formData.get('category');
    
    if (!name || !price) {
      return Response.json({ success: false, message: 'Name and price are required' }, { status: 400 });
    }

    const imageFile = formData.get('image');
    let imageUrl = '';
    if (isUploadFile(imageFile)) {
      imageUrl = await uploadFile(imageFile, 'ecom', 'addon');
    }

    const Addon = await getEcomAddon();
    const addon = new Addon({
      name,
      price,
      mrp,
      isActive,
      category: category || null,
      image: imageUrl
    });
    
    await addon.save();
    
    // Populate before returning
    const populatedAddon = await Addon.findById(addon._id).populate({ path: 'category', select: 'name', model: 'EcomAddonCategory' });
    
    return Response.json({ success: true, addon: populatedAddon });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
