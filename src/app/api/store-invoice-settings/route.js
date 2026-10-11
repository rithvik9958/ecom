import { connectDB } from '@/app/lib/config';
import InvoiceSetting from '@/app/models/InvoiceSetting';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    let settings = await InvoiceSetting.findOne();
    
    if (!settings) {
      settings = await InvoiceSetting.create({});
    }

    return Response.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching store invoice settings:', error);
    return Response.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
