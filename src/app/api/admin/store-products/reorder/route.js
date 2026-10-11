export const dynamic = 'force-dynamic';
import { getEcomProduct } from '@/app/models/EcomProduct';
import { requirePermission } from '@/app/lib/auth';

export async function POST(request) {
  const { error } = await requirePermission(request, 'products', 'update');
  if (error) return error;

  try {
    const { order } = await request.json(); // Array of { id, order }

    if (!Array.isArray(order)) {
      return Response.json({ message: "Invalid payload format." }, { status: 400 });
    }

    const Product = await getEcomProduct();

    const bulkOps = order.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: item.order } },
      },
    }));

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }

    return Response.json({ success: true, message: "Order updated successfully." });
  } catch (error) {
    console.error("Reorder Products Error:", error);
    return Response.json({ message: "Failed to reorder products", error: error.message }, { status: 500 });
  }
}
