import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import CategoryClient from './CategoryClient';

export async function generateStaticParams() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/store-categories`);
    if (!res.ok) return [];
    const cats = await res.json();
    return cats.map((c) => ({
      slug: c.slug,
    }));
  } catch {
    return [];
  }
}

async function getCategory(slug) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/store-categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const cats = await res.json();
    return cats.find((c) => c.slug === slug) || null;
  } catch { return null; }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return { title: 'Category Not Found' };
  return {
    title:       `${cat.title} | EShop`,
    description: `Shop the best ${cat.title} — hand-picked products with fast delivery across India.`,
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/store-categories`, { next: { revalidate: 3600 } });
  let allCats = [];
  if (res.ok) {
    allCats = await res.json();
  }
  
  const cat = allCats.find((c) => c.slug === slug);
  if (!cat) notFound();

  return (
    <Suspense fallback={<div style={{ height:'50vh' }} />}>
      <CategoryClient category={cat} allCategories={allCats} />
    </Suspense>
  );
}
