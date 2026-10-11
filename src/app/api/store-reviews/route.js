export const dynamic = 'force-dynamic';
import { verifyCustomerToken } from '@/app/lib/customerAuth';
import { getEcomReview } from '@/app/models/EcomReview';
import { getEcomOrder } from '@/app/models/EcomOrder';
import { getEcomProduct } from '@/app/models/EcomProduct';
import { uploadFile, isUploadFile } from '@/lib/upload';
import mongoose from 'mongoose';

// GET /api/store-reviews?productId=xxx
// Returns all approved reviews for a product + aggregate stats
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return Response.json({ success: false, message: 'productId required.' }, { status: 400 });
    }

    const Review = await getEcomReview();
    const reviews = await Review.find({ productId, isApproved: true })
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate stats
    const total = reviews.length;
    const avg = total > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
      : 0;

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (breakdown[r.rating] !== undefined) breakdown[r.rating]++;
    });

    return Response.json({
      success: true,
      reviews: reviews.map((r) => ({
        _id: r._id,
        customerId: r.customerId ? String(r.customerId) : null,
        customerName: r.customerName,
        rating: r.rating,
        title: r.title,
        body: r.body,
        images: Array.isArray(r.images) ? r.images : [],
        isVerifiedBuyer: r.isVerifiedBuyer,
        isEdited: r.isEdited || false,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      stats: { avg, total, breakdown },
    });
  } catch (err) {
    console.error('[store-reviews GET]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST /api/store-reviews — submit or update a review
// Only verified buyers (customers who ordered the product) can review
export async function POST(request) {
  try {
    const customer = verifyCustomerToken(request);
    if (!customer) {
      return Response.json({ success: false, message: 'Please log in to leave a review.' }, { status: 401 });
    }

    let productId, rating, title, body, imageUrls = [];

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      productId = formData.get('productId');
      rating = Number(formData.get('rating'));
      title = formData.get('title') || '';
      body = formData.get('body') || '';

      const rawExistingImages = formData.get('existingImages');
      let existingImages = [];
      if (rawExistingImages) {
        try {
          existingImages = JSON.parse(rawExistingImages);
        } catch {
          existingImages = [];
        }
      }
      
      const files = formData.getAll('images');
      for (const file of files) {
        if (isUploadFile(file)) {
          try {
            const url = await uploadFile(file, 'reviews', 'rev');
            if (url) imageUrls.push(url);
          } catch (uploadErr) {
            console.error('[store-reviews] image upload failed:', uploadErr);
          }
        }
      }

      imageUrls = [...existingImages, ...imageUrls].slice(0, 5);
    } else {
      const data = await request.json();
      productId = data.productId;
      rating = Number(data.rating);
      title = data.title || '';
      body = data.body || '';
      imageUrls = Array.isArray(data.images) ? data.images : [];
    }

    if (!productId || !rating) {
      return Response.json({ success: false, message: 'productId and rating are required.' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return Response.json({ success: false, message: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    const customerId = new mongoose.Types.ObjectId(customer.id);

    // Check if verified buyer — customer must have placed an order containing this product
    const Order = await getEcomOrder();
    const verifiedOrder = await Order.findOne({
      customerId,
      $or: [
        { 'items.productId': productId },
        { 'items.id': productId },
      ],
    }).lean();

    // Only allow if verified buyer
    if (!verifiedOrder) {
      return Response.json({
        success: false,
        message: 'Only customers who have purchased this product can leave a review.',
      }, { status: 403 });
    }

    const Review = await getEcomReview();

    // Check if already reviewed — if so, update seamlessly
    const existing = await Review.findOne({
      productId,
      $or: [
        { customerId },
        { customerId: customer.id },
      ],
    });

    let review;
    if (existing) {
      existing.rating = rating;
      existing.title = title?.trim() || '';
      existing.body = body?.trim() || '';
      if (imageUrls.length > 0) {
        existing.images = imageUrls;
      }
      existing.isEdited = true;
      await existing.save();
      review = existing;
    } else {
      review = await Review.create({
        productId,
        customerId,
        customerName: customer.name || 'Anonymous',
        rating,
        title: title?.trim() || '',
        body: body?.trim() || '',
        images: imageUrls,
        isVerifiedBuyer: true,
        isApproved: true,
      });
    }

    // Update product aggregate rating
    const allReviews = await Review.find({ productId, isApproved: true }).lean();
    const newAvg = allReviews.length > 0
      ? Math.round((allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length) * 10) / 10
      : rating;

    const Product = await getEcomProduct();
    await Product.updateOne(
      { $or: [{ id: productId }, { slug: productId }] },
      { rating: newAvg, reviewsCount: allReviews.length }
    );

    // Dispatch Real-Time Alert to Store Owner (Admin)
    try {
      const { notifyAdmin } = await import('@/lib/adminAlertDispatcher');
      notifyAdmin({
        type: 'new_review',
        title: `⭐ New ${rating}-Star Review by ${customer.name || 'Customer'}`,
        message: `"${title || body.slice(0, 50) || 'Verified buyer review'}" for Product #${productId}`,
        link: `/dashboard/ecommerce/products`,
        metadata: {
          productId,
          rating,
          customerName: customer.name || 'Customer',
          title,
          body
        }
      }).catch(e => console.error('[Admin Review Alert Error]', e));
    } catch (e) {}

    return Response.json({
      success: true,
      review: {
        _id: review._id,
        customerId: String(review.customerId),
        customerName: review.customerName,
        rating: review.rating,
        title: review.title,
        body: review.body,
        images: review.images || [],
        isVerifiedBuyer: review.isVerifiedBuyer,
        isEdited: review.isEdited || false,
        createdAt: review.createdAt,
      },
    });
  } catch (err) {
    console.error('[store-reviews POST]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PUT /api/store-reviews — edit/update an existing review anytime
export async function PUT(request) {
  try {
    const customer = verifyCustomerToken(request);
    if (!customer) {
      return Response.json({ success: false, message: 'Please log in to edit your review.' }, { status: 401 });
    }

    let reviewId, productId, rating, title, body, existingImages = [], newImageUrls = [];

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      reviewId = formData.get('reviewId');
      productId = formData.get('productId');
      rating = Number(formData.get('rating'));
      title = formData.get('title') || '';
      body = formData.get('body') || '';

      const rawExistingImages = formData.get('existingImages');
      if (rawExistingImages) {
        try {
          existingImages = JSON.parse(rawExistingImages);
        } catch {
          existingImages = [];
        }
      }

      const files = formData.getAll('images');
      for (const file of files) {
        if (isUploadFile(file)) {
          try {
            const url = await uploadFile(file, 'reviews', 'rev');
            if (url) newImageUrls.push(url);
          } catch (uploadErr) {
            console.error('[store-reviews PUT] image upload failed:', uploadErr);
          }
        }
      }
    } else {
      const data = await request.json();
      reviewId = data.reviewId;
      productId = data.productId;
      rating = Number(data.rating);
      title = data.title || '';
      body = data.body || '';
      existingImages = Array.isArray(data.existingImages) ? data.existingImages : [];
      newImageUrls = Array.isArray(data.images) ? data.images : [];
    }

    if (!rating || rating < 1 || rating > 5) {
      return Response.json({ success: false, message: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    const customerId = new mongoose.Types.ObjectId(customer.id);
    const Review = await getEcomReview();

    let review = null;
    if (reviewId && mongoose.Types.ObjectId.isValid(reviewId)) {
      review = await Review.findById(reviewId);
    }
    if (!review && productId) {
      review = await Review.findOne({
        productId,
        $or: [
          { customerId },
          { customerId: customer.id },
        ],
      });
    }

    const finalImages = [...existingImages, ...newImageUrls].slice(0, 5);

    if (!review) {
      review = await Review.create({
        productId: productId || 'product',
        customerId,
        customerName: customer.name || 'Anonymous',
        rating,
        title: title?.trim() || '',
        body: body?.trim() || '',
        images: finalImages,
        isVerifiedBuyer: true,
        isApproved: true,
        isEdited: true,
      });
    } else {
      review.rating = rating;
      review.title = title?.trim() || '';
      review.body = body?.trim() || '';
      review.images = finalImages;
      review.isEdited = true;
      await review.save();
    }

    // Recalculate product aggregate rating
    const prodId = review.productId;
    const allReviews = await Review.find({ productId: prodId, isApproved: true }).lean();
    const newAvg = allReviews.length > 0
      ? Math.round((allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length) * 10) / 10
      : rating;

    const Product = await getEcomProduct();
    await Product.updateOne(
      { $or: [{ id: prodId }, { slug: prodId }] },
      { rating: newAvg, reviewsCount: allReviews.length }
    );

    return Response.json({
      success: true,
      review: {
        _id: review._id,
        customerId: String(review.customerId),
        customerName: review.customerName,
        rating: review.rating,
        title: review.title,
        body: review.body,
        images: review.images || [],
        isVerifiedBuyer: review.isVerifiedBuyer,
        isEdited: review.isEdited || false,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
    });
  } catch (err) {
    console.error('[store-reviews PUT]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
