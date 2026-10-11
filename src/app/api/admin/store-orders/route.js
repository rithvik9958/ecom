export const dynamic = 'force-dynamic';
import { getEcomOrder } from '@/app/models/EcomOrder';
import { requirePermission } from '@/app/lib/auth';

export async function GET(request) {
  const { error } = await requirePermission(request, 'orders'); // Assumes some sort of 'orders' or general admin permission
  if (error) return error;

  try {
    const Order = await getEcomOrder();
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    return Response.json(orders);
  } catch (error) {
    console.error("Fetch Orders Error:", error);
    return Response.json({ message: "Failed to fetch orders", error: error.message }, { status: 500 });
  }
}
