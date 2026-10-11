import { NextResponse } from 'next/server';
import { getEcomFooter, DEFAULT_ECOM_FOOTER } from '@/app/models/EcomFooter';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const FooterModel = await getEcomFooter();
    let footer = await FooterModel.findOne({ key: 'global_footer' }).lean();

    if (!footer) {
      // Auto seed default configuration on first fetch
      try {
        footer = await FooterModel.create(DEFAULT_ECOM_FOOTER);
        footer = footer.toObject();
      } catch (err) {
        // In case of parallel create collision, fallback to static defaults
        return NextResponse.json({ success: true, footer: DEFAULT_ECOM_FOOTER });
      }
    }

    return NextResponse.json({ success: true, footer });
  } catch (error) {
    console.error('Error fetching store footer:', error);
    return NextResponse.json({ success: true, footer: DEFAULT_ECOM_FOOTER });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const FooterModel = await getEcomFooter();

    const updated = await FooterModel.findOneAndUpdate(
      { key: 'global_footer' },
      { $set: body },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, footer: updated });
  } catch (error) {
    console.error('Error updating store footer:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
