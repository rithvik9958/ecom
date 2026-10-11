import { NextResponse } from 'next/server';
import { getNewsletterSubscriberModel } from '@/app/models/NewsletterSubscriber';
import { getEcomFooter } from '@/app/models/EcomFooter';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Fetch current footer configuration for discount code
    let discountCode = 'WELCOME150';
    try {
      const FooterModel = await getEcomFooter();
      const footer = await FooterModel.findOne({ key: 'global_footer' }).lean();
      if (footer?.newsletter?.discountCode) {
        discountCode = footer.newsletter.discountCode;
      }
    } catch (e) {
      console.warn('Could not fetch footer discount code, using fallback:', e.message);
    }

    const SubscriberModel = await getNewsletterSubscriberModel();

    // Check if already subscribed
    const existing = await SubscriberModel.findOne({ email: cleanEmail });
    if (existing) {
      if (existing.status === 'unsubscribed') {
        existing.status = 'active';
        existing.discountCode = discountCode;
        await existing.save();
        return NextResponse.json({
          success: true,
          isNew: false,
          discountCode,
          message: `Welcome back! 🎉 Use voucher code ${discountCode} at checkout for your discount.`
        });
      }

      return NextResponse.json({
        success: true,
        isNew: false,
        discountCode: existing.discountCode || discountCode,
        message: `You're already subscribed! 🎉 Use voucher code ${existing.discountCode || discountCode} at checkout.`
      });
    }

    // Save new subscriber to database
    await SubscriberModel.create({
      email: cleanEmail,
      status: 'active',
      discountCode,
      source: 'storefront_footer'
    });

    return NextResponse.json({
      success: true,
      isNew: true,
      discountCode,
      message: `Subscribed successfully! 🎉 Use voucher code ${discountCode} at checkout for ₹150 OFF.`
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const SubscriberModel = await getNewsletterSubscriberModel();
    const subscribers = await SubscriberModel.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      success: true,
      count: subscribers.length,
      subscribers
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
