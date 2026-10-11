import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import { getEcomProduct } from '@/app/models/EcomProduct';
import { getEcomAddon } from '@/app/models/EcomAddon';
import { getEcomAddonCategory } from '@/app/models/EcomAddonCategory';

function getImageUrl(url) {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${url}`;
}

export async function generateStaticParams() {
  try {
    const Product = await getEcomProduct();
    const products = await Product.find({ isActive: true }).select('id').limit(1000).lean();
    return (products || []).map((product) => ({
      id: product.id,
    }));
  } catch {
    return [];
  }
}

async function getProduct(id) {
  try {
    const Product = await getEcomProduct();
    await getEcomAddon();
    await getEcomAddonCategory();

    const rawId = id ? decodeURIComponent(id).trim() : '';
    const queryConditions = [{ id: rawId }, { slug: rawId }];
    if (rawId && rawId.length === 24 && /^[0-9a-fA-F]{24}$/.test(rawId)) {
      queryConditions.push({ _id: rawId });
    }

    const product = await Product.findOne({
      $or: queryConditions,
    }).populate({ 
      path: 'addOns', 
      model: 'EcomAddon',
      populate: { path: 'category', select: 'name image', model: 'EcomAddonCategory' } 
    }).lean();

    if (!product) return null;
    return JSON.parse(JSON.stringify(product));
  } catch (err) {
    console.error('Error fetching product:', err);
    return null;
  }
}

async function getRelated(category, excludeId) {
  try {
    const Product = await getEcomProduct();
    const rawExclude = excludeId ? String(excludeId) : '';
    const products = await Product.find({
      category,
      isActive: true,
      $and: [
        { id: { $ne: rawExclude } },
        { slug: { $ne: rawExclude } }
      ]
    }).limit(4).lean();

    return JSON.parse(JSON.stringify(products || []));
  } catch (err) {
    console.error('Error fetching related products:', err);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: 'Product Not Found' };

  const displayPrice = product.discountedPrice > 0 ? product.discountedPrice : product.price;

  return {
    title:       `${product.title} | EShop`,
    description: product.description?.replace(/<[^>]+>/g, '').slice(0, 160) || `Buy ${product.title} at ₹${displayPrice}`,
    openGraph: {
      title:  product.title,
      images: product.thumbnail ? [{ url: getImageUrl(product.thumbnail) }] : [],
      type:   'website',
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const related = product.category ? await getRelated(product.category, product.id) : [];

  const displayPrice = product.discountedPrice > 0 ? product.discountedPrice : product.price;
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "image": product.thumbnail ? [getImageUrl(product.thumbnail)] : [],
    "description": product.description?.replace(/<[^>]+>/g, '').slice(0, 160) || `Buy ${product.title}`,
    "sku": product.id,
    "offers": {
      "@type": "Offer",
      "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/products/${product.id}`,
      "priceCurrency": "INR",
      "price": displayPrice,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "EShop"
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetailClient product={product} related={related} />
    </>
  );
}
