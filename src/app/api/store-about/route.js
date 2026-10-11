import { NextResponse } from 'next/server';
import { getEcomAbout, DEFAULT_ECOM_ABOUT } from '@/app/models/EcomAbout';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const AboutModel = await getEcomAbout();
    let about = await AboutModel.findOne({ key: 'global_about' }).lean();

    if (!about) {
      // Auto seed default configuration on first fetch
      try {
        about = await AboutModel.create(DEFAULT_ECOM_ABOUT);
        about = about.toObject();
      } catch (err) {
        return NextResponse.json({ success: true, about: DEFAULT_ECOM_ABOUT });
      }
    }

    return NextResponse.json({ success: true, about });
  } catch (error) {
    console.error('Error fetching store about:', error);
    return NextResponse.json({ success: true, about: DEFAULT_ECOM_ABOUT });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const AboutModel = await getEcomAbout();

    const updated = await AboutModel.findOneAndUpdate(
      { key: 'global_about' },
      { $set: body },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, about: updated });
  } catch (error) {
    console.error('Error updating store about:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
