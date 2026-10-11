import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import CategoryClient from './CategoryClient';
import { getEcomCategory } from '@/app/models/EcomCategory';

async function getAllCategories() {
  try {
    const Category = await getEcomCategory();
    const cats = await Category.find({ isActive: true }).sort({ order: 1, title: 1 }).lean();
    return JSON.parse(JSON.stringify(cats || []));
  } catch (err) {
    console.error('Failed to load categories:', err);
    return [];
  }
}

export async function generateStaticParams() {
  const cats = await getAllCategories();
  return cats.map((c) => ({
    slug: c.slug,
  }));
}

async function getCategory(slug) {
  const cats = await getAllCategories();
  return cats.find((c) => c.slug === slug) || null;
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
  const allCats = await getAllCategories();
  const cat = allCats.find((c) => c.slug === slug);
  if (!cat) notFound();

  return (
    <Suspense fallback={<div style={{ height:'50vh' }} />}>
      <CategoryClient category={cat} allCategories={allCats} />
    </Suspense>
  );
}
