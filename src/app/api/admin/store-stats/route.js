export const dynamic = 'force-dynamic';
import { getEcomOrder } from '@/app/models/EcomOrder';
import { getEcomCustomer } from '@/app/models/EcomCustomer';
import { getEcomProduct } from '@/app/models/EcomProduct';
import { requirePermission } from '@/app/lib/auth';

export async function GET(request) {
  const { error } = await requirePermission(request, 'dashboard'); 
  if (error) return error;

  try {
    const Order = await getEcomOrder();
    const Customer = await getEcomCustomer();
    const Product = await getEcomProduct();

    const [totalOrders, totalCustomers, totalProducts] = await Promise.all([
      Order.countDocuments(),
      Customer.countDocuments(),
      Product.countDocuments()
    ]);

    // Total sales from paid orders
    const completedOrders = await Order.find({ paymentStatus: 'paid' }).lean();
    const totalSales = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // --- Last 7 days revenue chart ---
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentOrders = await Order.find({
      createdAt: { $gte: sevenDaysAgo },
      paymentStatus: 'paid'
    }).select('createdAt total').lean();

    const dayLabels = [];
    const revenueByDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      dayLabels.push(label);
      revenueByDay[key] = 0;
    }
    recentOrders.forEach(o => {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (revenueByDay[key] !== undefined) revenueByDay[key] += o.total || 0;
    });
    const revenueChart = {
      labels: dayLabels,
      data: Object.values(revenueByDay)
    };

    // --- Order status breakdown ---
    const allOrders = await Order.find().select('status paymentStatus').lean();
    const statusMap = {};
    allOrders.forEach(o => {
      const s = o.status || 'pending';
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const orderStatusBreakdown = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    // --- Top 5 products by revenue ---
    const allPaidOrders = await Order.find({ paymentStatus: 'paid' }).select('items').lean();
    const productRevMap = {};
    allPaidOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const key = item.productId?.toString() || item.name;
        if (!productRevMap[key]) productRevMap[key] = { name: item.name || 'Unknown', revenue: 0, units: 0 };
        productRevMap[key].revenue += (item.price || 0) * (item.qty || 1);
        productRevMap[key].units += item.qty || 1;
      });
    });
    const topProducts = Object.values(productRevMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // --- Last 5 recent orders ---
    const latestOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderId customerName total status paymentStatus createdAt')
      .lean();
    const recentOrdersList = latestOrders.map(o => ({
      id: o.orderId || o._id?.toString().slice(-6).toUpperCase(),
      customer: o.customerName || 'Guest',
      total: o.total || 0,
      status: o.status || 'pending',
      paymentStatus: o.paymentStatus || 'pending',
      date: o.createdAt
    }));

    return Response.json({
      totalOrders,
      totalCustomers,
      totalProducts,
      totalSales,
      revenueChart,
      orderStatusBreakdown,
      topProducts,
      recentOrdersList
    });
  } catch (error) {
    console.error('Fetch Stats Error:', error);
    return Response.json({ message: 'Failed to fetch stats', error: error.message }, { status: 500 });
  }
}
