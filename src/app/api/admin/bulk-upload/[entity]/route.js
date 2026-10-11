import { requirePermission } from '@/app/lib/auth';
import { getEcomProduct } from '@/app/models/EcomProduct';
import { getEcomCategory } from '@/app/models/EcomCategory';

// Simple CSV parser
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    // This regex splits by comma but ignores commas inside quotes
    const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const obj = {};
    headers.forEach((header, index) => {
      let val = values[index] ? values[index].trim() : '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1); // remove quotes
      }
      obj[header] = val;
    });
    results.push(obj);
  }
  return results;
}

export async function POST(request, { params }) {
  const entity = params.entity;
  
  // Basic permission check
  const { error } = await requirePermission(request, entity === 'categories' ? 'categories' : 'products', 'create');
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const text = await file.text();
    const parsedData = parseCSV(text);

    if (parsedData.length === 0) {
      return Response.json({ error: 'No valid data found in CSV' }, { status: 400 });
    }

    let insertedCount = 0;

    if (entity === 'products') {
      const Product = await getEcomProduct();
      const productsToInsert = parsedData.map(row => ({
        title: row.title || row.name || 'Unnamed Product',
        category: row.category || '',
        price: Number(row.price) || 0,
        mrp: Number(row.mrp) || Number(row.price) || 0,
        stock: Number(row.stock) || 0,
        isActive: row.isActive ? row.isActive.toLowerCase() === 'true' : true,
      }));
      await Product.insertMany(productsToInsert);
      insertedCount = productsToInsert.length;
    } else if (entity === 'categories') {
      const Category = await getEcomCategory();
      const categoriesToInsert = parsedData.map(row => ({
        title: row.title || row.name || 'Unnamed Category',
        slug: row.slug || (row.title || 'unnamed-category').toLowerCase().replace(/\s+/g, '-'),
        isActive: row.isActive ? row.isActive.toLowerCase() === 'true' : true,
      }));
      await Category.insertMany(categoriesToInsert);
      insertedCount = categoriesToInsert.length;
    } else {
      return Response.json({ error: 'Invalid entity' }, { status: 400 });
    }

    return Response.json({ message: `Successfully imported ${insertedCount} ${entity}` });
  } catch (error) {
    console.error(`Bulk Upload Error [${entity}]:`, error);
    return Response.json({ error: 'Failed to process bulk upload', details: error.message }, { status: 500 });
  }
}
