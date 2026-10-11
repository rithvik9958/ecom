export const dynamic = 'force-dynamic';
import { getEcomBanner } from '@/app/models/EcomBanner';

export async function GET() {
  try {
    const Banner = await getEcomBanner();
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    return Response.json(banners);
  } catch (err) {
    console.error('[store-banners GET]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
