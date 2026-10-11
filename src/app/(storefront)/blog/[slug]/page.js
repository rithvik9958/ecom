'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Share2,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  ThumbsUp,
  Eye,
  ArrowUpRight,
  Sparkles,
  Check,
  FolderKanban,
  Headphones,
  User
} from 'lucide-react';
import showToast from '@/lib/storeToast';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=1200&auto=format&fit=crop';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug;

  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/store-blogs?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.blog) {
          setBlog(data.blog);
          setRelated(data.related || []);
          setLikesCount(data.blog.likes || 0);

          if (data.config?.categories) {
            setCategories(data.config.categories);
          }

          // Check localStorage for like state
          try {
            const savedLikes = JSON.parse(localStorage.getItem('liked_blogs') || '{}');
            setIsLiked(!!savedLikes[data.blog._id]);
          } catch (e) { }
        } else {
          setBlog(null);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  // Handle Share link copy
  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast.success('Article link copied to clipboard! 📋');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // 1-Vote Per User Helpful Toggle
  const handleToggleLike = async () => {
    if (!blog?._id) return;
    const nextState = !isLiked;
    const action = nextState ? 'like' : 'unlike';

    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const savedLikes = JSON.parse(localStorage.getItem('liked_blogs') || '{}');
      if (nextState) {
        savedLikes[blog._id] = true;
        showToast.success('Thanks for your feedback!');
      } else {
        delete savedLikes[blog._id];
        showToast.info('Removed helpful vote');
      }
      localStorage.setItem('liked_blogs', JSON.stringify(savedLikes));
    } catch (e) { }

    try {
      await fetch('/api/store-blogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: blog._id, action })
      });
    } catch (err) {
      console.error('Error recording blog like:', err);
    }
  };

  if (loading) {
    return (
      <div className="store-blog-detail-page py-16">
        <div className="store-container max-w-5xl mx-auto space-y-6">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-80 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="store-blog-detail-page py-24">
        <div className="store-container max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Article Not Found</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            The celebration article you are looking for may have been updated, relocated, or unpublished.
          </p>
          <Link
            href="/blog"
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white dark:bg-blue-600 rounded-xl text-xs font-bold hover:opacity-90 transition shadow-sm"
          >
            <ArrowLeft size={14} /> Back to Gifting Journal
          </Link>
        </div>
      </div>
    );
  }

  const dateStr = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    : new Date(blog.createdAt || Date.now()).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

  const authorInitial = (blog.author || 'C').trim().charAt(0).toUpperCase();

  return (
    <div className="store-blog-detail-page pb-24">

      {/* ── 1. Consistent Luxury Dark Hero Header (Matching Inner Pages) ── */}
      <section className="store-blog-detail-hero-section">
        <div className="store-about-ambient-glow" />

        <div className="store-container">
          {/* Frosted Glass Breadcrumbs */}
          <div className="store-about-breadcrumb">
            <Link href="/" className="store-about-bc-link">Home</Link>
            <ChevronRight size={12} className="store-about-bc-sep" />
            <Link href="/blog" className="store-about-bc-link">Gifting Journal</Link>
            <ChevronRight size={12} className="store-about-bc-sep" />
            <span className="store-about-bc-current">{blog.category || 'Article'}</span>
          </div>

          {/* Article Main Headline */}
          <h1 className="store-blog-detail-hero-title">
            {blog.title}
          </h1>

          {/* Symmetrical Meta Row in Hero */}
          <div className="store-blog-detail-hero-meta-row">
            <div className="store-blog-detail-hero-meta-left">
              <div className="store-blog-detail-hero-meta-item">
                <User size={14} className="text-amber-400" />
                <span className="store-blog-detail-hero-author">
                  {blog.author || 'City Shop Editorial Desk'}
                </span>
              </div>

              <span className="store-blog-detail-hero-meta-dot">•</span>

              <div className="store-blog-detail-hero-meta-item">
                <Calendar size={14} />
                <span>{dateStr}</span>
              </div>

              <span className="store-blog-detail-hero-meta-dot">•</span>

              <div className="store-blog-detail-hero-meta-item">
                <Clock size={14} />
                <span>{blog.readTime || '4 min read'}</span>
              </div>

              {blog.views > 0 && (
                <>
                  <span className="store-blog-detail-hero-meta-dot">•</span>
                  <div className="store-blog-detail-hero-meta-item">
                    <Eye size={14} />
                    <span>{blog.views} views</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions: Share & Helpful */}
            <div className="store-blog-detail-hero-actions">
              <button
                type="button"
                onClick={handleShare}
                className="store-blog-hero-btn"
                title="Copy article link"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleLike}
                className={`store-blog-hero-btn ${isLiked ? 'is-liked' : ''}`}
                title="Vote as helpful"
              >
                <ThumbsUp size={13} />
                <span>{likesCount > 0 ? `Helpful (${likesCount})` : 'Helpful'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Two-Column Layout (Left Sidebar + Main Article Area) ── */}
      <section className="store-blog-detail-content-wrap">
        <div className="store-container">
          <div className="store-blog-detail-layout">

            {/* ══════════════════════════════════════════
              LEFT SIDEBAR: Related Stories & Navigation
             ══════════════════════════════════════════ */}
            <aside className="store-blog-sidebar">

              {/* Widget 1: Related Articles in Sidebar */}
              <div className="store-blog-sidebar-card">
                <div className="store-blog-sidebar-header">
                  <h3 className="store-blog-sidebar-title">
                    <BookOpen size={16} className="text-primary" />
                    <span>Related Stories</span>
                  </h3>
                  <Link href="/blog" className="store-blog-sidebar-viewall">
                    <span>View all</span>
                    <ArrowUpRight size={12} />
                  </Link>
                </div>

                {related && related.length > 0 ? (
                  <div className="space-y-1">
                    {related.map((item) => {
                      const relDate = item.publishedAt
                        ? new Date(item.publishedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short'
                        })
                        : 'Recent';

                      return (
                        <Link
                          key={item.slug}
                          href={`/blog/${item.slug}`}
                          className="store-blog-sidebar-item group"
                        >
                          <div className="store-blog-sidebar-thumb">
                            <img
                              src={item.coverImage || FALLBACK_IMAGE}
                              alt={item.title}
                              className="store-blog-sidebar-thumb-img"
                              onError={(e) => {
                                e.currentTarget.src = FALLBACK_IMAGE;
                              }}
                            />
                          </div>

                          <div className="store-blog-sidebar-info">
                            <div className="store-blog-sidebar-meta">
                              <span className="store-blog-sidebar-cat">
                                {item.category || 'Gifting'}
                              </span>
                              <span>•</span>
                              <span>{relDate}</span>
                            </div>
                            <h4 className="store-blog-sidebar-item-title">
                              {item.title}
                            </h4>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-2">
                    No other articles in this category yet.
                  </p>
                )}
              </div>

              {/* Widget 2: Explore Categories in Sidebar */}
              {categories && categories.length > 0 && (
                <div className="store-blog-sidebar-card">
                  <div className="store-blog-sidebar-header">
                    <h3 className="store-blog-sidebar-title">
                      <FolderKanban size={16} className="text-primary" />
                      <span>Explore Topics</span>
                    </h3>
                  </div>

                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id || cat.label}
                        href={`/blog?category=${encodeURIComponent(cat.label || cat.id)}`}
                        className="store-blog-sidebar-cat-btn"
                      >
                        <span>{cat.label || cat.id}</span>
                        <span className="store-blog-sidebar-cat-count">
                          <ChevronRight size={12} />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Widget 3: Gifting Concierge Consultation */}
              <div className="store-blog-concierge-card">
                <div className="store-blog-concierge-badge">
                  <Headphones size={13} />
                  <span>Gifting Concierge</span>
                </div>
                <h4 className="store-blog-concierge-title">
                  Need Help Picking the Perfect Surprise?
                </h4>
                <p className="store-blog-concierge-desc">
                  Our bespoke celebration stylists are available 24/7 to curate customized flower & cake combinations.
                </p>
                <Link
                  href="/contact"
                  className="store-blog-concierge-btn"
                >
                  <span>Talk to a Stylist</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>

            </aside>

            {/* ══════════════════════════════════════════
              RIGHT COLUMN: Main Article Content
             ══════════════════════════════════════════ */}
            <main className="store-blog-main-content">

              {/* Cover Image Frame */}
              <div className="store-blog-detail-cover-box">
                <img
                  src={blog.coverImage || FALLBACK_IMAGE}
                  alt={blog.title}
                  className="store-blog-detail-cover-img"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
              </div>

              {/* Rich Article Prose */}
              <article
                className="store-blog-prose"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

              {/* 1-Vote Helpful Feedback Strip */}
              <div className="store-blog-helpful-card">
                <div>
                  <h4 className="store-blog-helpful-title">
                    Did you find this celebration guide helpful?
                  </h4>
                  <p className="store-blog-helpful-sub">
                    Your feedback helps our florists and pastry chefs create more inspiring articles.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`store-blog-helpful-action-btn ${isLiked ? 'is-liked' : ''}`}
                >
                  <ThumbsUp size={14} />
                  <span>{likesCount > 0 ? `Helpful (${likesCount})` : 'Helpful'}</span>
                </button>
              </div>

              {/* Author Bio Card */}
              <div className="store-blog-author-box">
                <div className="store-blog-author-avatar-big">
                  {authorInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="store-blog-author-name-row">
                    <span className="store-blog-author-name-text">
                      Written by {blog.author || 'City Shop Editorial Desk'}
                    </span>
                    <span className="store-blog-author-badge">
                      Verified Gifting Expert
                    </span>
                  </div>
                  <p className="store-blog-author-desc">
                    Our in-house collective of master florists, certified pastry artisans, and celebration concierges curating flower care guides, flavor profiles, and milestone inspiration.
                  </p>
                </div>
              </div>

              {/* Back to Blog Journal Link */}
              <div className="store-blog-detail-back-bar">
                <Link href="/blog" className="store-blog-detail-back-btn">
                  <ArrowLeft size={14} />
                  <span>Back to Gifting Journal</span>
                </Link>
              </div>

            </main>

          </div>
        </div>
      </section>

    </div>
  );
}
