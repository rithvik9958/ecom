export const dynamic = 'force-dynamic';
import { getEcomMessageTemplate } from '@/app/models/EcomMessageTemplate';

export async function GET() {
  try {
    const MessageTemplate = getEcomMessageTemplate();
    
    // Seed default templates if empty
    let templates = await MessageTemplate.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    
    if (templates.length === 0) {
      const defaultTemplates = [
        { title: 'Birthday', message: 'Wishing you a very Happy Birthday! May your day be filled with joy and laughter.' },
        { title: 'Anniversary', message: 'Happy Anniversary! Wishing you many more years of love and happiness together.' },
        { title: 'Congratulations', message: 'Congratulations on your amazing achievement! So proud of you.' },
        { title: 'Thank You', message: 'Thank you so much for everything. Your kindness means the world to me.' },
        { title: 'Get Well Soon', message: 'Sending you healing thoughts and a quick recovery. Get well soon!' },
        { title: 'Love', message: 'Sending you all my love today and always. You mean everything to me.' }
      ];
      await MessageTemplate.insertMany(defaultTemplates);
      templates = await MessageTemplate.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    }

    const formatted = templates.map(t => ({
      ...t,
      _id: t._id?.toString()
    }));

    return Response.json({ success: true, templates: formatted });
  } catch (error) {
    console.error('[store-message-templates GET]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Basic implementation for later dashboard usage
    const body = await request.json();
    const { title, message } = body;

    if (!title || !message) {
      return Response.json({ success: false, message: 'Title and message are required' }, { status: 400 });
    }

    const MessageTemplate = getEcomMessageTemplate();
    const created = await MessageTemplate.create({ title, message });

    return Response.json({ success: true, template: created }, { status: 201 });
  } catch (error) {
    console.error('[store-message-templates POST]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
