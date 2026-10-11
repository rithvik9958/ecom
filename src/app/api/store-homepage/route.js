export const dynamic = 'force-dynamic';
import { getEcomHomepage } from '@/app/models/EcomHomepage';

export async function GET() {
  try {
    const Homepage = await getEcomHomepage();
    let content = await Homepage.findOne({ key: 'homepage' });
    if (!content) {
      content = await Homepage.create({ key: 'homepage' });
    }
    return Response.json(content);
  } catch (err) {
    console.error('[store-homepage GET]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
