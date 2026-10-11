'use client';
import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  Clock,
  ChevronRight,
  HelpCircle,
  Phone,
  Mail,
  Lock,
  Calendar,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import showToast from '@/lib/storeToast';

const POLICY_NAV_LINKS = [
  { label: 'Terms & Conditions', slug: 'terms', icon: FileText },
  { label: 'Privacy Policy', slug: 'privacy', icon: Lock },
  { label: 'Return & Refund Policy', slug: 'returns-policy', icon: ShieldCheck },
  { label: 'Shipping & Delivery Policy', slug: 'shipping-policy', icon: Clock },
  { label: 'Terms of Use & Disclaimer', slug: 'disclaimer', icon: HelpCircle },
  { label: 'Security & Compliance', slug: 'security', icon: ShieldCheck },
  { label: 'CSR Policy', slug: 'csr-policy', icon: FileText },
  { label: 'Investor Relations', slug: 'investor-relations', icon: FileText },
  { label: 'Code of Conduct', slug: 'code-of-conduct', icon: FileText },
  { label: 'Whistleblower Policy', slug: 'whistleblower', icon: FileText }
];

const getPolicyIcon = (slug = '', title = '') => {
  const s = `${slug} ${title}`.toLowerCase();
  if (s.includes('privacy') || s.includes('lock')) return Lock;
  if (s.includes('return') || s.includes('refund') || s.includes('shield') || s.includes('security') || s.includes('compliance')) return ShieldCheck;
  if (s.includes('shipping') || s.includes('delivery') || s.includes('track') || s.includes('clock') || s.includes('time')) return Clock;
  if (s.includes('disclaimer') || s.includes('faq') || s.includes('help') || s.includes('question')) return HelpCircle;
  return FileText;
};

export default function DynamicCustomPage() {
  const params = useParams();
  const slug = params?.slug;

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allPages, setAllPages] = useState([]);

  useEffect(() => {
    if (!slug) return;
    fetchPageData();
  }, [slug]);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      const [pageRes, listRes] = await Promise.all([
        fetch(`/api/store-custom-pages?slug=${slug}`),
        fetch('/api/store-custom-pages')
      ]);

      const pageData = await pageRes.json();
      const listData = await listRes.json();

      if (pageData.success && pageData.page) {
        setPage(pageData.page);
      } else {
        setPage(null);
      }

      if (listData.success && listData.pages) {
        setAllPages(listData.pages);
      }
    } catch (err) {
      console.error('Error loading custom page:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="store-page-wrapper">
        <div className="store-container py-12">
          <div className="store-skeleton-loader max-w-4xl mx-auto space-y-4">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-64 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="store-page-wrapper">
        <div className="store-container py-20 text-center">
          <FileText size={48} className="mx-auto text-slate-400 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Page Not Found</h1>
          <p className="text-sm text-slate-500 mt-2">The requested policy or custom document does not exist.</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white dark:bg-blue-600 rounded-xl text-xs font-bold hover:opacity-90"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const wordCount = (page.content || '').replace(/<[^>]*>?/gm, '').trim().split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="store-custom-policy-page">
      
      {/* ── Dynamic Ultra-Modern Page Header / Hero ── */}
      <section className="store-custom-policy-header">
        {page.bannerImage ? (
          <>
            <div
              className="store-policy-bg-img"
              style={{ backgroundImage: `url('${page.bannerImage}')` }}
            />
            <div className="store-policy-bg-overlay" />
          </>
        ) : (
          <div className="store-policy-ambient-glow" />
        )}

        <div className="store-policy-header-container relative z-10">
          
          {/* Frosted Glass Breadcrumb */}
          <div className="store-policy-breadcrumb">
            <Link href="/" className="store-policy-bc-link">Home</Link>
            <ChevronRight size={12} className="store-policy-bc-sep" />
            <span className="store-policy-bc-mid">Legal & Policies</span>
            <ChevronRight size={12} className="store-policy-bc-sep" />
            <span className="store-policy-bc-current">{page.title}</span>
          </div>

          <div className="store-policy-hero">
            <div className="store-policy-hero-info">
              <h1 className="store-policy-title">{page.title}</h1>

              <div className="store-policy-meta-strip">
                <div className="store-policy-meta-item">
                  <Calendar size={13} className="text-slate-400" />
                  <span>
                    Updated {new Date(page.updatedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <span className="store-policy-meta-sep">•</span>
                <div className="store-policy-meta-item">
                  <Clock size={13} className="text-slate-400" />
                  <span>{readTimeMinutes} min read</span>
                </div>
                <span className="store-policy-meta-sep">•</span>
                <div className="store-policy-meta-item">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>Legally Binding & Compliant</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Main Layout: Seamless Sidebar & Editorial Content ── */}
      <div className="store-container store-policy-content-container">
        <div className="store-policy-layout">
          
          {/* Left Sticky Policy Navigation Sidebar */}
          <aside className="store-policy-sidebar">
            <div className="store-policy-sidebar-card">
              <h3 className="store-policy-sidebar-title">All Policies & Compliance</h3>
              <nav className="store-policy-nav-list">
                {((allPages && allPages.length > 0)
                  ? allPages.map((p) => ({
                      label: p.title,
                      slug: p.slug,
                      icon: getPolicyIcon(p.slug, p.title)
                    }))
                  : POLICY_NAV_LINKS
                ).map((item) => {
                  const isActive = slug === item.slug;
                  const Icon = item.icon || FileText;
                  return (
                    <Link
                      key={item.slug}
                      href={`/${item.slug}`}
                      className={`store-policy-nav-item ${isActive ? 'is-active' : ''}`}
                    >
                      <Icon size={15} className="store-policy-nav-icon" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Need Clarification Support Box */}
              <div className="store-policy-helpbox">
                <h4 className="store-policy-helpbox-title">Have a Policy Question?</h4>
                <p className="store-policy-helpbox-desc">
                  Our customer compliance desk is available 24/7 to assist you.
                </p>
                <div className="store-policy-helpbox-contacts">
                  <a href="tel:+911126802680" className="store-policy-helpbox-link">
                    <Phone size={13} /> +91 11-26802680
                  </a>
                  <a href="mailto:grievance@cityshop.com" className="store-policy-helpbox-link">
                    <Mail size={13} /> grievance@cityshop.com
                  </a>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Rich Prose Content */}
          <main className="store-policy-main">
            <article className="store-policy-article">
              {/* Document Header Ribbon */}
              <div className="store-policy-doc-header">
                <div className="store-policy-doc-tag">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Official Policy Document</span>
                </div>
                <div className="store-policy-doc-sec">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  <span>Compliance Directorate</span>
                </div>
              </div>

              <div
                className="store-policy-prose"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />

              <div className="store-policy-footer-note">
                <HelpCircle size={16} className="store-policy-footer-icon" />
                <p className="store-policy-footer-text">
                  For further assistance or legal inquiries regarding these terms, contact us at{' '}
                  <a href="mailto:legal@cityshop.com" className="underline font-semibold text-blue-600 dark:text-blue-400">legal@cityshop.com</a> or visit our{' '}
                  <Link href="/contact" className="underline font-semibold text-blue-600 dark:text-blue-400">Contact Desk</Link>.
                </p>
              </div>
            </article>
          </main>

        </div>
      </div>

    </div>
  );
}
