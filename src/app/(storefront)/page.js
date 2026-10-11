import { Suspense } from 'react';
import HomeClient from './HomeClient';
import { getEcomTheme } from '@/app/models/EcomTheme';
import { getEcomBanner } from '@/app/models/EcomBanner';
import { getEcomCategory } from '@/app/models/EcomCategory';
import { getEcomHomepage } from '@/app/models/EcomHomepage';

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
  try {
    const [Banner, Category, Homepage] = await Promise.all([
      getEcomBanner(),
      getEcomCategory(),
      getEcomHomepage(),
    ]);

    const [banners, categories, homepage] = await Promise.all([
      Banner.find({ isActive: true }).sort({ order: 1 }).lean(),
      Category.find({ isActive: true }).sort({ order: 1, title: 1 }).lean(),
      Homepage.findOne({ key: 'homepage' }).lean(),
    ]);

    return {
      banners: JSON.parse(JSON.stringify(banners || [])),
      categories: JSON.parse(JSON.stringify(categories || [])),
      sections: JSON.parse(JSON.stringify(homepage?.sections || [])),
    };
  } catch (err) {
    console.error('Failed to load homepage data:', err);
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
