import { NextResponse } from 'next/server';
import { getEcomAuthConfig, DEFAULT_AUTH_CONFIG } from '@/app/models/EcomAuthConfig';
import { requirePermission } from '@/app/lib/auth';
import { connectDB } from '@/app/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { error } = await requirePermission(request, 'settings');
  if (error) return error;

  await connectDB();
  try {
    const AuthConfig = await getEcomAuthConfig();
    let config = await AuthConfig.findOne({ id: 'global' }).lean();
    if (!config) {
      config = await AuthConfig.create({ id: 'global', ...DEFAULT_AUTH_CONFIG });
    }
    return NextResponse.json({ success: true, config });
  } catch (err) {
    console.error('[admin store-auth-config GET]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const { error } = await requirePermission(request, 'settings');
  if (error) return error;

  await connectDB();
  try {
    const data = await request.json();
    const AuthConfig = await getEcomAuthConfig();

    const allowedFields = [
      'bgImage',
      'overlayOpacity',
      'overlayColor',
      'logoUrl',
      'loginHeadline',
      'loginSubtitle',
      'registerHeadline',
      'registerSubtitle',
      'forgotHeadline',
      'forgotSubtitle',
      'features',
      'showFeatures',
    ];

    const updateData = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    const updated = await AuthConfig.findOneAndUpdate(
      { id: 'global' },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, config: updated });
  } catch (err) {
    console.error('[admin store-auth-config PUT]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
