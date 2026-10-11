export const dynamic = 'force-dynamic';
import { getEcomFaq } from '@/app/models/EcomFaq';
import { getEcomFaqPage } from '@/app/models/EcomFaqPage';

export async function GET() {
  try {
    const Faq = await getEcomFaq();
    const FaqPage = await getEcomFaqPage();

    const [faqs, pageConfig] = await Promise.all([
      Faq.find().sort({ order: 1, createdAt: 1 }).lean(),
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
    console.error('[admin/faqs GET error]:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { question, answer, category, order, isActive } = body;

    if (!question || !answer) {
      return Response.json({ success: false, message: 'Question and Answer are required' }, { status: 400 });
    }

    const Faq = await getEcomFaq();
    const created = await Faq.create({
      question: question.trim(),
      answer: answer.trim(),
      category: category || 'ordering',
      order: Number(order) || 0,
      isActive: isActive !== false
    });

    return Response.json({
      success: true,
      faq: created,
      message: 'FAQ question created successfully'
    });
  } catch (error) {
    console.error('[admin/faqs POST error]:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { action, id, config, categories, ...faqData } = body;

    // 1. Save Page Configuration (Hero, Support Desk, SEO)
    if (action === 'save_settings' || config) {
      const FaqPage = await getEcomFaqPage();
      const updatedConfig = await FaqPage.findOneAndUpdate(
        { key: 'global_faqs' },
        { $set: config },
        { new: true, upsert: true }
      );
      return Response.json({
        success: true,
        config: updatedConfig,
        message: 'FAQ page settings saved successfully'
      });
    }

    // 2. Save FAQ Categories list
    if (action === 'save_categories' && Array.isArray(categories)) {
      const FaqPage = await getEcomFaqPage();
      const updatedConfig = await FaqPage.findOneAndUpdate(
        { key: 'global_faqs' },
        { $set: { categories } },
        { new: true, upsert: true }
      );
      return Response.json({
        success: true,
        categories: updatedConfig.categories,
        message: 'FAQ categories updated successfully'
      });
    }

    // 3. Update single FAQ question
    if (!id) {
      return Response.json({ success: false, message: 'FAQ ID is required' }, { status: 400 });
    }

    const Faq = await getEcomFaq();
    const updated = await Faq.findByIdAndUpdate(
      id,
      { $set: faqData },
      { new: true }
    );

    if (!updated) {
      return Response.json({ success: false, message: 'FAQ not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      faq: updated,
      message: 'FAQ updated successfully'
    });
  } catch (error) {
    console.error('[admin/faqs PUT error]:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, message: 'FAQ ID is required' }, { status: 400 });
    }

    const Faq = await getEcomFaq();
    await Faq.findByIdAndDelete(id);

    return Response.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('[admin/faqs DELETE error]:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
