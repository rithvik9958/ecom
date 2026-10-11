import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/config';
import CustomPage from '@/app/models/CustomPage';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGES = [
  {
    title: 'Terms & Conditions',
    slug: 'terms',
    content: `<h2>1. Introduction & Acceptance</h2><p>Welcome to <strong>City Shop</strong>. By accessing or using our website, services, and applications, you agree to be bound by these Terms and Conditions. If you do not agree to all terms, please refrain from using our services.</p><h2>2. Orders & Fulfillment</h2><p>All orders placed on City Shop are subject to acceptance and product availability. While we strive to maintain complete inventory accuracy, perishable items (such as flowers and gourmet baked items) may occasionally be substituted with equal or superior alternatives of equivalent value upon prior customer intimation.</p><h2>3. Pricing & Payments</h2><p>All prices quoted on the store are in Indian Rupees (INR) and include applicable GST unless otherwise specified. We support 256-bit SSL encrypted transactions through trusted gateways including UPI, Cards, Net Banking, and Digital Wallets.</p><h2>4. Intellectual Property</h2><p>All content, branding, trademarks, logos, and visual assets displayed on this website are the proprietary property of City Shop E-Retail Private Limited and protected by Indian copyright and intellectual property laws.</p>`,
    isActive: true,
    sort: 1
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy',
    content: `<h2>1. Data Collection & Usage</h2><p>At <strong>City Shop</strong>, protecting your privacy is our top priority. We collect customer information—including name, delivery addresses, contact numbers, and email IDs—strictly to process orders, deliver timely status updates, and provide personalized gifting recommendations.</p><h2>2. Payment Information Protection</h2><p>We do not store complete credit/debit card numbers or CVV codes on our servers. All financial transactions are processed securely through PCI-DSS compliant payment gateways.</p><h2>3. Cookies & Analytics</h2><p>Our platform uses essential session cookies and anonymous analytical tracking to improve navigation speed, remember shopping cart items, and optimize user experience.</p><h2>4. Information Sharing & Third Parties</h2><p>We never sell, rent, or trade your personal information. Delivery addresses and recipient phone numbers are shared solely with certified courier and logistics partners to execute last-mile doorstep delivery.</p>`,
    isActive: true,
    sort: 2
  },
  {
    title: 'Return & Refund Policy',
    slug: 'returns-policy',
    content: `<h2>1. Perishable Items (Flowers, Cakes & Plants)</h2><p>Due to the perishable nature of fresh flowers, gourmet cakes, and live plants, returns are not accepted once delivered in good condition. If your order arrives damaged, wilted, or incorrect, please raise a claim within <strong>4 hours of delivery</strong> along with clear unboxing photographs through our <a href="/user/returns">Returns & Resolution Desk</a>.</p><h2>2. Non-Perishable Gifts & Keepsakes</h2><p>Non-perishable items (such as watches, personalized photo frames, dry gift hampers, and jewelry) can be returned or exchanged within <strong>48 hours of delivery</strong> provided they are unused and in original packaging.</p><h2>3. Refund Timelines</h2><p>Approved refunds are processed to your original payment method or instant Store Wallet within <strong>3 to 5 business days</strong>.</p>`,
    isActive: true,
    sort: 3
  },
  {
    title: 'Shipping & Delivery Policy',
    slug: 'shipping-policy',
    content: `<h2>1. Delivery Coverage & Slots</h2><p>City Shop services over <strong>19,000+ PIN codes</strong> across India. We offer multiple delivery options: <strong>Standard Courier Delivery</strong> (2-4 business days), <strong>Same-Day Hand Delivery</strong>, <strong>2-Hour Express Delivery</strong>, and <strong>Midnight Surprise Delivery (11:00 PM – 11:59 PM)</strong>.</p><h2>2. Accurate Recipient Details</h2><p>To ensure guaranteed on-time delivery, please verify the recipient’s complete postal address, PIN code, and active mobile number during checkout. In cases where the recipient is unavailable or the premises are locked, our delivery executive will attempt redelivery once after phone coordination.</p><h2>3. International Deliveries</h2><p>International shipments to UAE, USA, UK, Singapore, and Canada are fulfilled via express international air couriers with live tracking provided via SMS and Email.</p>`,
    isActive: true,
    sort: 4
  },
  {
    title: 'Terms of Use & Disclaimer',
    slug: 'disclaimer',
    content: `<h2>1. Product Representation</h2><p>Product images displayed on the website are representative. While our master florists and bakers strive for exact replication, slight variations in floral shade, arrangement styling, or cake decoration may occur due to natural seasonal availability and handcrafting.</p><h2>2. Service Availability & Downtime</h2><p>City Shop endeavors to maintain uninterrupted website availability. However, we are not liable for temporary service interruptions due to scheduled maintenance, telecommunication failures, or external server events beyond our reasonable control.</p><h2>3. Limitation of Liability</h2><p>City Shop shall not be liable for any indirect, incidental, or consequential damages arising out of the use or inability to use our platform or products beyond the total invoice value of the order in dispute.</p>`,
    isActive: true,
    sort: 5
  },
  {
    title: 'Security & Compliance',
    slug: 'security',
    content: `<h2>1. Enterprise-Grade Security</h2><p>City Shop employs end-to-end 256-bit Transport Layer Security (TLS) encryption across all web traffic and API endpoints. Our infrastructure is hosted on resilient cloud servers with automated DDoS protection and continuous intrusion monitoring.</p><h2>2. Compliance & Standards</h2><p>We strictly comply with Indian Information Technology (IT) Act, 2000, Consumer Protection (E-Commerce) Rules, 2020, and Reserve Bank of India (RBI) digital payment security guidelines.</p>`,
    isActive: true,
    sort: 6
  }
];

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    // Auto-seed default policy pages if database has no custom pages
    const count = await CustomPage.countDocuments();
    if (count === 0) {
      await CustomPage.insertMany(DEFAULT_PAGES);
    }

    if (slug) {
      let page = await CustomPage.findOne({ slug, isActive: true }).lean();
      
      // If not in db, check if it matches one of our defaults
      if (!page) {
        const defaultPage = DEFAULT_PAGES.find(p => p.slug === slug);
        if (defaultPage) {
          page = await CustomPage.findOneAndUpdate(
            { slug },
            { $setOnInsert: defaultPage },
            { upsert: true, new: true }
          ).lean();
        }
      }

      if (!page) {
        return NextResponse.json({ success: false, message: 'Page not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, page });
    }

    // Return list of all active pages for navigation
    const pages = await CustomPage.find({ isActive: true }).sort({ sort: 1, createdAt: -1 }).select('title slug').lean();
    return NextResponse.json({ success: true, pages });
  } catch (error) {
    console.error('Error fetching custom pages:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
