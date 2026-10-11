'use client';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  RotateCcw,
  Sparkles,
  Cake,
  Truck,
  Award,
  Tag,
  FolderKanban,
  X
} from 'lucide-react';

const ITEMS_PER_PAGE = 6;

const DEFAULT_PAGE_CONFIG = {
  hero: {
    title: 'Celebration Ideas, Floral Guides & Gifting Trends',
    subtitle:
      'Expert advice on selecting the perfect blooms, gourmet confection trends, and celebration inspiration from master florists and pastry chefs.',
    bannerImage: ''
  },
  categories: [
    { id: 'floral-guides', label: 'Floral Guides' },
    { id: 'gourmet-bakery', label: 'Gourmet Bakery' },
    { id: 'gifting-logistics', label: 'Gifting Logistics' },
    { id: 'milestones', label: 'Anniversary & Milestones' },
    { id: 'festive-trends', label: 'Festive Trends' }
  ]
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=1200&auto=format&fit=crop';

function DynamicBlogCategoryIcon({ name, size = 14 }) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('all') || lower.includes('view all')) return <BookOpen size={size} />;
  if (lower.includes('floral') || lower.includes('flower')) return <Sparkles size={size} />;
  if (lower.includes('bakery') || lower.includes('cake')) return <Cake size={size} />;
  if (lower.includes('logistics') || lower.includes('delivery')) return <Truck size={size} />;
  if (lower.includes('milestone') || lower.includes('anniversary')) return <Award size={size} />;
  if (lower.includes('festive') || lower.includes('trend')) return <Tag size={size} />;
  return <FolderKanban size={size} />;
}

function BlogContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get('category');

  const [blogs, setBlogs] = useState([]);
  const [pageConfig, setPageConfig] = useState(DEFAULT_PAGE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Sync category state when URL search param changes
  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
      setCurrentPage(1);
    }
  }, [categoryParam]);

  useEffect(() => {
    fetch('/api/store-blogs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBlogs(data.blogs || []);
          if (data.config) {
            setPageConfig((prev) => ({
              ...prev,
              ...data.config,
              hero: { ...prev.hero, ...(data.config.hero || {}) },
              categories:
                data.config.categories?.length > 0
                  ? data.config.categories
                  : prev.categories
            }));
          }
        }
      })
      .catch((err) => console.error('Error fetching blogs:', err))
      .finally(() => setLoading(false));
  }, []);

  // Compute category pills with live article counts
  const categoriesList = useMemo(() => {
    const counts = {};
    blogs.forEach((b) => {
      if (b.category) {
        counts[b.category] = (counts[b.category] || 0) + 1;
      }
    });

    const definedCats = (pageConfig.categories || DEFAULT_PAGE_CONFIG.categories).map((c) => ({
      id: c.label || c.id,
      label: c.label || c.id,
      count: counts[c.label || c.id] || 0
    }));

    return [{ id: 'All', label: 'All Articles', count: blogs.length }, ...definedCats];
  }, [blogs, pageConfig.categories]);

  // Filtered blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const matchCat =
        activeCategory === 'All' ||
        (b.category || '').toLowerCase() === activeCategory.toLowerCase();

      const matchSearch =
        !searchQuery.trim() ||
        (b.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.author || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [blogs, activeCategory, searchQuery]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  // Paginated articles (6 per page)
  const totalPages = Math.max(1, Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE));
  const paginatedBlogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBlogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBlogs, currentPage]);

  const handlePageChange = (p) => {
    setCurrentPage(p);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 320, behavior: 'smooth' });
    }
  };

  const handleResetFilters = () => {
    setActiveCategory('All');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const { hero } = pageConfig;

  return (
    <div className="store-blog-page pb-20">

      {/* ── 1. Luxury Dark Hero Header ── */}
      <section className="store-about-hero-banner relative overflow-hidden">
        {hero.bannerImage ? (
          <>
            <img
              src={hero.bannerImage}
              alt="Gifting Journal Banner"
              className="store-about-hero-bg-img"
            />
            <div className="store-about-hero-overlay" />
          </>
        ) : (
          <div className="store-about-ambient-glow" />
        )}

        <div className="store-about-header-container relative z-10">
          {/* Frosted Glass Breadcrumb */}
          <div className="store-about-breadcrumb">
            <Link href="/" className="store-about-bc-link">Home</Link>
            <ChevronRight size={12} className="store-about-bc-sep" />
            <span className="store-about-bc-current">Gifting Journal & Stories</span>
          </div>

          <div className="store-testimonials-hero-content">
            <h1 className="store-about-title">{hero.title || DEFAULT_PAGE_CONFIG.hero.title}</h1>
            <p className="store-about-subtitle">
              {hero.subtitle || DEFAULT_PAGE_CONFIG.hero.subtitle}
            </p>
          </div>

          {/* Frosted Live Search Bar */}
          <div className="store-faqs-search-wrapper mt-6">
            <div className="store-faqs-search-box">
              <Search size={18} className="store-faqs-search-icon" />
              <input
                type="text"
                placeholder="Search articles by flower care, cake trends, gifting tips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="store-faqs-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="store-faqs-search-clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Category Selector Pills (Exact FAQ Type Style) ── */}
      <section className="store-faqs-categories-section">
        <div className="store-container">
          <div className="store-faqs-pills-cluster">
            {categoriesList.map((cat) => {
              const isCatActive =
                activeCategory.toLowerCase() === cat.id.toLowerCase() ||
                activeCategory.toLowerCase() === cat.label.toLowerCase() ||
                (activeCategory.toLowerCase() === 'all' && (cat.id.toLowerCase() === 'all' || cat.label.toLowerCase() === 'all articles'));

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id === 'All' ? 'All' : cat.label)}
                  className={`store-faqs-pill-btn ${isCatActive ? 'is-active' : ''}`}
                >
                  <DynamicBlogCategoryIcon name={cat.label} size={14} />
                  <span>{cat.label}</span>
                  <span className="store-faqs-pill-count">({cat.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. Symmetrical 3-Column Cards Grid ── */}
      <section className="store-blog-grid-section pt-8 pb-12">
        <div className="store-container">
          {loading ? (
            <div className="store-blog-3col-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3.5">
                  <div className="h-[240px] rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
                  <div className="h-5 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="store-faqs-empty-card text-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
                <BookOpen size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No matching articles found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5 mb-6">
                We couldn't find any celebration stories matching{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  "{searchQuery || activeCategory}"
                </span>
                . Try another search keyword or view all articles.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="store-testimonials-reset-btn"
              >
                <RotateCcw size={14} />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            <>
              {/* 3-Column Symmetrical Grid */}
              <div className="store-blog-3col-grid">
                {paginatedBlogs.map((post) => {
                  const dateStr = post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                    : new Date(post.createdAt || Date.now()).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });

                  return (
                    <article
                      key={post._id || post.slug}
                      className="store-blog-untitled-card group"
                    >
                      {/* Image Box with Frosted Glass Metadata Strip */}
                      <Link
                        href={`/blog/${post.slug}`}
                        className="store-blog-untitled-imgbox block"
                      >
                        <img
                          src={post.coverImage || FALLBACK_IMAGE}
                          alt={post.title}
                          className="store-blog-untitled-img"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />

                        {/* Frosted Glass Meta Bar at Bottom of Image */}
                        <div className="store-blog-untitled-frosted-bar">
                          <div className="store-blog-untitled-author-date">
                            <span className="store-blog-untitled-author-name">
                              {post.author || 'City Shop Editorial Desk'}
                            </span>
                            <span className="store-blog-untitled-date">{dateStr}</span>
                          </div>
                          <span className="store-blog-untitled-cat-text">
                            {post.category || 'Gifting'}
                          </span>
                        </div>
                      </Link>

                      {/* Content below Image */}
                      <div className="store-blog-untitled-body">
                        {/* Title with hover underline */}
                        <h2 className="store-blog-untitled-title">
                          <Link href={`/blog/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h2>

                        {/* Description / Excerpt */}
                        <p className="store-blog-untitled-desc">
                          {post.excerpt ||
                            'Explore expert celebration ideas, flower care secrets, and curated gifting recommendations from our master florists.'}
                        </p>

                        {/* Read post ↗ */}
                        <div className="store-blog-untitled-footer">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="store-blog-untitled-link"
                          >
                            <span>Read post</span>
                            <ArrowUpRight size={16} className="store-blog-untitled-arrow" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* ── 4. Standard Website Pagination ── */}
              {totalPages > 1 && (
                <div className="store-blog-pagination-card">
                  <div className="store-blog-pagination-info">
                    Showing <strong>{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</strong>–<strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredBlogs.length)}</strong> of <strong>{filteredBlogs.length}</strong> celebration stories
                  </div>

                  <div className="store-blog-pagination-controls">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="store-blog-pagination-btn"
                    >
                      <ChevronLeft size={14} />
                      <span>Prev</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePageChange(p)}
                        className={`store-blog-pagination-num ${p === currentPage ? 'is-active' : ''}`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="store-blog-pagination-btn"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

    </div>
  );
}

export default function StorefrontBlogPage() {
  return (
    <Suspense
      fallback={
        <div className="store-blog-page min-h-screen py-24 text-center">
          <div className="store-container">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mx-auto mb-4" />
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mx-auto" />
          </div>
        </div>
      }
    >
      <BlogContent />
    </Suspense>
  );
}
