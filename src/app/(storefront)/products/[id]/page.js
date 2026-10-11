import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

function getImageUrl(url) {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${url}`;
}

export async function generateStaticParams() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    // Fetch all products (limit high enough or no limit if backend supports it)
    const res = await fetch(`${base}/api/store-products?limit=1000`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []).map((product) => ({
      id: product.id,
    }));
  } catch {
    return [];
  }
}

async function getProduct(id) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res  = await fetch(`${base}/api/store-products/${id}`, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getRelated(category, excludeId) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res  = await fetch(`${base}/api/store-products?category=${encodeURIComponent(category)}&limit=6`, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []).filter((p) => p.id !== excludeId && p._id !== excludeId).slice(0, 4);
  } catch { return []; }
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
