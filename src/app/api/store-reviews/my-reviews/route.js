export const dynamic = 'force-dynamic';
import { verifyCustomerToken } from '@/app/lib/customerAuth';
import { getEcomReview } from '@/app/models/EcomReview';
import { getEcomOrder } from '@/app/models/EcomOrder';
import { getEcomProduct } from '@/app/models/EcomProduct';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const customer = verifyCustomerToken(request);
    if (!customer) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const customerId = new mongoose.Types.ObjectId(customer.id);
    const Review = await getEcomReview();
    const Order = await getEcomOrder();
    const Product = await getEcomProduct();

    // 1. Fetch user's submitted reviews
    const myReviews = await Review.find({
      $or: [
        { customerId },
        { customerId: customer.id }
      ]
    }).sort({ createdAt: -1 }).lean();

    // Populate product details for submitted reviews
    const formattedReviews = await Promise.all(
      myReviews.map(async (r) => {
        let prod = null;
        if (r.productId) {
          prod = await Product.findOne({
            $or: [
              { _id: mongoose.Types.ObjectId.isValid(r.productId) ? new mongoose.Types.ObjectId(r.productId) : null },
              { id: r.productId },
              { slug: r.productId }
            ]
          }).select('title thumbnail price images slug').lean();
        }

        return {
          _id: r._id.toString(),
          productId: r.productId,
          productTitle: prod?.title || 'Product',
          productThumbnail: prod?.thumbnail || (prod?.images && prod?.images[0]) || '',
          productSlug: prod?.slug || r.productId,
          rating: r.rating,
          title: r.title,
          body: r.body,
          images: r.images || [],
          isVerifiedBuyer: r.isVerifiedBuyer,
          isEdited: r.isEdited || false,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        };
      })
    );

    // 2. Fetch delivered orders to find products pending review
    const deliveredOrders = await Order.find({
      $or: [
        { customerId: customer.id },
        { customerId },
        { email: customer.email }
      ],
      status: 'delivered'
    }).sort({ createdAt: -1 }).lean();

    const reviewedProductIds = new Set(myReviews.map(r => String(r.productId)));
    const pendingItemsMap = new Map();

    for (const order of deliveredOrders) {
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const pId = String(item.productId || item.id || '');
          if (pId && !reviewedProductIds.has(pId) && !pendingItemsMap.has(pId)) {
            pendingItemsMap.set(pId, {
              productId: pId,
              title: item.title,
              thumbnail: item.thumbnail,
              price: item.price,
              orderId: order._id.toString(),
              deliveredDate: order.updatedAt || order.createdAt
            });
          }
        }
      }
    }

    const pendingReviews = Array.from(pendingItemsMap.values());

    return Response.json({
      success: true,
      reviews: formattedReviews,
      pendingReviews,
      stats: {
        totalReviews: formattedReviews.length,
        totalPending: pendingReviews.length,
        avgGivenRating: formattedReviews.length > 0
          ? Math.round((formattedReviews.reduce((sum, r) => sum + r.rating, 0) / formattedReviews.length) * 10) / 10
          : 0
      }
    });
  } catch (error) {
    console.error('[store-reviews-my-reviews GET]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const customer = verifyCustomerToken(request);
    if (!customer) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');
    if (!reviewId) {
      return Response.json({ success: false, message: 'Review ID is required' }, { status: 400 });
    }

    const Review = await getEcomReview();
    const review = await Review.findOne({
      _id: reviewId,
      $or: [
        { customerId: customer.id },
        { customerId: new mongoose.Types.ObjectId(customer.id) }
      ]
    });

    if (!review) {
      return Response.json({ success: false, message: 'Review not found or not authorized' }, { status: 404 });
    }

    const productId = review.productId;
    await Review.deleteOne({ _id: reviewId });

    // Recalculate product rating
    if (productId) {
      const allRemaining = await Review.find({ productId, isApproved: true }).lean();
      const newAvg = allRemaining.length > 0
        ? Math.round((allRemaining.reduce((s, r) => s + r.rating, 0) / allRemaining.length) * 10) / 10
        : 0;

      const Product = await getEcomProduct();
      await Product.updateOne(
        { $or: [{ id: productId }, { slug: productId }] },
        { rating: newAvg, reviewsCount: allRemaining.length }
      );
    }

    return Response.json({ success: true, message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('[store-reviews-my-reviews DELETE]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
