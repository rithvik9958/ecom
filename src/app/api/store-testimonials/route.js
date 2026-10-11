export const dynamic = 'force-dynamic';
import { getTestimonialModel } from '@/app/models/Testimonial';
import { getEcomTestimonialPage } from '@/app/models/EcomTestimonialPage';
import { getEcomCategory } from '@/app/models/EcomCategory';

const SEED_TESTIMONIALS = [
  {
    name: 'Ananya Deshmukh',
    city: 'Mumbai, Maharashtra',
    rating: 5,
    category: 'Flowers',
    item: 'Grand Velvet 50 Red Rose Bouquet',
    text: 'The roses were absolutely breathtaking and fragrant! Arrived at 11:58 PM on my anniversary right on the dot. My husband was genuinely wowed. City Shop is our go-to forever for celebratory milestones!',
    likes: 24,
    isVerified: true,
    isApproved: true
  },
  {
    name: 'Vikramaditya Singhania',
    city: 'New Delhi, Delhi',
    rating: 5,
    category: 'Cakes',
    item: 'Belgian Dark Truffle Signature Cake (1 Kg)',
    text: 'Hands down the most delicious chocolate cake we have ever ordered online. Perfectly moist, not overly sweet, and the custom chocolate plaque message was written with master craftsmanship.',
    likes: 19,
    isVerified: true,
    isApproved: true
  },
  {
    name: 'Dr. Priya Nambiar',
    city: 'Bengaluru, Karnataka',
    rating: 5,
    category: 'Hampers',
    item: 'Imperial Royal Gourmet Festive Hamper',
    text: 'Sent this hamper to my parents for their anniversary in Kerala. The packaging, wooden box, imported dry fruits, and orchid bouquet were 10/10 luxury. Truly premium standard of gifting!',
    likes: 31,
    isVerified: true,
    isApproved: true
  },
  {
    name: 'Rohit Kulkarni',
    city: 'Pune, Maharashtra',
    rating: 5,
    category: 'Express Delivery',
    item: 'Sunshine Yellow Lily Bouquet with Truffle Pastry',
    text: 'I used the 2-Hour Express Delivery service because I forgot a colleague’s birthday. Within 90 minutes of placing the order, it was handed over at his office desk in pristine condition. Incredible speed!',
    likes: 14,
    isVerified: true,
    isApproved: true
  },
  {
    name: 'Kavita Iyer (HR Director)',
    city: 'Hyderabad, Telangana',
    rating: 5,
    category: 'Corporate Gifting',
    item: 'Custom Branded Employee Welcome Gift Kits (150 Units)',
    text: 'We partnered with City Shop for our quarterly employee milestone gifts across 12 cities in India. Flawless logistical coordination, bespoke packaging with our company logo, and zero damaged items.',
    likes: 42,
    isVerified: true,
    isApproved: true
  },
  {
    name: 'Manish Chawla',
    city: 'Gurugram, Haryana',
    rating: 5,
    category: 'Cakes',
    item: 'Fresh Strawberry Mascarpone Cheesecake',
    text: 'Fresh berries, light creamy texture, and arrived in a cooled temperature box. Everyone at our family dinner asked where we got this cake. Highly recommended for special occasions!',
    likes: 16,
    isVerified: true,
    isApproved: true
  },
  {
    name: 'Sneha Roy Chowdhury',
    city: 'Kolkata, West Bengal',
    rating: 5,
    category: 'Flowers',
    item: 'Exotic Pastel Dutch Carnations & Orchids',
    text: 'Ordered this for my grandmother’s 80th birthday. The arrangement was so fresh that the blooms lasted over a full week in her living room. Thank you for making her day so special!',
    likes: 27,
    isVerified: true,
    isApproved: true
  },
  {
    name: 'Aditya & Ritu Mehra',
    city: 'Jaipur, Rajasthan',
    rating: 5,
    category: 'Hampers',
    item: 'Bespoke Silver Jubilee Celebration Hamper',
    text: 'Every item inside the hamper was curated with exquisite taste—from the artisanal candles to the Belgian dark truffles. The recipient sent photos immediately and was overjoyed!',
    likes: 38,
    isVerified: true,
    isApproved: true
  },
  {
    name: 'Sameer Sheikh',
    city: 'Chennai, Tamil Nadu',
    rating: 5,
    category: 'Express Delivery',
    item: 'Midnight Surprise Midnight Orchid Glass Vase',
    text: 'Flawless midnight delivery in Chennai at 12:00 AM sharp! The delivery associate was polite and maintained the surprise element. Truly outstanding customer support throughout.',
    likes: 21,
    isVerified: true,
    isApproved: true
  }
];

export async function GET() {
  try {
    const Testimonial = await getTestimonialModel();
    const TestimonialPage = await getEcomTestimonialPage();

    let count = await Testimonial.countDocuments();

    // Auto-seed initial default testimonials if empty
    if (count === 0) {
      await Testimonial.insertMany(SEED_TESTIMONIALS);
    }

    const [testimonials, pageConfig] = await Promise.all([
      Testimonial.find({ isApproved: true }).sort({ createdAt: -1 }).lean(),
      TestimonialPage.findOne({ key: 'global_testimonials' }).lean()
    ]);

    let config = pageConfig;
    if (!config) {
      config = await TestimonialPage.create({ key: 'global_testimonials' });
    }

    // Fetch dynamic active categories from store
    let dynamicCategories = [];
    try {
      const Category = await getEcomCategory();
      const dbCategories = await Category.find({ isActive: true }).select('title name slug').sort({ order: 1, title: 1 }).lean();
      dynamicCategories = dbCategories.map((c) => ({
        id: c.slug || c.name || c.title,
        label: c.title || c.name || c.slug
      }));
    } catch (catErr) {
      console.warn('Error fetching dynamic categories for testimonials:', catErr);
    }

    if (!dynamicCategories || dynamicCategories.length === 0) {
      dynamicCategories = [
        { id: 'Flowers', label: 'Fresh Flowers' },
        { id: 'Cakes', label: 'Artisan Cakes' },
        { id: 'Hampers', label: 'Luxury Hampers' },
        { id: 'Express Delivery', label: 'Midnight & Express' },
        { id: 'Corporate Gifting', label: 'Corporate Gifting' }
      ];
    }

    return Response.json({
      success: true,
      testimonials: testimonials || [],
      config,
      categories: dynamicCategories
    });
  } catch (error) {
    console.error('[store-testimonials GET error]:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, city, rating, category, item, text } = body;

    if (!name || !city || !text) {
      return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const Testimonial = await getTestimonialModel();
    const created = await Testimonial.create({
      name: name.trim(),
      city: city.trim(),
      rating: Number(rating) || 5,
      category: category || 'General',
      item: (item || '').trim(),
      text: text.trim(),
      likes: 1,
      isVerified: true,
      isApproved: true
    });

    return Response.json({
      success: true,
      testimonial: created,
      message: 'Review published successfully'
    });
  } catch (error) {
    console.error('[store-testimonials POST error]:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, action } = await req.json();
    if (!id) {
      return Response.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const increment = action === 'unlike' ? -1 : 1;
    const Testimonial = await getTestimonialModel();
    const updated = await Testimonial.findByIdAndUpdate(
      id,
      { $inc: { likes: increment } },
      { new: true }
    );

    return Response.json({ success: true, testimonial: updated });
  } catch (error) {
    console.error('[store-testimonials PUT error]:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
