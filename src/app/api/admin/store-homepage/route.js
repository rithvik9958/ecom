export const dynamic = 'force-dynamic';
import { getEcomHomepage } from '@/app/models/EcomHomepage';
import { requirePermission } from '@/app/lib/auth';
import { uploadFile, isUploadFile } from '@/lib/upload';

export async function GET(req) {
  const { error } = await requirePermission(req, 'settings', 'read');
  if (error) return error;
  try {
    const Homepage = await getEcomHomepage();
    let content = await Homepage.findOne({ key: 'homepage' });
    if (!content) content = await Homepage.create({ key: 'homepage' });
    return Response.json(content);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { error } = await requirePermission(req, 'settings', 'update');
  if (error) return error;

  try {
    const formData = await req.formData();
    const sectionsStr = formData.get('sections');
    if (!sectionsStr) return Response.json({ error: 'Missing sections' }, { status: 400 });

    let sections = JSON.parse(sectionsStr);

    // Process image uploads.
    // Key format: img_{sectionId}_{arrayField}_{itemIndex}_{imageField}
    // e.g.  img_abc12345_cards_0_image
    //       img_abc12345_slides_2_image
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith('img_') || !isUploadFile(value)) continue;
      const parts = key.split('_');
      if (parts.length < 5) continue;

      // Process both 1-level deep (e.g. img_abc_slides_0_image) 
      // and 2-level deep (e.g. img_abc_videos_0_products_0_image)
      if (parts.length === 5) {
        const [, sectionId, arrayField, rawIdx, imageField] = parts;
        const itemIndex = parseInt(rawIdx);
        if (isNaN(itemIndex)) continue;

        const url = await uploadFile(value, 'ecom', 'homepage');
        const si = sections.findIndex(s => s.id === sectionId);
        if (si === -1) continue;
        const arr = sections[si].config[arrayField];
        if (!Array.isArray(arr) || !arr[itemIndex]) continue;
        arr[itemIndex][imageField] = url;
      } else if (parts.length === 7) {
        const [, sectionId, arrayField1, rawIdx1, arrayField2, rawIdx2, imageField] = parts;
        const itemIndex1 = parseInt(rawIdx1);
        const itemIndex2 = parseInt(rawIdx2);
        if (isNaN(itemIndex1) || isNaN(itemIndex2)) continue;

        const url = await uploadFile(value, 'ecom', 'homepage');
        const si = sections.findIndex(s => s.id === sectionId);
        if (si === -1) continue;
        
        const arr1 = sections[si].config[arrayField1];
        if (!Array.isArray(arr1) || !arr1[itemIndex1]) continue;
        
        const arr2 = arr1[itemIndex1][arrayField2];
        if (!Array.isArray(arr2) || !arr2[itemIndex2]) continue;
        
        arr2[itemIndex2][imageField] = url;
      }
    }

    const Homepage = await getEcomHomepage();
    let content = await Homepage.findOne({ key: 'homepage' });
    if (!content) content = new Homepage({ key: 'homepage' });

    content.sections = sections;
    content.markModified('sections'); // required for Mixed type
    await content.save();

    return Response.json({ success: true, sections: content.sections });
  } catch (err) {
    console.error('[admin store-homepage POST]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
