import { requireCustomer } from '@/app/lib/customerAuth';
import { getEcomCustomer } from '@/app/models/EcomCustomer';
import { uploadFile } from '@/lib/upload';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { customer, error } = requireCustomer(request);
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const url = await uploadFile(file, 'avatars');

    const Customer = await getEcomCustomer();
    const updated = await Customer.findByIdAndUpdate(
      customer.id,
      { $set: { profileImage: url } },
      { new: true, select: '-password -resetPasswordCode -resetPasswordExpires' }
    );

    return Response.json({ success: true, user: updated });
  } catch (e) {
    return Response.json({ success: false, message: e.message || 'Upload failed' }, { status: 500 });
  }
}
