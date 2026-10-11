export const dynamic = 'force-dynamic';
import { getEcomFaq } from '@/app/models/EcomFaq';
import { getEcomFaqPage } from '@/app/models/EcomFaqPage';

const INITIAL_SEED_FAQS = [
  {
    category: 'ordering',
    question: 'How do I place an order on City Shop?',
    answer:
      'Simply browse our catalog, select your desired gift, select date and time slot (for perishables), enter recipient pincode & address, and complete checkout via UPI, Card, Net Banking, or Wallet.',
    order: 1,
    isActive: true,
    helpfulCount: 42
  },
  {
    category: 'ordering',
    question: 'How do I track my active order in real-time?',
    answer:
      'Visit our Track Order page or go to My Account > Orders. Enter your Order ID (e.g. CS-98721) to see live status updates from packing to dispatch and out-for-delivery.',
    order: 2,
    isActive: true,
    helpfulCount: 29
  },
  {
    category: 'ordering',
    question: 'Can I add a personalized message card or photo with my gift?',
    answer:
      'Yes! During checkout, you can add a complimentary personalized message card. For personalized items (photo cakes, mugs, frames), you can upload high-resolution photos directly on the product page.',
    order: 3,
    isActive: true,
    helpfulCount: 35
  },
  {
    category: 'delivery',
    question: 'What delivery options and time slots are available?',
    answer:
      'We offer: Standard Delivery (9 AM – 9 PM), 2-Hour Express Delivery, Fixed Time Slot (2-hour selected window), Early Morning (6 AM – 9 AM), and Midnight Surprise Delivery (11:00 PM – 11:59 PM).',
    order: 4,
    isActive: true,
    helpfulCount: 51
  },
  {
    category: 'delivery',
    question: 'What happens if the recipient is unavailable at the delivery address?',
    answer:
      'Our delivery executive will attempt to contact the recipient and sender. If unavailable, we will coordinate a convenient safe drop with neighbors/reception or reschedule redelivery once within 24 hours.',
    order: 5,
    isActive: true,
    helpfulCount: 18
  },
  {
    category: 'delivery',
    question: 'Do you deliver to hospitals, hotels, and business offices?',
    answer:
      'Yes! Please ensure you provide room numbers, department, ward, or desk details so our logistics team can hand over the surprise safely to the designated contact.',
    order: 6,
    isActive: true,
    helpfulCount: 23
  },
  {
    category: 'refunds',
    question: 'What is your return & replacement policy for fresh flowers and cakes?',
    answer:
      'Due to perishability, fresh flowers and cakes cannot be returned after delivery. However, if your order arrives damaged, wilted, or incorrect, raise a claim within 4 hours of delivery on our Returns Desk with photos for an immediate free replacement or refund.',
    order: 7,
    isActive: true,
    helpfulCount: 64
  },
  {
    category: 'refunds',
    question: 'How long does it take to receive an approved refund?',
    answer:
      'Refunds to Store Wallet are processed instantly. Bank / UPI / Card refunds reflect in your original payment account within 3 to 5 business days.',
    order: 8,
    isActive: true,
    helpfulCount: 38
  },
  {
    category: 'payments',
    question: 'Which payment methods are accepted?',
    answer:
      'We accept all major Indian & International Credit/Debit Cards (VISA, Mastercard, RuPay, Amex), UPI (Google Pay, PhonePe, Paytm), Net Banking across 50+ banks, and City Shop Wallet.',
    order: 9,
    isActive: true,
    helpfulCount: 19
  },
  {
    category: 'payments',
    question: 'How do I apply a discount coupon code?',
    answer:
      'On the Cart & Checkout page, enter your promo code in the "Apply Coupon" box and click Apply. The discount will instantly recalculate your total bill.',
    order: 10,
    isActive: true,
    helpfulCount: 27
  },
  {
    category: 'corporate',
    question: 'Do you offer customized corporate gifting and employee hampers?',
    answer:
      'Yes! We create bespoke employee welcome kits, festive Diwali/New Year hampers, luxury client gifts, and milestone awards. Contact our corporate desk at corporate@cityshop.com for volume pricing.',
    order: 11,
    isActive: true,
    helpfulCount: 45
  },
  {
    category: 'corporate',
    question: 'Can corporate orders include custom branding and company logos?',
    answer:
      'Absolutely. We provide custom laser engraving, branded gift sleeves, embossed boxes, and custom greeting cards tailored to your brand guidelines.',
    order: 12,
    isActive: true,
    helpfulCount: 31
  }
];

export async function GET() {
  try {
    const Faq = await getEcomFaq();
    const FaqPage = await getEcomFaqPage();

    let count = await Faq.countDocuments();
    if (count === 0) {
      await Faq.insertMany(INITIAL_SEED_FAQS);
    }

    const [faqs, pageConfig] = await Promise.all([
      Faq.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean(),
      FaqPage.findOne({ key: 'global_faqs' }).lean()
    ]);

    let config = pageConfig;
    if (!config) {
      config = await FaqPage.create({ key: 'global_faqs' });
    }

    return Response.json({
      success: true,
      faqs: faqs || [],
      config
    });
  } catch (error) {
    console.error('[store-faqs GET error]:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, action } = await req.json();
    if (!id) {
      return Response.json({ success: false, message: 'FAQ ID is required' }, { status: 400 });
    }

    const increment = action === 'unlike' ? -1 : 1;
    const Faq = await getEcomFaq();
    const updated = await Faq.findByIdAndUpdate(
      id,
      { $inc: { helpfulCount: increment } },
      { new: true }
    );

    return Response.json({ success: true, faq: updated });
  } catch (error) {
    console.error('[store-faqs PUT error]:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
