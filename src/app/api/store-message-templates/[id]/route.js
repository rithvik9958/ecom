export const dynamic = 'force-dynamic';
import { getEcomMessageTemplate } from '@/app/models/EcomMessageTemplate';

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id || id === 'undefined') return Response.json({ success: false, message: 'ID required' }, { status: 400 });

    const body = await request.json();
    const MessageTemplate = getEcomMessageTemplate();

    const updated = await MessageTemplate.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      return Response.json({ success: false, message: 'Template not found' }, { status: 404 });
    }

    return Response.json({ success: true, template: updated });
  } catch (error) {
    console.error('[store-message-templates PUT]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id || id === 'undefined') return Response.json({ success: false, message: 'ID required' }, { status: 400 });

    const MessageTemplate = getEcomMessageTemplate();
    const deleted = await MessageTemplate.findByIdAndDelete(id);
    
    if (!deleted) {
      return Response.json({ success: false, message: 'Template not found' }, { status: 404 });
    }

    return Response.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.error('[store-message-templates DELETE]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
