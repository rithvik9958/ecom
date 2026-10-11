export const dynamic = 'force-dynamic';
import { getEcomCustomer } from '@/app/models/EcomCustomer';
import { requirePermission } from '@/app/lib/auth';

export async function GET(request) {
  const { error } = await requirePermission(request, 'customers'); // Assumes some sort of 'customers' or general admin permission
  if (error) return error;

  try {
    const Customer = await getEcomCustomer();
    // Exclude password from the results
    const customers = await Customer.find().select('-password').sort({ createdAt: -1 }).lean();
    return Response.json(customers);
  } catch (error) {
    console.error("Fetch Customers Error:", error);
    return Response.json({ message: "Failed to fetch customers", error: error.message }, { status: 500 });
  }
}
