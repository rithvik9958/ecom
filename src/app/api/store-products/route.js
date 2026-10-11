export const dynamic = 'force-dynamic';
import { getEcomProduct } from '@/app/models/EcomProduct';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category        = searchParams.get('category') || '';
    const search          = searchParams.get('search') || '';
    const limit           = parseInt(searchParams.get('limit') || '0', 10);
    const skip            = parseInt(searchParams.get('skip') || '0', 10);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const homepageSection = searchParams.get('homepageSection') || '';
    const homepageTab     = searchParams.get('homepageTab') || '';
    const sort            = searchParams.get('sort') || '';
    const minPrice        = searchParams.get('minPrice');
    const maxPrice        = searchParams.get('maxPrice');
    const minRating       = searchParams.get('minRating');
    const inStockOnly     = searchParams.get('inStock') === 'true';
    const discountOnly    = searchParams.get('discountOnly') === 'true';
    const tags            = searchParams.get('tags') || '';
    const attributesJSON  = searchParams.get('attributes');
    const getAttributes   = searchParams.get('getAttributes') === 'true';

    const query = {};
    if (!includeInactive) query.isActive = true;
    if (category) query.category = category;
    if (search)   query.title = { $regex: search, $options: 'i' };
    if (homepageSection) query.homepageSection = homepageSection;
    if (homepageTab) query.homepageTabs = homepageTab;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (inStockOnly) {
      query.stock = { $gt: 0 };
    }

    if (minRating) {
      const numRating = Number(minRating);
      query.$or = [
        { rating: { $gte: numRating } },
        { manualRating: { $gte: numRating } }
      ];
    }

    if (discountOnly) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { discount: { $gt: 0 } },
          { $expr: { $gt: ["$mrp", "$price"] } }
        ]
      });
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagArray.length > 0) {
        query.tags = { $in: tagArray };
      }
    }
    
    if (attributesJSON) {
      try {
        const parsedAttr = JSON.parse(attributesJSON);
        const attrConditions = [];
        for (const [key, values] of Object.entries(parsedAttr)) {
          if (Array.isArray(values) && values.length > 0) {
            attrConditions.push({
              $or: [
                { attributes: { $elemMatch: { key: key, value: { $in: values } } } },
                { [`customAttributes.${key}`]: { $in: values } },
                { [key]: { $in: values } },
                { tags: { $in: values } }
              ]
            });
          } else if (typeof values === 'string' && values) {
            attrConditions.push({
              $or: [
                { attributes: { $elemMatch: { key: key, value: values } } },
                { [`customAttributes.${key}`]: values },
                { [key]: values },
                { tags: values }
              ]
            });
          }
        }
        if (attrConditions.length > 0) {
          query.$and = query.$and ? [...query.$and, ...attrConditions] : attrConditions;
        }
      } catch (e) {}
    }

    let sortObj = {};
    if (sort === 'price-asc')  sortObj = { price: 1 };
    else if (sort === 'price-desc') sortObj = { price: -1 };
    else if (sort === 'newest') sortObj = { createdAt: -1 };
    else if (sort === 'rating') sortObj = { rating: -1 };
    else if (sort === 'popular') sortObj = { reviewsCount: -1 };

    const Product = await getEcomProduct();
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);
    
    let availableAttributes = [];
    if (getAttributes && category) {
      const agg = await Product.aggregate([
        { $match: { category: category, isActive: true } },
        { $unwind: "$attributes" },
        {
          $group: {
            _id: "$attributes.key",
            values: { $addToSet: "$attributes.value" }
          }
        },
        { $project: { _id: 0, title: "$_id", options: "$values" } }
      ]);
      
      availableAttributes = agg.map(a => ({
        title: a.title,
        options: a.options.filter(Boolean).map(val => ({ label: val, value: val }))
      }));
    }

    return Response.json({ products, total, skip, limit, availableAttributes });
  } catch (error) {
    console.error('[store-products GET]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
