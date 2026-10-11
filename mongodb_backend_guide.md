# MongoDB Backend & Dynamic SEO Guide
**Jindal Metals & Alloys Ltd**

This document provides the complete Mongoose schema structures for your backend, along with a detailed explanation of how to handle SEO, Meta Tags, and Structured Data dynamically through your API.

---

## PART 1: Mongoose Models & Schemas

Use these exact schemas when building your backend to ensure compatibility with your Next.js frontend.

### 1. Product Schema
```javascript
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  slug:             { type: String, required: true, unique: true },
  categorySlug:     { type: String, required: true, index: true }, 
  category:         { type: String, required: true }, 
  title:            { type: String, required: true },
  image:            { type: String }, 
  description:      { type: String }, 
  content:          { type: String }, 
  
  // Embedded SEO Object
  seo: {
    title:          { type: String },
    description:    { type: String },
    keywords:       [{ type: String }],
    ogImage:        { type: String },
    canonical:      { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
```

### 2. Page Schema (About, Quality, Infrastructure, etc.)
```javascript
const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
  sectionKey:   { type: String, required: true, index: true }, 
  slug:         { type: String, required: true }, 
  title:        { type: String, required: true },
  description:  { type: String },
  bannerImage:  { type: String },
  content:      { type: String }, 
  
  // Embedded SEO Object
  seo: {
    title:       { type: String },
    description: { type: String },
  }
}, { timestamps: true });

PageSchema.index({ sectionKey: 1, slug: 1 }, { unique: true });
module.exports = mongoose.model('Page', PageSchema);
```

### 3. Blog Schema
```javascript
const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  slug:        { type: String, required: true, unique: true },
  title:       { type: String, required: true },
  coverImage:  { type: String },
  excerpt:     { type: String }, 
  content:     { type: String }, 
  author:      { type: String, default: 'Jindal Metals' },
  category:    { type: String },
  tags:        [{ type: String }],
  isPublished: { type: Boolean, default: true, index: true },
  publishedAt: { type: Date, default: Date.now },
  
  // Embedded SEO Object
  seo: {
    title:       { type: String },
    description: { type: String },
  }
}, { timestamps: true });

module.exports = mongoose.model('Blog', BlogSchema);
```

### 4. Certification & Gallery Schemas
*(These usually don't need embedded SEO objects since they don't have individual pages).*
```javascript
const mongoose = require('mongoose');

const CertificationSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  imageUrl:    { type: String, required: true },
  issuedBy:    { type: String },
  validUntil:  { type: Date },
  sortOrder:   { type: Number, default: 0 }, 
  isActive:    { type: Boolean, default: true }
}, { timestamps: true });

const GallerySchema = new mongoose.Schema({
  title:       { type: String, required: true },
  imageUrl:    { type: String, required: true },
  category:    { type: String }, 
  sortOrder:   { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true });

module.exports = {
  Certification: mongoose.model('Certification', CertificationSchema),
  Gallery: mongoose.model('Gallery', GallerySchema)
};
```

---

## PART 2: How to Handle Dynamic SEO, Meta Tags, and Schema

Handling SEO dynamically means your Next.js frontend asks your backend API for a page's data, and Next.js uses that exact data to construct the `<head>` of the HTML document *before* sending it to the user.

### 1. Generating Dynamic Meta Tags in Next.js
Next.js uses a special function called `generateMetadata` for dynamic routes. Here is exactly how your frontend should handle the API response:

**Example for `src/app/[category]/[slug]/page.js`:**
```javascript
export async function generateMetadata({ params }) {
  // 1. Fetch data from your custom backend API
  const res = await fetch(`https://api.yourbackend.com/api/products/${params.slug}`);
  const product = await res.json();

  if (!product) return {};

  // 2. Inject the backend SEO data into Next.js Metadata
  return {
    // Fallback to product title if custom SEO title is missing
    title: product.seo?.title || `${product.title} | Jindal Metals`,
    
    // Fallback to short description if custom SEO description is missing
    description: product.seo?.description || product.description,
    
    keywords: product.seo?.keywords || [],
    
    openGraph: {
      title: product.seo?.title || product.title,
      description: product.seo?.description || product.description,
      images: product.seo?.ogImage || product.image 
        ? [{ url: product.seo.ogImage || product.image, width: 1200, height: 630 }]
        : [],
    },
    
    alternates: {
      canonical: product.seo?.canonical || `https://www.jindalmetals.com/${product.categorySlug}/${product.slug}`,
    },
  };
}
```

### 2. Generating Dynamic JSON-LD (Schema.org)
JSON-LD allows Google to show "Rich Snippets" (like product prices, ratings, or article publish dates) in search results. 

Instead of writing this in the backend, your backend just passes the raw data, and Next.js constructs the JSON-LD script tag dynamically inside the component.

**Example for a Product Page Component:**
```javascript
export default async function ProductDetailPage({ params }) {
  const res = await fetch(`https://api.yourbackend.com/api/products/${params.slug}`);
  const product = await res.json();

  // 1. Create the dynamic JSON-LD Object based on backend data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.image,
    description: product.seo?.description || product.description,
    brand: {
      '@type': 'Brand',
      name: 'Jindal Metals & Alloys Ltd'
    },
    category: product.category,
    // Add additional fields like offers, aggregateRating, etc., if your API provides them
  };

  return (
    <>
      {/* 2. Inject the script tag securely */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* 3. Render your normal HTML */}
      <PageHeader title={product.title} />
      <ProductDetails product={product} />
    </>
  );
}
```

### 3. Dynamic Blog Article JSON-LD
For your `/blog/[slug]` pages, you should return an `Article` schema. This is highly valued by Google News and Discover.

```javascript
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: blog.title,
  image: [blog.coverImage],
  datePublished: blog.publishedAt,
  dateModified: blog.updatedAt,
  author: [{
      '@type': 'Person',
      name: blog.author
  }],
  publisher: {
    '@type': 'Organization',
    name: 'Jindal Metals & Alloys Ltd',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.jindalmetals.com/images/logo.png'
    }
  }
};
```

### Summary of the Workflow:
1. **CMS/Admin Panel:** You enter SEO Titles, Descriptions, Keywords, and upload OG Images in your backend CMS.
2. **Database:** This is saved in the embedded `seo: {}` object within the Mongoose Schema.
3. **API:** Your Node.js backend serves this document as JSON via a `GET` request.
4. **Next.js:** The App Router calls your API inside `generateMetadata()` to dynamically create the `<head>` tags (Title, Meta, OG Tags) before the page loads.
5. **Next.js:** The React Component dynamically maps the API data into a JSON-LD object to provide Google with deep structured data.
