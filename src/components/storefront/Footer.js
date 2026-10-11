'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Sparkles,
  Mail,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lock,
  ExternalLink
} from 'lucide-react';
import showToast from '@/lib/storeToast';
import { DEFAULT_ECOM_FOOTER } from '@/lib/defaultFooter';
import SocialIcon from '@/components/storefront/SocialIcons';

export default function StorefrontFooter() {
  const pathname = usePathname();
  const [footerData, setFooterData] = useState(DEFAULT_ECOM_FOOTER);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loadingSubscribe, setLoadingSubscribe] = useState(false);

  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(p => pathname?.startsWith(p));

  // ⚠️ MUST declare ALL hooks before any early return (Rules of Hooks)
  const [discountCode, setDiscountCode] = useState('');

  useEffect(() => {
    fetchFooter();
  }, []);

  const fetchFooter = async () => {
    try {
      const res = await fetch('/api/store-footer', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.footer) {
        setFooterData(data.footer);
      }
    } catch (err) {
      console.error('Error fetching footer data:', err);
    }
  };

  if (isAuthPage) return null;

  const { aboutSection, columns, newsletter, corporate, bottomBar } = footerData || DEFAULT_ECOM_FOOTER;
  const visibleColumns = (columns || DEFAULT_ECOM_FOOTER.columns).filter(col => col.isVisible !== false);
  const hasNewsletter = newsletter?.isVisible !== false;
  const linkCount = visibleColumns.length;

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showToast.error('Please enter a valid email address');
      return;
    }
    setLoadingSubscribe(true);
    try {
      const res = await fetch('/api/store-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const data = await res.json();
      if (data.success) {
        setIsSubscribed(true);
        if (data.discountCode) setDiscountCode(data.discountCode);
        showToast.success(data.message || `Subscribed! 🎉 Use code ${data.discountCode || newsletter?.discountCode || 'WELCOME150'} for discount.`);
      } else {
        showToast.error(data.message || 'Failed to subscribe. Please try again.');
      }
    } catch (err) {
      console.error('Newsletter subscribe error:', err);
      showToast.error('Network error. Please try again.');
    } finally {
      setLoadingSubscribe(false);
    }
  };

  return (
    <footer className="city-footer">
      
      {/* ── 1. Dynamic Top SEO / Brand Narrative Story Block (Homepage Only) ── */}
      {aboutSection?.isVisible !== false && pathname === '/' && (
        <section className="city-footer-narrative-section">
          <div className="city-footer-container">
            <div className="city-footer-narrative-modern">
              <div className="city-footer-narrative-top-row">
                <div className="city-footer-narrative-heading-group">
                  {aboutSection?.badge && (
                    <div className="city-footer-narrative-badge">
                      <Sparkles size={12} /> {aboutSection.badge}
                    </div>
                  )}
                  {aboutSection?.title && (
                    <h2 className="city-footer-narrative-title">
                      {aboutSection.title}
                    </h2>
                  )}
                </div>

                {/* Modern Trust & Milestone Capsules */}
                <div className="city-footer-trust-capsules">
                  {(aboutSection?.stats || DEFAULT_ECOM_FOOTER.aboutSection.stats || []).map((st, i) => (
                    <div key={i} className="city-footer-trust-pill">
                      <span className="city-footer-trust-num">{st.num}</span>
                      <span className="city-footer-trust-label">{st.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Rich Text Story with Smooth Fade Collapse/Expand */}
              <div className="city-footer-narrative-content-wrap">
                <div
                  className={`city-footer-narrative-body ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}
                  dangerouslySetInnerHTML={{
                    __html: aboutSection?.content || DEFAULT_ECOM_FOOTER.aboutSection.content
                  }}
                />

                {/* Minimal Read More Toggle Button */}
                <div className="city-footer-toggle-wrap">
                  <button
                    type="button"
                    className="city-footer-narrative-toggle"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? 'Show Less Story' : 'Read Full Gifting & Delivery Story'}</span>
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 2. Dynamic Multi-Column Directory & Newsletter Hub ── */}
      <section className="city-footer-links-section">
        <div className="city-footer-container">
          <div
            className={`city-footer-grid ${hasNewsletter ? 'has-newsletter' : 'no-newsletter'}`}
            style={{
              '--footer-link-cols': linkCount,
              '--footer-total-cols': linkCount + (hasNewsletter ? 1 : 0)
            }}
          >
            {/* Dynamic Columns from Database */}
            {visibleColumns.map((column, colIdx) => (
                  <div key={column.id || colIdx} className="city-footer-col">
                    <h3 className="city-footer-col-title">{column.title}</h3>
                    <ul className="city-footer-links-list">
                      {(column.links || []).map((link, linkIdx) => (
                        <li key={linkIdx}>
                          {link.isExternal ? (
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="city-footer-link"
                            >
                              <span className="city-footer-link-label">{link.label}</span>
                              {link.badge && (
                                <span className="city-footer-pill">{link.badge}</span>
                              )}
                              <ExternalLink size={11} className="city-footer-ext-icon" />
                            </a>
                          ) : (
                            <Link href={link.url || '#'} className="city-footer-link">
                              <span className="city-footer-link-label">{link.label}</span>
                              {link.badge && (
                                <span className="city-footer-pill">{link.badge}</span>
                              )}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

            {/* Column: VIP Newsletter & Helpline Hub */}
            {newsletter?.isVisible !== false && (
              <div className="city-footer-col city-footer-col-subscribe">
                <h3 className="city-footer-col-title">{newsletter?.title || 'Subscribe & Save'}</h3>
                <p className="city-footer-subscribe-desc">
                  {newsletter?.subtitle || 'Get instant ₹150 OFF on your first order, plus secret deals and festive gift previews.'}
                </p>

                {isSubscribed ? (
                  <div className="city-footer-subscribed-card">
                    <div className="city-footer-subscribed-icon">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <p className="city-footer-subscribed-title">Welcome to VIP Gifting Club!</p>
                      <p className="city-footer-subscribed-text">
                        Use voucher code <strong>{discountCode || newsletter?.discountCode || 'WELCOME150'}</strong> at checkout.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="city-footer-subscribe-form">
                    <div className="city-footer-input-group">
                      <Mail size={15} className="city-footer-input-icon" />
                      <input
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                        className="city-footer-email-input"
                      />
                      <button
                        type="submit"
                        disabled={loadingSubscribe}
                        className="city-footer-submit-btn"
                        aria-label="Subscribe"
                      >
                        {loadingSubscribe ? (
                          <span className="city-footer-btn-spinner" />
                        ) : (
                          <ArrowRight size={15} />
                        )}
                      </button>
                    </div>
                    <div className="city-footer-privacy-hint">
                      <Lock size={11} /> 100% spam-free. Unsubscribe anytime.
                    </div>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ── 3. Dynamic Corporate Statutory & Compliance Strip ── */}
      {corporate?.isVisible !== false && (() => {
        const line1Parts = [];
        if (corporate?.companyName) {
          line1Parts.push(<strong key="cname">{corporate.companyName}</strong>);
        }
        if (corporate?.cin) {
          line1Parts.push(<span key="ccin">CIN: {corporate.cin}</span>);
        }
        if (corporate?.regOffice) {
          line1Parts.push(<span key="creg">Regd. Office: {corporate.regOffice}</span>);
        }

        const line2Parts = [];
        if (corporate?.grievanceOfficer) {
          line2Parts.push(<span key="cgriev">Grievance Resolution Desk: {corporate.grievanceOfficer}</span>);
        }
        if (corporate?.helpline) {
          line2Parts.push(
            <span key="chelp">
              Helpline: {corporate.helpline}
              {corporate?.hours ? ` (${corporate.hours})` : ''}
            </span>
          );
        }

        const hasLinks = Array.isArray(corporate?.complianceLinks) && corporate.complianceLinks.length > 0;
        const hasAnyContent = line1Parts.length > 0 || line2Parts.length > 0 || hasLinks;

        if (!hasAnyContent) return null;

        return (
          <section className="city-footer-corporate-section">
            <div className="city-footer-container">
              <div className="city-footer-corporate-inner">
                <div className="city-footer-corporate-info">
                  {line1Parts.length > 0 && (
                    <p className="city-footer-corporate-line">
                      {line1Parts.reduce((acc, curr, idx) => [
                        acc,
                        <span key={`sep1-${idx}`} className="city-footer-corp-sep"> &nbsp;|&nbsp; </span>,
                        curr
                      ])}
                    </p>
                  )}
                  {line2Parts.length > 0 && (
                    <p className="city-footer-corporate-line">
                      {line2Parts.reduce((acc, curr, idx) => [
                        acc,
                        <span key={`sep2-${idx}`} className="city-footer-corp-sep"> &nbsp;|&nbsp; </span>,
                        curr
                      ])}
                    </p>
                  )}
                </div>

                {hasLinks && (
                  <div className="city-footer-compliance-links">
                    {corporate.complianceLinks.map((item, idx) => (
                      <Link key={idx} href={item.url || '#'} className="city-footer-comp-link">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── 4. Dynamic Bottom Bar: Social Profiles, Copyright & Payment Badges ── */}
      <div className="city-footer-bottom-section">
        <div className="city-footer-container">
          <div className="city-footer-bottom-inner">
            
            {/* Social Profile Buttons */}
            <div className="city-footer-social-cluster">
              {(bottomBar?.socialLinks || DEFAULT_ECOM_FOOTER.bottomBar.socialLinks)
                .filter(s => s.isActive !== false)
                .map((social, idx) => (
                  <a
                    key={idx}
                    href={social.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="city-footer-social-btn"
                    aria-label={social.platform}
                    title={social.platform}
                  >
                    <SocialIcon platform={social.platform || social.icon} size={15} />
                  </a>
                ))}
            </div>

            {/* Copyright Statement */}
            <div className="city-footer-copyright">
              {bottomBar?.copyright || `© 1994–${new Date().getFullYear()} City Shop E-Retail Pvt. Ltd. All rights reserved.`}
            </div>

          </div>
        </div>
      </div>

    </footer>
  );
}
