export const dynamic = 'force-dynamic';
import { getEcomCategory } from '@/app/models/EcomCategory';

export async function GET() {
  try {
    const Category = await getEcomCategory();
    const categories = await Category.find({ isActive: true }).sort({ order: 1, title: 1 });
    return Response.json(categories);
  } catch (error) {
    console.error('[store-categories GET]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
