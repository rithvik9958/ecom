import { NextResponse } from 'next/server';
import PaymentSetting from '@/app/models/PaymentSetting';
import { requirePermission } from '@/app/lib/auth';
import { connectDB } from '@/app/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { error } = await requirePermission(request, 'settings');
  if (error) return error;

  await connectDB();

  try {
    let settings = await PaymentSetting.findOne();
    if (!settings) {
      settings = await PaymentSetting.create({
        upiId: process.env.MERCHANT_UPI_ID || 'dummyupi@ybl',
        merchantName: process.env.MERCHANT_NAME || 'City Shop Demo',
        merchantCode: process.env.MERCHANT_CODE || '0000',
      });
    }
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  const { error } = await requirePermission(request, 'settings');
  if (error) return error;

  await connectDB();

  try {
    const data = await request.json();
    
    const updateFields = {};
    if (data.upiId !== undefined) updateFields.upiId = data.upiId;
    if (data.merchantName !== undefined) updateFields.merchantName = data.merchantName;
    if (data.merchantCode !== undefined) updateFields.merchantCode = data.merchantCode;
    if (data.showDeliveryTagline !== undefined) updateFields.showDeliveryTagline = Boolean(data.showDeliveryTagline);
    if (data.deliveryTaglineText !== undefined) updateFields.deliveryTaglineText = data.deliveryTaglineText;
    if (data.deliveryTaglineIcon !== undefined) updateFields.deliveryTaglineIcon = data.deliveryTaglineIcon;
    if (data.deliveryTaglineColor !== undefined) updateFields.deliveryTaglineColor = data.deliveryTaglineColor;
    if (data.infoSectionHeading !== undefined) updateFields.infoSectionHeading = data.infoSectionHeading;
    if (data.infoSectionIcon !== undefined) updateFields.infoSectionIcon = data.infoSectionIcon;
    if (data.infoSectionColor !== undefined) updateFields.infoSectionColor = data.infoSectionColor;
    if (data.showTrustBadges !== undefined) updateFields.showTrustBadges = Boolean(data.showTrustBadges);
    if (Array.isArray(data.trustBadges)) {
      updateFields.trustBadges = data.trustBadges.map(b => ({
        iconType: b.iconType === 'image' ? 'image' : 'icon',
        icon: b.icon || 'ShieldCheck',
        image: b.image || '',
        title: b.title || '',
        subtitle: b.subtitle || '',
        color: b.color || '#16a34a',
        isActive: b.isActive !== false
      }));
    }
    if (data.catalogFilterSettings !== undefined) {
      updateFields.catalogFilterSettings = data.catalogFilterSettings;
    }
    if (data.recentlyViewedSettings !== undefined) {
      updateFields.recentlyViewedSettings = {
        badgeText: data.recentlyViewedSettings?.badgeText || 'Pick Up Where You Left Off',
        title: data.recentlyViewedSettings?.title || 'Recently Viewed by You',
        subtitle: data.recentlyViewedSettings?.subtitle || 'Products you browsed during your recent visits'
      };
    }
    if (data.supportPhone !== undefined) updateFields.supportPhone = data.supportPhone;
    if (data.whatsappNumber !== undefined) updateFields.whatsappNumber = data.whatsappNumber;
    if (data.supportEmail !== undefined) updateFields.supportEmail = data.supportEmail;
    if (data.enableAiHelp !== undefined) updateFields.enableAiHelp = Boolean(data.enableAiHelp);

    if (data.relatedProductsSettings !== undefined) {
      updateFields.relatedProductsSettings = {
        badgeText: data.relatedProductsSettings?.badgeText || 'Handpicked Recommendations',
        title: data.relatedProductsSettings?.title || 'You Might Also Like',
        subtitle: data.relatedProductsSettings?.subtitle || 'Curated choices and similar gifts loved by customers'
      };
    }

    const settings = await PaymentSetting.findOneAndUpdate(
      {},
      { $set: updateFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, settings, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    return NextResponse.json({ success: false, message: 'Failed to update settings' }, { status: 500 });
  }
}
