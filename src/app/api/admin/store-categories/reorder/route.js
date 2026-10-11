export const dynamic = 'force-dynamic';
import { getEcomCategory } from '@/app/models/EcomCategory';
import { requirePermission } from '@/app/lib/auth';

export async function POST(request) {
  const { error } = await requirePermission(request, 'products', 'update');
  if (error) return error;

  try {
    const { order } = await request.json(); // Array of { id, order }

    if (!Array.isArray(order)) {
      return Response.json({ message: "Invalid payload format." }, { status: 400 });
    }

    const Category = await getEcomCategory();

    const bulkOps = order.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: item.order } },
      },
    }));

    if (bulkOps.length > 0) {
      await Category.bulkWrite(bulkOps);
    }

    return Response.json({ success: true, message: "Category order updated successfully." });
  } catch (error) {
    console.error("Reorder Categories Error:", error);
    return Response.json({ message: "Failed to reorder categories", error: error.message }, { status: 500 });
  }
}
