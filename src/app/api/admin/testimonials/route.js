export const dynamic = 'force-dynamic';
import { getTestimonialModel } from '@/app/models/Testimonial';
import { getEcomTestimonialPage } from '@/app/models/EcomTestimonialPage';
import { getEcomCategory } from '@/app/models/EcomCategory';

export async function GET() {
  try {
    const Testimonial = await getTestimonialModel();
    const TestimonialPage = await getEcomTestimonialPage();

    const [testimonials, pageConfig] = await Promise.all([
      Testimonial.find().sort({ createdAt: -1 }).lean(),
      TestimonialPage.findOne({ key: 'global_testimonials' }).lean()
    ]);

    let config = pageConfig;
    if (!config) {
      config = await TestimonialPage.create({ key: 'global_testimonials' });
    }

    // Dynamic Categories
    let categories = [];
    try {
      const Category = await getEcomCategory();
      const dbCats = await Category.find({ isActive: true }).select('title name slug').sort({ order: 1, title: 1 }).lean();
      categories = dbCats.map((c) => ({
        id: c.slug || c.name || c.title,
        label: c.title || c.name || c.slug
      }));
    } catch (err) {
      console.warn('Error loading categories in admin testimonials:', err);
    }

    return Response.json({
      success: true,
      testimonials: testimonials || [],
      config,
      categories: categories || []
    });
  } catch (error) {
    console.error('[admin/testimonials GET error]:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, city, rating, category, item, text, likes, isVerified, isApproved } = body;

    if (!name || !city || !text) {
      return Response.json({ success: false, message: 'Name, City and Review Text are required' }, { status: 400 });
    }

    const Testimonial = await getTestimonialModel();
    const created = await Testimonial.create({
      name: name.trim(),
      city: city.trim(),
      rating: Number(rating) || 5,
      category: category || 'General',
      item: (item || '').trim(),
      text: text.trim(),
      likes: Number(likes) || 0,
      isVerified: isVerified !== false,
      isApproved: isApproved !== false
    });

    return Response.json({
      success: true,
      testimonial: created,
      message: 'Testimonial created successfully'
    });
  } catch (error) {
    console.error('[admin/testimonials POST error]:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { action, id, config, ...testimonialData } = body;

    // 1. If saving page configuration (Hero, Metrics, SEO)
    if (action === 'save_settings' || config) {
      const TestimonialPage = await getEcomTestimonialPage();
      const updatedConfig = await TestimonialPage.findOneAndUpdate(
        { key: 'global_testimonials' },
        { $set: config },
        { new: true, upsert: true }
      );
      return Response.json({
        success: true,
        config: updatedConfig,
        message: 'Testimonials page settings saved successfully'
      });
    }

    // 2. If toggling status or updating specific testimonial
    if (!id) {
      return Response.json({ success: false, message: 'Testimonial ID is required' }, { status: 400 });
    }

    const Testimonial = await getTestimonialModel();
    const updated = await Testimonial.findByIdAndUpdate(
      id,
      { $set: testimonialData },
      { new: true }
    );

    if (!updated) {
      return Response.json({ success: false, message: 'Testimonial not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      testimonial: updated,
      message: 'Testimonial updated successfully'
    });
  } catch (error) {
    console.error('[admin/testimonials PUT error]:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const Testimonial = await getTestimonialModel();
    await Testimonial.findByIdAndDelete(id);

    return Response.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('[admin/testimonials DELETE error]:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
