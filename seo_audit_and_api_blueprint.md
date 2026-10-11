# SEO & Performance Audit + MongoDB API Blueprint
### Jindal Metals & Alloys Ltd — Next.js Project

---

## PART 1: SEO & PERFORMANCE AUDIT

---

### ✅ What You're Doing Right

| Area | Status |
|---|---|
| App Router (Next.js) | ✅ Using correct App Router paradigm |
| `generateMetadata` per page | ✅ Blog, Category, Product pages all have it |
| OpenGraph metadata in layout | ✅ Correct |
| JSON-LD Structured Data | ✅ Added (ManufacturingBusiness schema) |
| Canonical URLs | ✅ Global canonical + per-page alternates |
| `next/image` with `fill` + `sizes` | ✅ Used correctly in most places |
| `priority` on hero image | ✅ Correctly set on slide index 0 only |
| `robots.js` | ✅ Present |
| `sitemap.js` | ⚠️ Present but OUTDATED (see below) |
| Font optimization via `next/font/google` | ✅ Poppins correctly configured |
| `notFound()` for invalid routes | ✅ Used in Blog, Category, Product pages |
| Footer: semantic `<footer>` tag | ✅ |
| Header: semantic `<header>` + `<nav>` | ✅ |
| External social links: `rel="noopener noreferrer"` | ✅ |

---

### 🔴 Critical Issues

