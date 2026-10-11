import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import ProductDetails from "@/components/features/products/ProductDetails";
import SectionPageLayout from "@/components/features/sections/SectionPageLayout";
import { connectDB } from "@/app/lib/config";
import Product from "@/app/models/Product";
import Category from "@/app/models/Category";
import Section from "@/app/models/Section";
import About from "@/app/models/About";
import Redirect from "@/app/models/Redirect";
import ErrorLog from "@/app/models/ErrorLog";
import { headers } from "next/headers";

// ─── Dynamic SEO Metadata ───────────────────────────────────────
export const revalidate = 3600; // 1 hour ISR

export async function generateStaticParams() {
  await connectDB();
  const products = await Product.find({ isActive: true }).populate('category', 'slug').select('slug').lean();
  
  // To keep it simple, we pre-render products. Section pages could also be pre-rendered here.
  return products
    .filter(p => p.category?.slug)
    .map(p => ({ category: p.category.slug, slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { category: categorySlug, slug } = await params;
  
  await connectDB();
  const product = await Product.findOne({ slug, isActive: true }).populate('category', 'slug name').lean();

  if (product && product.category?.slug === categorySlug) {
    return {
      title: product.metatag || `${product.name} | Jindal Metals & Alloys Ltd`,
      description: product.metaDescription || product.description?.replace(/<[^>]+>/g, '').substring(0, 160),
      keywords: product.metakeywords?.length ? product.metakeywords : undefined,
      robots: product.robots || 'index, follow',
      openGraph: {
        title: product.ogTitle || product.metatag || product.name,
        description: product.ogDescription || product.metaDescription || product.description?.replace(/<[^>]+>/g, '').substring(0, 160),
        images: product.image ? [{ url: product.image, width: 1200, height: 630 }] : [],
      },
      twitter: {
        card: product.twitterCard || 'summary_large_image',
        title: product.ogTitle || product.metatag || product.name,
        description: product.ogDescription || product.metaDescription || product.description?.replace(/<[^>]+>/g, '').substring(0, 160),
        images: [product.image].filter(Boolean),
      },
      alternates: {
        canonical: product.canonicalUrl 
            ? (product.canonicalUrl.startsWith('http') ? product.canonicalUrl : `https://jindalmetal.com${product.canonicalUrl}`)
            : `https://jindalmetal.com/${product.category?.slug}/${product.slug}`,
      },

    };
  }

  // Fallback to Inner Page Section logic
  const section = await Section.findOne({ slug: categorySlug, isActive: true }).lean();
  if (section) {
    const page = await About.findOne({ section: section.slug, slug, isActive: true }).lean();
    if (page) {
      const title = page.metatag || `${page.title} | Jindal Metals & Alloys Ltd`;
      const description = page.metaDescription || "Learn about Jindal Metals & Alloys Ltd";

      return {
        title,
        description,
        keywords: page.metakeywords?.length ? page.metakeywords : undefined,
        alternates: {
          canonical: page.canonicalUrl 
              ? (page.canonicalUrl.startsWith('http') ? page.canonicalUrl : `https://jindalmetal.com${page.canonicalUrl}`)
              : `https://jindalmetal.com/${section.slug}/${slug}`,
        },

        openGraph: {
          title: page.ogTitle || title,
          description: page.ogDescription || description,
          images: page.ogImage ? [{ url: page.ogImage, width: 1200, height: 630 }] : (page.bannerImage ? [{ url: page.bannerImage, width: 1200, height: 630 }] : []),
        },
        twitter: {
          card: ['summary', 'summary_large_image'].includes(page.twitterCard) ? page.twitterCard : 'summary_large_image',
        },
        robots: page.robots || 'index, follow',
      };
    }
  }

  return {};
}

export default async function DynamicSlugPage({ params }) {
  const { category: categorySlug, slug } = await params;
  
  await connectDB();
  const product = await Product.findOne({ slug, isActive: true }).populate('category', 'slug name').lean();

  if (product && product.category?.slug === categorySlug) {
    const relatedProducts = await Product.find({ 
      category: product.category._id, 
      _id: { $ne: product._id },
      isActive: true 
    }).limit(4).lean();

    const safeProduct = {
      ...product,
      _id: product._id.toString(),
      detailImage: product.detailImage || '',
      breadcrumb: product.breadcrumb || '',
      category: { ...product.category, _id: product.category._id.toString() }
    };

    const safeRelatedProducts = relatedProducts.map(rp => ({
      ...rp,
      _id: rp._id.toString(),
      category: rp.category.toString()
    }));

    const schemaMarkup = product.schemaMarkup && Object.keys(product.schemaMarkup).length > 0 
        ? product.schemaMarkup 
        : {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "image": product.image ? [`https://jindalmetal.com${product.image}`] : [],
            "description": product.metaDescription || product.description?.replace(/<[^>]+>/g, '').substring(0, 160),
            "brand": { "@type": "Brand", "name": "Jindal Metals & Alloys Ltd" },
            "offers": {
              "@type": "Offer",
              "availability": "https://schema.org/InStock",
              "priceCurrency": "INR",
              "seller": { "@type": "Organization", "name": "Jindal Metals & Alloys Ltd" }
            },
            "manufacturer": {
              "@type": "Organization",
              "name": "Jindal Metals & Alloys Ltd",
              "url": "https://jindalmetal.com"
            }
          };


    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }} />
        <PageHeader
          title={product.breadcrumb || product.name}
          bgImage={product.image || "/images/thin.jpeg"}
          breadcrumb={[
            { name: "Home", href: "/" },
            { name: product.category.name, href: `/${product.category.slug}` },
            { name: product.breadcrumb || product.name },
          ]}
        />
        <ProductDetails product={safeProduct} relatedProducts={safeRelatedProducts} category={categorySlug} />
      </>
    );
  }

  // Fallback to Inner Page Section logic
  const section = await Section.findOne({ slug: categorySlug, isActive: true }).lean();
  if (section) {
    const page = await About.findOne({ section: section.slug, slug, isActive: true }).lean();
    if (page) {
      const allPages = await About.find({ section: section.slug, isActive: true }).sort({ sort: 1 }).select('title slug').lean();
      const nav = allPages.map(p => ({ title: p.title, slug: p.slug }));
      
      let schemaHtml = null;
      if (page.schemaMarkup && Object.keys(page.schemaMarkup).length > 0) {
        schemaHtml = { __html: JSON.stringify(page.schemaMarkup) };
      }

      return (
        <>
          {schemaHtml && <script type="application/ld+json" dangerouslySetInnerHTML={schemaHtml} />}
          <SectionPageLayout
            sectionKey={section.slug}
            sectionLabel={section.name}
            nav={nav}
            page={page}
            breadcrumb={[
              { name: "Home", href: "/" },
              { name: section.name, href: nav.length > 0 ? `/${section.slug}/${nav[0].slug}` : `/${section.slug}` },
              { name: page.title },
            ]}
          />
        </>
      );
    }
  }

  // --- Handle 404 Tracking & Custom Redirects ---
  const reqPath = `/${categorySlug}/${slug}`;
  
  // 1. Check if a custom redirect exists for this path
  const customRedirect = await Redirect.findOne({ from: reqPath, isActive: true }).lean();
  if (customRedirect) {
    redirect(customRedirect.to, customRedirect.type === 301 ? 'permanent' : 'push');
  }

  // 2. If no redirect, log the 404 to the Error Monitor
  const headersList = await headers();
  const referrer = headersList.get('referer') || '';
  const userAgent = headersList.get('user-agent') || '';
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';
  
  // Avoid duplicate spam (check if logged in last minute)
  const recentLog = await ErrorLog.findOne({ path: reqPath, createdAt: { $gte: new Date(Date.now() - 60000) } });
  if (!recentLog) {
      await ErrorLog.create({ path: reqPath, referrer, userAgent, ip, statusCode: 404 });
  }

  notFound();
}
