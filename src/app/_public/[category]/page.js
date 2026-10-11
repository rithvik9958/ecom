import Image from "next/image";
import { notFound } from "next/navigation";
import CategorySection from "@/components/features/category/CategorySection";
import { connectDB } from "@/app/lib/config";
import Category from "@/app/models/Category";
import Product from "@/app/models/Product";

export async function generateMetadata({ params }) {
    const { category: categorySlug } = await params;

    await connectDB();

    // 1. Check Custom Page first
    const { default: CustomPage } = await import("@/app/models/CustomPage");
    const customPage = await CustomPage.findOne({ slug: categorySlug, isActive: true }).lean();
    if (customPage) {
        return {
            title: customPage.metatag || `${customPage.title} | Jindal Metals & Alloys Ltd`,
            description: customPage.metaDescription || '',
            keywords: customPage.metakeywords?.length ? customPage.metakeywords : undefined,
            robots: customPage.robots || 'index, follow',
            openGraph: {
                title: customPage.ogTitle || customPage.metatag || customPage.title,
                description: customPage.ogDescription || customPage.metaDescription || '',
                images: customPage.bannerImage ? [{ url: customPage.bannerImage, width: 1200, height: 630 }] : [],
            },
            twitter: {
                card: customPage.twitterCard || 'summary_large_image',
                title: customPage.ogTitle || customPage.metatag || customPage.title,
                description: customPage.ogDescription || customPage.metaDescription || '',
                images: customPage.bannerImage ? [customPage.bannerImage] : [],
            },
            alternates: {
                canonical: customPage.canonicalUrl || `/${customPage.slug}`,
            },
        };
    }

    // 2. Fallback to Category
    const category = await Category.findOne({ slug: categorySlug, isActive: true }).lean();

    if (!category) {
        return {};
    }

    return {
        title: category.metatag || `${category.name} | Jindal Metals & Alloys Ltd`,
        description: category.metaDescription || category.description,
        keywords: category.metakeywords?.length ? category.metakeywords : undefined,
        robots: category.robots || 'index, follow',

        openGraph: {
            title: category.ogTitle || category.metatag || `${category.name} | Jindal Metals & Alloys Ltd`,
            description: category.ogDescription || category.metaDescription || category.description,
            images: [
                {
                    url: category.image,
                    width: 1200,
                    height: 630,
                },
            ],
        },

        twitter: {
            card: category.twitterCard || 'summary_large_image',
            title: category.ogTitle || category.metatag || category.name,
            description: category.ogDescription || category.metaDescription || category.description,
            images: [category.image],
        },

        alternates: {
            canonical: category.canonicalUrl || `/${category.slug}`,
        },
    };
}


export default async function CategoryPage({ params }) {
    const { category: categorySlug } = await params;

    await connectDB();

    // 1. Check Custom Page first
    const { default: CustomPage } = await import("@/app/models/CustomPage");
    const customPage = await CustomPage.findOne({ slug: categorySlug, isActive: true }).lean();
    if (customPage) {
        const { default: PageHeader } = await import("@/components/layout/PageHeader");
        const breadcrumb = [
            { name: 'Home', href: '/' },
            { name: customPage.title }
        ];
        return (
            <main className="custom-page-main bg-slate-50/50 min-h-screen">
                {customPage.schemaMarkup && Object.keys(customPage.schemaMarkup).length > 0 && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(customPage.schemaMarkup) }}
                    />
                )}
                <PageHeader
                    title={customPage.title}
                    bgImage={customPage.bannerImage || '/images/default-banner.jpg'}
                    breadcrumb={breadcrumb}
                />
                <section className="py-16 md:py-24 relative overflow-hidden py-5">
                    {/* Background Accents */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
                        <div className="absolute top-40 -left-20 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl"></div>
                    </div>

                    <div className="container relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
                        <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.04)]  border-gray-100 p-6 sm:p-10 md:p-16">
                            <div
                                className="rich-text-content"
                                dangerouslySetInnerHTML={{ __html: customPage.content }}
                            />
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    // 2. Fallback to Category
    const category = await Category.findOne({ slug: categorySlug, isActive: true }).lean();

    if (!category) {
        // Check if it's an Inner Page Section
        const { default: Section } = await import("@/app/models/Section");
        const section = await Section.findOne({ slug: categorySlug, isActive: true }).lean();
        if (section) {
            const { default: About } = await import("@/app/models/About");
            const firstPage = await About.findOne({ section: section.slug, isActive: true }).sort({ sort: 1 }).lean();
            if (firstPage) {
                const { redirect } = await import("next/navigation");
                redirect(`/${section.slug}/${firstPage.slug}`);
            }
        }

        // --- Handle 404 Tracking & Custom Redirects ---
        const { default: Redirect } = await import("@/app/models/Redirect");
        const { default: ErrorLog } = await import("@/app/models/ErrorLog");
        const reqPath = `/${categorySlug}`;

        // 1. Check if a custom redirect exists for this path
        const customRedirect = await Redirect.findOne({ from: reqPath, isActive: true }).lean();
        if (customRedirect) {
            const { redirect } = await import("next/navigation");
            redirect(customRedirect.to, customRedirect.type === 301 ? 'permanent' : 'push');
        }

        // 2. If no redirect, log the 404 to the Error Monitor
        const { headers } = await import("next/headers");
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

    // Pass the category name and slug to the client component if needed.
    // Also, we need to pass products associated with this category.
    const products = await Product.find({ category: category._id, isActive: true }).sort({ sort: 1 }).lean();

    // Map _id to string for Client Components serialization
    const safeCategory = {
        ...category,
        _id: category._id.toString(),
        breadcrumb: category.breadcrumb || ''
    };

    const safeProducts = products.map(p => ({
        ...p,
        _id: p._id.toString(),
        category: p.category.toString()
    }));

    // Construct JSON-LD Schema
    const schemaMarkup = category.schemaMarkup && Object.keys(category.schemaMarkup).length > 0
        ? category.schemaMarkup
        : {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": category.name,
            "description": category.description,
            "url": `https://jindalmetal.com/${category.slug}`
        };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
            />

            <section className="category-hero-section position-relative">
                <div className="hero-banner cat-banner position-relative">
                    {category.image && (
                        <Image
                            src={category.image}
                            alt={category.alt || category.name}
                            width={1920}
                            height={700}
                            className="img-fluid"
                            priority
                        />
                    )}

                    <div className="category-title">
                        <h1>{category.breadcrumb || category.name}</h1>
                    </div>
                </div>
            </section>

            <section className="home1-counter-section">
                <div className="container">
                    <div className="counter-wrap">
                        {category.description && (
                            <div
                                className="category-content prose max-w-none"
                                dangerouslySetInnerHTML={{ __html: category.description }}
                            />
                        )}
                    </div>
                </div>
            </section>

            {/* Passing the populated products to the CategorySection */}
            <CategorySection category={safeCategory} products={safeProducts} />
        </>
    );
}
