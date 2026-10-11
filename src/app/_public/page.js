import Image from "next/image";
import BlogSection from "src/components/features/blog/BlogSection";
import ContactSection from "src/components/features/contact/ContactSection";
import ChooseUs from "src/components/features/home/ChooseUs";
import CompanyOverview from "src/components/features/home/CompanyOverview";
import CTASection from "src/components/features/home/CTASection";
import HeroSlider from "src/components/features/home/HeroSlider";
import MottoSection from "src/components/features/home/MottoSection";
import ProductSection from "src/components/features/home/ProductSection";
import SegmentsSection from "src/components/features/home/SegmentsSection";
import CertificationsGrid from "src/components/features/home/CertificationsGrid";
import TestimonialSection from "src/components/features/testimonial/TestimonialSection";

import { cache } from "react";

import { connectDB } from "@/app/lib/config";
import Banner from "@/app/models/Banner";
import HomeAbout from "@/app/models/HomeAbout";
import WhyChoose from "@/app/models/whyChoose";
import Category from "@/app/models/Category";
import Blog from "@/app/models/Blog";
import Cta from "@/app/models/Cta";
import Othercta from "@/app/models/Othercta";
import Certification from "@/app/models/Certification";
import CompanyCertification from "@/app/models/CompanyCertification";
import Work from "@/app/models/Work";
import HomeExtra from "@/app/models/HomeExtra";
import HomeSeo from "@/app/models/HomeSeo";

import ContactPageModel from "@/app/models/ContactPage";

// ISR: rebuild home page at most every 5 minutes
export const revalidate = 300;

// Deduplicate the HomeSeo DB call — used in both generateMetadata and Home()
const getHomeSeo = cache(async () => {
  await connectDB();
  return HomeSeo.findOne({ pageSlug: 'home' }).lean();
});


export async function generateMetadata() {
  const seoData = await getHomeSeo();


  if (!seoData) {
    return {
      title: "Jindal Metals & Alloys Ltd | Thin & Ultra-Thin Precision Stainless Steel Strips",
      description: "Specializing in the manufacturing of cold rolled precision stainless steel strips. Over 4 decades of stability, trust, and quality excellence.",
    };
  }

  return {
    title: seoData.title || "Jindal Metals & Alloys Ltd",
    description: seoData.metaDescription || "",
    keywords: seoData.metaKeywords?.length ? seoData.metaKeywords : undefined,

    alternates: {
      canonical: seoData.canonicalUrl || "https://jindalmetal.com",
    },
    openGraph: {
      title: seoData.ogTitle || seoData.title,
      description: seoData.ogDescription || seoData.metaDescription,
      images: seoData.ogImage ? [{ url: seoData.ogImage, width: 1200, height: 630, alt: seoData.title }] : [],
      type: 'website',
      url: seoData.canonicalUrl || "https://jindalmetal.com",
    },
    twitter: {
      card: ['summary', 'summary_large_image'].includes(seoData.twitterCard)
        ? seoData.twitterCard
        : "summary_large_image",
      title: seoData.ogTitle || seoData.title,
      description: seoData.ogDescription || seoData.metaDescription,
      images: seoData.ogImage ? [seoData.ogImage] : [],
    },
    robots: seoData.robots || "index, follow",
  };
}

export default async function Home() {
  const seoData = await getHomeSeo();

  // Fetch all remaining home page data concurrently
  const [
    banners,
    homeAbout,
    whyChooseList,
    cta,
    otherCta,
    certifications,
    works,
    homeExtra,
    contactPageData,
    categoriesList,
    blogsList,
    companyCertifications
  ] = await Promise.all([
    Banner.find({ status: "active" }).sort({ sort: 1 }).lean(),
    HomeAbout.findOne().lean(),
    WhyChoose.find({ status: "active" }).sort({ sort: 1 }).lean(),
    Cta.findOne().lean(),
    Othercta.findOne().lean(),
    Certification.find({ status: "active" }).sort({ sort: 1 }).lean(),
    Work.find({ status: "active" }).sort({ sort: 1 }).lean(),
    HomeExtra.findOne().lean(),
    ContactPageModel.findOne().lean(),
    Category.find({ isActive: true }).sort({ sort: 1 }).lean(),
    Blog.find({ isPublished: true }).sort({ publishedAt: -1, createdAt: -1 }).limit(6).lean(),
    CompanyCertification.find({ status: "active" }).sort({ sort: 1, createdAt: -1 }).lean(),
  ]);


  // Deep serialize MongoDB documents for Client Components to prevent warning
  const serialize = (doc) => {
    if (!doc) return null;
    return JSON.parse(JSON.stringify(doc));
  };

  let schemaObj = seoData?.schema || null;
  if (!schemaObj || Object.keys(schemaObj).length === 0) {
    schemaObj = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "name": "Jindal Metals & Alloys Ltd",
          "url": "https://jindalmetal.com",
          "logo": "https://jindalmetal.com/images/logo.png",
          "description": "Specializing in the manufacturing of cold rolled precision stainless steel strips."
        },
        {
          "@type": "WebSite",
          "name": "Jindal Metals & Alloys Ltd",
          "url": "https://jindalmetal.com"
        }
      ]
    };
  }
  const schemaJson = JSON.stringify(schemaObj);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJson }}
      />
      {seoData?.h1 && (
        <h1 className="visually-hidden" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)' }}>
          {seoData.h1}
        </h1>
      )}
      <div>
        <HeroSlider slides={serialize(banners)} certifications={serialize(certifications)} />
        
        <CompanyOverview data={serialize(homeAbout)} />
        {/* <ChooseUs features={serialize(whyChooseList)} extra={serialize(homeExtra)} /> */}
        
        <ProductSection data={serialize(categoriesList)} extra={serialize(homeExtra)} />
        
        {/* Pass empty certifications to MottoSection since it's extracted now */}
        <MottoSection data={serialize(otherCta)} />
        
        <SegmentsSection segments={serialize(works)} extra={serialize(homeExtra)} />
        <CertificationsGrid certifications={serialize(companyCertifications)} extra={serialize(homeExtra)} />
        {/* <CTASection data={serialize(cta)} extra={serialize(homeExtra)} /> */}
        
        {/* <BlogSection data={serialize(blogsList)} /> */}
        
        {/* <TestimonialSection /> */}
        <ContactSection data={serialize(contactPageData)} />
      </div>
    </>
  );
}
