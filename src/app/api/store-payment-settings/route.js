import { NextResponse } from 'next/server';
import PaymentSetting from '@/app/models/PaymentSetting';
import { connectDB } from '@/app/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  try {
    const settings = await PaymentSetting.findOne();
    const defaultBadges = [
      { icon: 'ShieldCheck', title: '100% Quality', subtitle: 'Guaranteed Fresh', color: '#16a34a', isActive: true },
      { icon: 'Zap', title: 'Fast Shipping', subtitle: 'Express Slots', color: '#f59e0b', isActive: true },
      { icon: 'RotateCcw', title: 'Easy Support', subtitle: 'Dedicated Help', color: '#3b82f6', isActive: true }
    ];
    return NextResponse.json({
      success: true,
      data: {
        upiId: settings?.upiId || process.env.MERCHANT_UPI_ID || 'dummyupi@ybl',
        merchantName: settings?.merchantName || process.env.MERCHANT_NAME || 'City Shop Demo',
        merchantCode: settings?.merchantCode || process.env.MERCHANT_CODE || '0000',
        showDeliveryTagline: settings?.showDeliveryTagline !== undefined ? settings.showDeliveryTagline : true,
        deliveryTaglineText: settings?.deliveryTaglineText || 'Free Standard Delivery above ₹{freeAbove}',
        deliveryTaglineIcon: settings?.deliveryTaglineIcon || 'Truck',
        deliveryTaglineColor: settings?.deliveryTaglineColor || '#16a34a',
        infoSectionHeading: settings?.infoSectionHeading || 'Product Information & Care',
        infoSectionIcon: settings?.infoSectionIcon || 'ShieldCheck',
        infoSectionColor: settings?.infoSectionColor || '#111111',
        showTrustBadges: settings?.showTrustBadges !== undefined ? settings.showTrustBadges : true,
        trustBadges: settings?.trustBadges?.length ? settings.trustBadges : defaultBadges,
        catalogFilterSettings: settings?.catalogFilterSettings || {
          showCategoryFilter: true,
          showPriceFilter: true,
          showRatingFilter: true,
          showInStockFilter: true,
          showDiscountFilter: true,
          showTagsFilter: true,
          priceRanges: settings?.catalogFilterSettings?.priceRanges || [
            { label: 'Under ₹499', min: 0, max: 499 },
            { label: '₹500 - ₹999', min: 500, max: 999 },
            { label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
            { label: '₹2,000 & Above', min: 2000, max: 999999 }
          ],
          customFilters: settings?.catalogFilterSettings?.customFilters || []
        },
        recentlyViewedSettings: settings?.recentlyViewedSettings || {
          badgeText: 'Pick Up Where You Left Off',
          title: 'Recently Viewed by You',
          subtitle: 'Products you browsed during your recent visits'
        },
        relatedProductsSettings: settings?.relatedProductsSettings || {
          badgeText: 'Handpicked Recommendations',
          title: 'You Might Also Like',
          subtitle: 'Curated choices and similar gifts loved by customers'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching frontend payment settings:', error);
    return NextResponse.json({
      success: true,
      data: {
        upiId: 'dummyupi@ybl',
        merchantName: 'City Shop Demo',
        merchantCode: '0000',
        showTrustBadges: true,
        trustBadges: [
          { icon: 'ShieldCheck', title: '100% Quality', subtitle: 'Guaranteed Fresh', color: '#16a34a', isActive: true },
          { icon: 'Zap', title: 'Fast Shipping', subtitle: 'Express Slots', color: '#f59e0b', isActive: true },
          { icon: 'RotateCcw', title: 'Easy Support', subtitle: 'Dedicated Help', color: '#3b82f6', isActive: true }
        ],
        catalogFilterSettings: {
          showCategoryFilter: true,
          showPriceFilter: true,
          showRatingFilter: true,
          showInStockFilter: true,
          showDiscountFilter: true,
          showTagsFilter: true,
          priceRanges: [
            { label: 'Under ₹499', min: 0, max: 499 },
            { label: '₹500 - ₹999', min: 500, max: 999 },
            { label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
            { label: '₹2,000 & Above', min: 2000, max: 999999 }
          ],
          customFilters: []
        }
      }
    });
  }
}

