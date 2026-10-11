import { NextResponse } from 'next/server';
import { getEcomAuthConfig, DEFAULT_AUTH_CONFIG } from '@/app/models/EcomAuthConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const AuthConfig = await getEcomAuthConfig();
    let config = await AuthConfig.findOne({ id: 'global' }).lean();
    if (!config) {
      config = await AuthConfig.create({ id: 'global', ...DEFAULT_AUTH_CONFIG });
    }
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('[store-auth-config GET]', error);
    return NextResponse.json({ success: true, config: DEFAULT_AUTH_CONFIG });
  }
}
