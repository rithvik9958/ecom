import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/config';
import { getEcomProduct } from '@/app/models/EcomProduct';
import { getEcomCategory } from '@/app/models/EcomCategory';
import Blog from '@/app/models/Blog';
import CustomPage from '@/app/models/CustomPage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    const issues = [];
    let totalChecks = 0;
    let failedChecks = 0;

    // Helper to evaluate an entity
    const evaluate = (item, entityType, nameField, link) => {
      const name = item[nameField] || item.name || item.title || 'Untitled';

      // 1. Meta Description / SEO Description
      totalChecks++;
      const desc = item.metaDescription || item.seoDescription || item.shortDescription;
      if (!desc || desc.trim() === '') {
        failedChecks++;
        issues.push({
          id: `${entityType}-${item._id}-desc`,
          entity: entityType,
          name,
          issue: 'Missing Meta Description',
          severity: 'high',
          link
        });
      }

      // 2. SEO Title / Meta Title
      totalChecks++;
      const title = item.metaTitle || item.seoTitle || item.title || item.name;
      if (!title || title.trim() === '') {
        failedChecks++;
        issues.push({
          id: `${entityType}-${item._id}-title`,
          entity: entityType,
          name,
          issue: 'Missing SEO Title',
          severity: 'high',
          link
        });
      }

      // 3. Product/Blog Image
      totalChecks++;
      const hasImage = (item.images && item.images.length > 0) || item.image || item.thumbnail || item.bannerImage;
      if (!hasImage) {
        failedChecks++;
        issues.push({
          id: `${entityType}-${item._id}-img`,
          entity: entityType,
          name,
          issue: 'Missing Featured / Product Image',
          severity: 'medium',
          link
        });
      }

      // 4. Slug / URL structure
      totalChecks++;
      if (!item.slug || item.slug.trim() === '') {
        failedChecks++;
        issues.push({
          id: `${entityType}-${item._id}-slug`,
          entity: entityType,
          name,
          issue: 'Missing URL Slug',
          severity: 'high',
          link
        });
      }
    };

    // Fetch and evaluate Storefront Products
    const ProductModel = await getEcomProduct();
    const products = await ProductModel.find({ isActive: { $ne: false } }).limit(200).lean();
    products.forEach(p => evaluate(p, 'Store Product', 'name', `/dashboard/ecommerce/products`));

    // Fetch and evaluate Storefront Categories
    const CategoryModel = await getEcomCategory();
    const categories = await CategoryModel.find({ isActive: { $ne: false } }).lean();
    categories.forEach(c => evaluate(c, 'Product Category', 'title', `/dashboard/ecommerce/categories`));

    // Fetch and evaluate Store Blogs
    const blogs = await Blog.find({ status: { $ne: 'draft' } }).lean();
    blogs.forEach(b => evaluate(b, 'Blog Article', 'title', `/dashboard/blogs`));

    // Fetch and evaluate Custom Pages
    const customPages = await CustomPage.find({}).lean();
    customPages.forEach(cp => evaluate(cp, 'Custom Page', 'title', `/dashboard/custom-pages`));

    // Calculate Score
    let score = 100;
    if (totalChecks > 0) {
      score = Math.round(((totalChecks - failedChecks) / totalChecks) * 100);
    }

    return NextResponse.json({
      success: true,
      data: {
        score,
        totalChecks,
        issuesCount: failedChecks,
        issues
      }
    });

  } catch (error) {
    console.error('SEO Audit Error:', error);
    return NextResponse.json({ success: false, message: 'Server error: ' + error.message }, { status: 500 });
  }
}
