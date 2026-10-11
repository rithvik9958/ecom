import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectDB } from '@/app/lib/config';
import Blog from '@/app/models/Blog';
import { getEcomBlogPage } from '@/app/models/EcomBlogPage';
import { uploadFile, isUploadFile, deleteFile } from '@/lib/upload';
import { revalidatePath } from 'next/cache';

export async function GET(request) {
  try {
    await connectDB();
    const BlogPage = await getEcomBlogPage();

    const [blogs, pageConfig] = await Promise.all([
      Blog.find().sort({ sort: 1, createdAt: -1 }).lean(),
      BlogPage.findOne({ key: 'global_blog' }).lean()
    ]);

    let config = pageConfig;
    if (!config) {
      config = await BlogPage.create({ key: 'global_blog' });
    }

    return NextResponse.json({
      success: true,
      blogs: blogs || [],
      config
    });
  } catch (error) {
    console.error('[admin/blogs GET error]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const contentType = request.headers.get('content-type') || '';

    let data = {};
    let coverFile = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      data.title = formData.get('title') || '';
      data.slug = formData.get('slug') || '';
      data.category = formData.get('category') || 'Floral Guides';
      data.author = formData.get('author') || 'City Shop Editorial Desk';
      data.readTime = formData.get('readTime') || '4 min read';
      data.excerpt = formData.get('excerpt') || '';
      data.content = formData.get('content') || '';
      data.publishedAt = formData.get('publishedAt') || new Date().toISOString().split('T')[0];
      data.isPublished = formData.get('isPublished') === 'true';
      data.featured = formData.get('featured') === 'true';
      data.sort = Number(formData.get('sort') || 0);
      data.alt = formData.get('alt') || '';
      data.metatag = formData.get('metatag') || '';
      data.metaDescription = formData.get('metaDescription') || '';
      data.canonicalUrl = formData.get('canonicalUrl') || '';
      data.ogTitle = formData.get('ogTitle') || '';
      data.ogDescription = formData.get('ogDescription') || '';
      data.coverImage = formData.get('coverImage') || '';

      try {
        const kw = formData.get('metakeywords');
        if (kw) data.metakeywords = Array.isArray(kw) ? kw : JSON.parse(kw);
      } catch (e) {
        data.metakeywords = [];
      }

      coverFile = formData.get('coverFile');
    } else {
      data = await request.json();
    }

    if (!data.title?.trim() || !data.slug?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Title and URL Slug are required' },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await Blog.findOne({ slug: data.slug.trim() });
    if (existing) {
      data.slug = `${data.slug.trim()}-${Date.now().toString().slice(-4)}`;
    }

    // Handle File Upload if provided
    if (coverFile && isUploadFile(coverFile)) {
      data.coverImage = await uploadFile(coverFile, 'blog', 'cover');
    }

    const created = await Blog.create({
      ...data,
      isPublished: data.isPublished !== false
    });

    revalidatePath('/', 'layout');
    revalidatePath('/blog');
    revalidatePath(`/blog/${created.slug}`);

    return NextResponse.json({
      success: true,
      blog: created,
      message: 'Blog post created successfully'
    });
  } catch (error) {
    console.error('[admin/blogs POST error]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const contentType = request.headers.get('content-type') || '';

    let body = {};
    let coverFile = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const id = formData.get('id');
      const action = formData.get('action');

      body = {
        id,
        action,
        title: formData.get('title'),
        slug: formData.get('slug'),
        category: formData.get('category'),
        author: formData.get('author'),
        readTime: formData.get('readTime'),
        excerpt: formData.get('excerpt'),
        content: formData.get('content'),
        publishedAt: formData.get('publishedAt'),
        isPublished: formData.get('isPublished') === 'true',
        featured: formData.get('featured') === 'true',
        sort: Number(formData.get('sort') || 0),
        alt: formData.get('alt'),
        metatag: formData.get('metatag'),
        metaDescription: formData.get('metaDescription'),
        canonicalUrl: formData.get('canonicalUrl'),
        ogTitle: formData.get('ogTitle'),
        ogDescription: formData.get('ogDescription'),
        coverImage: formData.get('coverImage')
      };

      try {
        const kw = formData.get('metakeywords');
        if (kw) body.metakeywords = Array.isArray(kw) ? kw : JSON.parse(kw);
      } catch (e) {}

      coverFile = formData.get('coverFile');
    } else {
      body = await request.json();
    }

    const { action, id, config, categories, ...blogData } = body;

    // 1. Save Page Hero / SEO settings
    if (action === 'save_settings' || config) {
      const BlogPage = await getEcomBlogPage();
      const updatedConfig = await BlogPage.findOneAndUpdate(
        { key: 'global_blog' },
        { $set: config },
        { new: true, upsert: true }
      );
      return NextResponse.json({
        success: true,
        config: updatedConfig,
        message: 'Blog page settings saved successfully'
      });
    }

    // 2. Save categories list
    if (action === 'save_categories' && Array.isArray(categories)) {
      const BlogPage = await getEcomBlogPage();
      const updatedConfig = await BlogPage.findOneAndUpdate(
        { key: 'global_blog' },
        { $set: { categories } },
        { new: true, upsert: true }
      );
      return NextResponse.json({
        success: true,
        categories: updatedConfig.categories,
        message: 'Blog categories updated successfully'
      });
    }

    // 3. Update single blog post
    if (!id) {
      return NextResponse.json({ success: false, message: 'Blog ID is required' }, { status: 400 });
    }

    // Handle File Upload if provided
    if (coverFile && isUploadFile(coverFile)) {
      blogData.coverImage = await uploadFile(coverFile, 'blog', 'cover');
    }

    const updated = await Blog.findByIdAndUpdate(
      id,
      { $set: blogData },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
    }

    revalidatePath('/', 'layout');
    revalidatePath('/blog');
    revalidatePath(`/blog/${updated.slug}`);

    return NextResponse.json({
      success: true,
      blog: updated,
      message: 'Blog post updated successfully'
    });
  } catch (error) {
    console.error('[admin/blogs PUT error]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Blog ID is required' }, { status: 400 });
    }

    const existing = await Blog.findById(id);
    if (existing && existing.coverImage) {
      await deleteFile(existing.coverImage);
    }

    await Blog.findByIdAndDelete(id);

    revalidatePath('/', 'layout');
    revalidatePath('/blog');

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('[admin/blogs DELETE error]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
