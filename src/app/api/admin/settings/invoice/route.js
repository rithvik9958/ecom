import { connectDB } from '@/app/lib/config';
import InvoiceSetting from '@/app/models/InvoiceSetting';
import { requirePermission } from '@/app/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { error } = await requirePermission(request, 'global_settings');
    if (error) return error;

    await connectDB();
    let settings = await InvoiceSetting.findOne();
    
    if (!settings) {
      settings = await InvoiceSetting.create({});
    }

    return Response.json({ success: true, settings });
  } catch (err) {
    console.error('Error fetching invoice settings:', err);
    return Response.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { error } = await requirePermission(request, 'global_settings');
    if (error) return error;

    const data = await request.json();
    await connectDB();
    
    let settings = await InvoiceSetting.findOne();
    if (!settings) {
      settings = new InvoiceSetting();
    }

    settings.companyName = data.companyName;
    settings.companyAddress = data.companyAddress;
    settings.supportEmail = data.supportEmail;
    settings.supportPhone = data.supportPhone;
    settings.websiteUrl = data.websiteUrl;
    settings.taxId = data.taxId;
    settings.terms = data.terms;

    await settings.save();

    return Response.json({ success: true, settings, message: 'Invoice settings updated successfully' });
  } catch (error) {
    console.error('Error updating invoice settings:', error);
    return Response.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