#### 1. Sitemap is Incomplete & Uses Wrong URLs
**File:** [`sitemap.js`](file:///d:/Rahul%20Rautela/jindal-metal-next/src/app/sitemap.js)

Your sitemap lists `/about`, `/category`, `/product`, `/csr`, `/blogs` — **none of these routes exist** in your project. Your actual routes are `/aboutus/[slug]`, `/blog`, `/certifications`, etc.

```javascript
// ❌ Current — Wrong paths, none of these pages exist
const routes = ['', '/about', '/category', '/product', '/csr', '/blogs']

// ✅ Fix — Match your actual App Router routes
const routes = [
  '',
  '/blog',
  '/contact',
  '/gallery',
  '/certifications',
  '/stainless-steel',
  '/high-carbon-alloy-steel-strips',
  '/technical-information',
  '/aboutus/corporate-overview',
  '/aboutus/holding-group-company',
  '/aboutus/vision-mission',
  '/quality/qehs-policy',
  '/quality/certifications',
  '/quality/rd-equipment',
  '/infrastructure/manufacturing-facilities',
  '/infrastructure/testing-lab',
  '/infrastructure/plant-information',
  '/human-resource/career',
  '/human-resource/employee-welfare',
  '/human-resource/training-programs',
  // Product pages:
  '/stainless-steel/cold-rolled-precision-stainless-steel-strips',
  '/stainless-steel/stainless-steel-ultra-thin-foils',
  '/high-carbon-alloy-steel-strips/hardened-and-tempered-steel-strips',
  '/high-carbon-alloy-steel-strips/cold-rolled-steel-strips',
]
```

#### 2. Product SEO Fields Are All Empty
**File:** [`[category]/[slug]/page.js`](file:///d:/Rahul%20Rautela/jindal-metal-next/src/app/%5Bcategory%5D/%5Bslug%5D/page.js)

Every product's `seo.title`, `seo.description`, `seo.keywords`, and `seo.canonical` are **empty strings `""`**. Google will either use defaults or penalize these pages for thin/missing metadata.

```javascript
// ❌ Current — Empty SEO for ALL products
seo: { title: "", description: "", keywords: [], ogImage: "", canonical: "" }

// ✅ Fix example for Cold Rolled Precision Stainless Steel Strips
seo: {
  title: "Cold Rolled Precision Stainless Steel Strips | Jindal Metals",
  description: "Buy cold rolled precision stainless steel strips manufactured to ISO standards. Serving automotive, medical, and electronics industries.",
  keywords: ["precision stainless steel strips", "cold rolled strips India", "stainless steel foils"],
  ogImage: "/images/thin.jpeg",
  canonical: "/stainless-steel/cold-rolled-precision-stainless-steel-strips"
}
```

#### 3. Unused Font Imports in layout.js
**File:** [`layout.js`](file:///d:/Rahul%20Rautela/jindal-metal-next/src/app/layout.js) (Line 1)

`Geist` and `Geist_Mono` are imported but **never used**. This adds unnecessary JS to your bundle.

```javascript
// ❌ Remove these — They are never applied anywhere
import { Geist, Geist_Mono } from "next/font/google";
```

#### 4. Inline `<style>` Tags in Page Components
**File:** [`gallery/page.js`](file:///d:/Rahul%20Rautela/jindal-metal-next/src/app/gallery/page.js) (Lines 94–151)

You are injecting raw CSS as a `dangerouslySetInnerHTML` string inside a `<style>` tag in the component. This:
- Blocks the page from being a pure Server Component
- Prevents CSS optimization by the Next.js compiler
- Causes Flash of Unstyled Content (FOUC) risks

```javascript
// ❌ Don't do this
<style dangerouslySetInnerHTML={{__html: `...`}} />

// ✅ Move all those styles to src/css/style.css or a dedicated gallery.css file
```

#### 5. Hero Slider Uses `<h2>` Instead of `<h1>`
**File:** [`HeroSlider.jsx`](file:///d:/Rahul%20Rautela/jindal-metal-next/src/components/features/home/HeroSlider.jsx) (Line 73)

Every page must have **exactly one `<h1>`**. The hero slider headline is the most important text on the homepage and should be `<h1>`.

```jsx
// ❌ Current
<h2>{slide.title}</h2>

// ✅ Fix — Use h1 for the first slide's title (SEO primary heading)
{index === 0 ? <h1>{slide.title}</h1> : <h2>{slide.title}</h2>}
```

#### 6. Category Page Content Rendered as Plain Text (Not HTML)
**File:** [`[category]/page.js`](file:///d:/Rahul%20Rautela/jindal-metal-next/src/app/%5Bcategory%5D/page.js) (Line 169)

```jsx
// ❌ Current — outputs raw string with whitespace, no semantic structure
<p>{category.content}</p>

// ✅ Fix — If content is HTML use dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: category.content }} />
// OR structure it as proper paragraphs
```

#### 7. Logo `alt` Text is Generic
**File:** [`Header.jsx`](file:///d:/Rahul%20Rautela/jindal-metal-next/src/components/layout/Header.jsx) (Line 235)

```jsx
// ❌ Generic alt text
alt="Logo"

// ✅ Descriptive and keyword-rich
alt="Jindal Metals & Alloys Ltd — Precision Steel Manufacturer"
```

---

### 🟡 Performance Issues

#### 8. `next.config.mjs` Missing Image Optimization Config
No `images.formats` or compression settings configured. Add WebP/AVIF support:

```javascript
// next.config.mjs
const nextConfig = {
  experimental: { viewTransition: true },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  compress: true,
};
```

#### 9. No `generateStaticParams` on Dynamic Pages
Your `[category]/page.js` and `[category]/[slug]/page.js` pages have all the data hardcoded — making them perfect candidates for **Static Site Generation (SSG)**. Without `generateStaticParams`, Next.js will render these pages on-demand at request time instead of pre-building them.

```javascript
// Add to [category]/page.js
export async function generateStaticParams() {
  return categories.map((cat) => ({ category: cat.slug }));
}

// Add to [category]/[slug]/page.js
export async function generateStaticParams() {
  return products.map((p) => ({
    category: p.category.toLowerCase().replace(/ /g, '-'),
    slug: p.slug,
  }));
}
```

#### 10. No `loading.js` Skeletons on Most Pages
Only `/quality`, `/infrastructure`, `/human-resource` have `loading.js`. Add them to `/blog`, `/gallery`, `/certifications` for a better UX and Suspense-based streaming.

#### 11. Contact Page: Thin Meta Description
```javascript
// ❌ Current — Too vague
description: "Get in touch with Jindal Metals & Alloys Ltd."

// ✅ More descriptive and keyword-rich
description: "Contact Jindal Metals & Alloys Ltd for precision stainless steel strip enquiries, technical support, and export queries. Located in Hisar, Haryana, India."
```

---

### 🟢 Quick Wins Summary

| Fix | Impact | Effort |
|---|---|---|
| Fix `sitemap.js` with all real URLs | 🔴 Critical for indexing | Low |
| Fill all product SEO fields | 🔴 Critical for rankings | Low |
| Remove unused `Geist`/`Geist_Mono` imports | 🟡 Bundle size | Low |
| Move inline gallery CSS to style.css | 🟡 Performance | Low |
| Fix hero `<h2>` → `<h1>` | 🔴 SEO heading hierarchy | Low |
| Add `generateStaticParams` to product pages | 🟢 Performance (SSG) | Low |
| Add image AVIF/WebP config in next.config | 🟢 Performance | Low |
| Improve Contact meta description | 🟡 CTR in search results | Low |

---
---

## PART 2: PRODUCTION MONGODB API BLUEPRINT

This section defines exactly how each page would fetch data from a real MongoDB database instead of hardcoded arrays.

---

### MongoDB Connection Setup

```javascript
// src/lib/db.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
let cached = global.mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  cached.conn = await cached.promise;
  return cached.conn;
}
```

---

### Collection 1: `pages` — Section Pages (About, Quality, HR, Infrastructure)

**Used by:** `/aboutus/[slug]`, `/quality/[slug]`, `/infrastructure/[slug]`, `/human-resource/[slug]`, `/corporate-information/[slug]`

**Mongoose Schema:**
```javascript
// src/models/Page.js
import mongoose from 'mongoose';
const PageSchema = new mongoose.Schema({
  section:      { type: String, required: true, index: true }, // "aboutus", "quality", etc.
  slug:         { type: String, required: true, index: true }, // "corporate-overview"
  title:        { type: String, required: true },
  bannerImage:  { type: String },
  description:  { type: String },
  content:      { type: String },              // Rich HTML from CMS editor
  seo: {
    title:       String,
    description: String,
    ogImage:     String,
  },
  nav: [{ title: String, slug: String }],     // Sidebar links for this section
}, { timestamps: true });
PageSchema.index({ section: 1, slug: 1 }, { unique: true });
export default mongoose.models.Page || mongoose.model('Page', PageSchema);
```

**API Endpoint:** `GET /api/pages/:section/:slug`
```javascript
// src/app/api/pages/[section]/[slug]/route.js
import { connectDB } from 'src/lib/db';
import Page from 'src/models/Page';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  await connectDB();
  const page = await Page.findOne({ section: params.section, slug: params.slug }).lean();
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(page);
}
```

**Page Data Flow:**
```javascript
// src/app/aboutus/[slug]/page.js (Server Component)
async function getPageData(section, slug) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/pages/${section}/${slug}`,
    { next: { revalidate: 86400 } }   // ISR: refresh every 24 hours
  );
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }) {
  const data = await getPageData('aboutus', params.slug);
  return {
    title: data?.seo?.title || data?.title,
    description: data?.seo?.description,
    alternates: { canonical: `/aboutus/${params.slug}` },
  };
}

export default async function AboutPage({ params }) {
  const data = await getPageData('aboutus', params.slug);
  if (!data) notFound();
  return <SectionPageLayout page={data} section="aboutus" />;
}
```

---

### Collection 2: `products` — Product Catalogue

**Used by:** `/[category]/page.js`, `/[category]/[slug]/page.js`

**Mongoose Schema:**
```javascript
// src/models/Product.js
import mongoose from 'mongoose';
const ProductSchema = new mongoose.Schema({
  slug:             { type: String, required: true, unique: true },
  categorySlug:     { type: String, required: true, index: true }, // "stainless-steel"
  title:            { type: String, required: true },
  shortDescription: { type: String },
  content:          { type: String },           // Rich HTML
  thumbnail:        { type: String },
  specifications:   [{ key: String, value: String }],
  pdfBrochureUrl:   { type: String },
  seo: {
    title:       String,
    description: String,
    keywords:    [String],
    ogImage:     String,
    canonical:   String,
  },
}, { timestamps: true });
export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
```

**API Endpoints:**
```javascript
// GET /api/products?category=stainless-steel  → for category listing page
// GET /api/products/:slug                      → for individual product page

// src/app/api/products/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  await connectDB();
  const query = category ? { categorySlug: category } : {};
  const products = await Product.find(query).select('-content').lean();
  return NextResponse.json(products);
}
```

**Page Data Flow:**
```javascript
// src/app/[category]/[slug]/page.js
export async function generateStaticParams() {
  // At build time, fetch all product slugs
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products`);
  const products = await res.json();
  return products.map(p => ({ category: p.categorySlug, slug: p.slug }));
}

export default async function ProductDetailPage({ params }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/products/${params.slug}`,
    { next: { revalidate: 3600 } }
  );
  const product = await res.json();
  if (!product) notFound();
  // ...
}
```

---

### Collection 3: `categories` — Product Categories

**Used by:** `/[category]/page.js`

**Mongoose Schema:**
```javascript
// src/models/Category.js
import mongoose from 'mongoose';
const CategorySchema = new mongoose.Schema({
  slug:        { type: String, required: true, unique: true },
  title:       { type: String, required: true },
  image:       { type: String },
  description: { type: String },
  content:     { type: String },    // Rich HTML
  seo: {
    title:       String,
    description: String,
    ogImage:     String,
    canonical:   String,
  },
}, { timestamps: true });
export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
```

**API Endpoint:** `GET /api/categories/:slug`

---

### Collection 4: `blogs` — Blog Posts

**Used by:** `/blog/page.js`, `/blog/[slug]/page.js`, `BlogSection` (home page), `BlogSidebar`

**Mongoose Schema:**
```javascript
// src/models/Blog.js
import mongoose from 'mongoose';
const BlogSchema = new mongoose.Schema({
  slug:        { type: String, required: true, unique: true },
  title:       { type: String, required: true },
  coverImage:  { type: String },
  category:    { type: String, index: true },   // "Industry", "Innovation", etc.
  excerpt:     { type: String },                 // Short description for cards
  content:     { type: String },                 // Full rich HTML content
  author:      { type: String, default: 'Admin' },
  publishDate: { type: Date, default: Date.now, index: true },
  isPublished: { type: Boolean, default: false, index: true },
  tags:        [String],
  seo: {
    title:       String,
    description: String,
    ogImage:     String,
  },
}, { timestamps: true });
export default mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
```

**API Endpoints:**
```javascript
// GET /api/blogs?page=1&limit=6&category=Industry  → Listing with pagination
// GET /api/blogs/:slug                              → Single blog post

// src/app/api/blogs/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page  = parseInt(searchParams.get('page')  || '1');
  const limit = parseInt(searchParams.get('limit') || '6');
  const category = searchParams.get('category');

  await connectDB();
  const query = { isPublished: true, ...(category && { category }) };
  const [blogs, total] = await Promise.all([
    Blog.find(query)
      .select('slug title coverImage category excerpt publishDate author')
      .sort({ publishDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Blog.countDocuments(query),
  ]);

  return NextResponse.json({ blogs, total, totalPages: Math.ceil(total / limit) });
}
```

**Page Data Flow:**
```javascript
// src/app/blog/page.js — Blog listing with pagination
export default async function BlogPage({ searchParams }) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const res  = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/blogs?page=${page}&limit=6`,
    { next: { revalidate: 3600 } }
  );
  const { blogs, totalPages } = await res.json();
  return (
    <>
      <PageHeader title="Our Blog & Articles" ... />
      <section>
        {blogs.map(blog => <BlogCard key={blog.slug} blog={blog} />)}
        <Pagination currentPage={page} totalPages={totalPages} />
      </section>
    </>
  );
}
```

---

### Collection 5: `certifications` — Certification Gallery

**Used by:** `/certifications/page.js`

**Mongoose Schema:**
```javascript
// src/models/Certification.js
import mongoose from 'mongoose';
const CertificationSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  imageUrl:    { type: String, required: true },
  issuedBy:    { type: String },
  validUntil:  { type: Date },
  sortOrder:   { type: Number, default: 0, index: true },
  isActive:    { type: Boolean, default: true, index: true },
}, { timestamps: true });
export default mongoose.models.Certification || mongoose.model('Certification', CertificationSchema);
```

**API Endpoint:** `GET /api/certifications`

**Page Data Flow:**
```javascript
// src/app/certifications/page.js
export default async function CertificationsPage() {
  const res  = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/certifications`,
    { next: { revalidate: 86400 } }  // 24-hour cache — certs rarely change
  );
  const certifications = await res.json();
  return ( /* render certifications */ );
}
```

---

### Collection 6: `gallery` — Image Gallery

**Used by:** `/gallery/page.js`

**Mongoose Schema:**
```javascript
// src/models/GalleryImage.js
import mongoose from 'mongoose';
const GalleryImageSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  imageUrl:   { type: String, required: true },
  category:   { type: String, index: true }, // "Facilities", "Products", "Team"
  sortOrder:  { type: Number, default: 0 },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });
export default mongoose.models.GalleryImage || mongoose.model('GalleryImage', GalleryImageSchema);
```

---

### Collection 7: `contacts` — Contact Form Submissions

**Used by:** `/contact/page.js` (POST only — form submissions)

**Mongoose Schema:**
```javascript
// src/models/Contact.js
import mongoose from 'mongoose';
const ContactSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String, required: true },
  phone:       { type: String },
  company:     { type: String },
  subject:     { type: String },
  message:     { type: String, required: true },
  productType: { type: String },     // Which product they're enquiring about
  status:      { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });
export default mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
```

**API Endpoint:**
```javascript
// POST /api/contact
// src/app/api/contact/route.js
export async function POST(request) {
  const body = await request.json();
  await connectDB();
  const contact = await Contact.create(body);
  // Optionally: trigger email notification via Nodemailer/SendGrid
  return NextResponse.json({ success: true, id: contact._id }, { status: 201 });
}
```

---

### Collection 8: `siteSettings` — Global Settings (Singleton)

**Used by:** `Header.jsx`, `Footer.jsx`, `layout.js`

**Mongoose Schema:**
```javascript
// src/models/SiteSettings.js
import mongoose from 'mongoose';
const SiteSettingsSchema = new mongoose.Schema({
  siteName:    String,
  logoUrl:     String,
  phone:       String,
  email:       String,
  address:     String,
  socialLinks: [{ platform: String, url: String, icon: String }],
  footerText:  String,
  menuData:    mongoose.Schema.Types.Mixed,  // The nav menu array
}, { timestamps: true });
export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);
```

---

### Environment Variables Required

```bash
# .env.local
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/jindal_metals?retryWrites=true&w=majority
NEXT_PUBLIC_BASE_URL=http://localhost:3000   # Or your production URL
```

---

### Page-by-Page API Summary

| Page / Route | Collection(s) | Cache Strategy |
|---|---|---|
| `/` (Home) | `blogs` (latest 3), `siteSettings` | ISR 1 hour |
| `/[category]` | `categories` | SSG + ISR 24h |
| `/[category]/[slug]` | `products`, `products` (related) | SSG + ISR 24h |
| `/blog` | `blogs` (paginated) | ISR 1 hour |
| `/blog/[slug]` | `blogs` | SSG + ISR 1 hour |
| `/certifications` | `certifications` | ISR 24 hours |
| `/gallery` | `gallery` | ISR 24 hours |
| `/contact` | POST → `contacts` | No cache (mutation) |
| `/aboutus/[slug]` | `pages` (section=aboutus) | ISR 24 hours |
| `/quality/[slug]` | `pages` (section=quality) | ISR 24 hours |
| `/infrastructure/[slug]` | `pages` (section=infrastructure) | ISR 24 hours |
| `/human-resource/[slug]` | `pages` (section=human-resource) | ISR 24 hours |
| `/corporate-information/[slug]` | `pages` | ISR 24 hours |
