import { Suspense } from 'react';
import HomeClient from './HomeClient';
import { getEcomTheme } from '@/app/models/EcomTheme';

export async function generateMetadata() {
  let brandName = 'MyCart';
  try {
    const Theme = await getEcomTheme();
    const theme = await Theme.findOne({ id: 'global' }).lean();
    if (theme?.brandName) brandName = theme.brandName;
  } catch (e) {}

  return {
    title: {
      absolute: brandName
    },
    description:
      `Welcome to ${brandName}. Discover premium products, fast delivery, and exceptional quality.`,
    alternates: { canonical: '/' },
    openGraph: {
      title: brandName,
      description: `Welcome to ${brandName}.`,
      type: 'website',
    },
  };
}

async function getHomepageData() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const opts = { next: { revalidate: 300 } };

  try {
    const [bannersRes, categoriesRes, homepageRes] = await Promise.allSettled([
      fetch(`${base}/api/store-banners`, opts),
      fetch(`${base}/api/store-categories`, opts),
      fetch(`${base}/api/store-homepage`, opts),
    ]);

    const homepage =
      homepageRes.status === 'fulfilled' && homepageRes.value.ok
        ? await homepageRes.value.json()
        : null;

    return {
      banners:    bannersRes.status    === 'fulfilled' && bannersRes.value.ok    ? await bannersRes.value.json()    : [],
      categories: categoriesRes.status === 'fulfilled' && categoriesRes.value.ok ? await categoriesRes.value.json() : [],
      sections:   homepage?.sections || [],
    };
  } catch {
    return { banners: [], categories: [], sections: [] };
  }
}

export default async function HomePage() {
  const data = await getHomepageData();

  return (
    <Suspense fallback={<div style={{ height: 480, background: '#e8f4ed' }} />}>
      <HomeClient {...data} />
    </Suspense>
  );
}
