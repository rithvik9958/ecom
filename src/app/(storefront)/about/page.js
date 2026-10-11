'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Heart,
  Truck,
  ShieldCheck,
  Award,
  Users,
  Clock,
  CheckCircle2,
  Leaf,
  ChevronRight,
  Target,
  Quote
} from 'lucide-react';
import { DEFAULT_ECOM_ABOUT } from '@/lib/defaultAbout';

const ICON_MAP = {
  Leaf,
  Award,
  Clock,
  Heart,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Target
};

export default function AboutPage() {
  const [data, setData] = useState(DEFAULT_ECOM_ABOUT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/store-about')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.about) {
          setData(d.about);
        }
      })
      .catch((err) => {
        console.error('Error loading about data:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const hero = data.hero || DEFAULT_ECOM_ABOUT.hero;
  const story = data.story || DEFAULT_ECOM_ABOUT.story;
  const customContent = data.customContent || DEFAULT_ECOM_ABOUT.customContent;
  const pillars = data.pillars || DEFAULT_ECOM_ABOUT.pillars;
  const missionVision = data.missionVision || DEFAULT_ECOM_ABOUT.missionVision;

  return (
    <div className="store-about-page">
      
      {/* ── 1. Hero Header Banner (Symmetric with Custom Page Header) ── */}
      <section className="store-about-hero-banner">
        {hero.bannerImage ? (
          <>
            <div
              className="store-about-bg-img"
              style={{ backgroundImage: `url('${hero.bannerImage}')` }}
            />
            <div className="store-about-bg-overlay" />
          </>
        ) : (
          <div className="store-about-ambient-glow" />
        )}

        <div className="store-about-header-container relative z-10">
          {/* Frosted Glass Breadcrumb */}
          <div className="store-about-breadcrumb">
            <Link href="/" className="store-about-bc-link">Home</Link>
            <ChevronRight size={12} className="store-about-bc-sep" />
            <span className="store-about-bc-current">About Us</span>
          </div>

          <div className="store-about-hero-content">
            <h1 className="store-about-title">{hero.title}</h1>
            {hero.subtitle && (
              <p className="store-about-subtitle">{hero.subtitle}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. Brand Story & Journey Section (Left Text + Quote & Right Pure Image) ── */}
      <section className="store-about-story-section">
        <div className="store-container">
          <div className="store-about-story-grid">
            
            {/* Left Story Column: Tag, Heading, Paragraphs, Highlights & Founder Quote */}
            <div className="store-about-story-text">
              <span className="store-about-tag-badge">{story.tag || 'OUR JOURNEY'}</span>
              <h2 className="store-about-heading">{story.heading}</h2>

              <div className="store-about-paragraphs">
                {(story.paragraphs || []).map((p, idx) => (
                  <p key={idx} className="store-about-paragraph">{p}</p>
                ))}
              </div>

              {/* Highlights List */}
              {story.highlights && story.highlights.length > 0 && (
                <div className="store-about-highlights">
                  {story.highlights.map((item, idx) => (
                    <div key={idx} className="store-about-highlight-item">
                      <CheckCircle2 size={17} className="text-emerald-500 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Founder's Philosophy Quote Box (Neatly integrated on left side) */}
              {story.quote?.text && (
                <div className="store-about-quote-card">
                  <div className="store-about-quote-header">
                    <div className="store-about-quote-badge">
                      <Sparkles size={12} /> {story.quote?.badge || 'FOUNDER’S PHILOSOPHY'}
                    </div>
                    <Quote size={22} className="store-about-quote-icon" />
                  </div>

                  <blockquote className="store-about-quote-body">
                    {story.quote?.text}
                  </blockquote>

                  <div className="store-about-quote-footer">
                    <div className="store-about-quote-author">
                      <p className="store-about-author-name">{story.quote?.authorName}</p>
                      <p className="store-about-author-role">{story.quote?.authorRole}</p>
                    </div>
                    <div className="store-about-quote-stamp">
                      <Award size={18} className="text-amber-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Story Column: Pure Featured Atelier / Studio Image Card */}
            <div className="store-about-story-media-col">
              <div className="store-about-story-img-card">
                <img
                  src={story.image || '/images/slide1.jpg'}
                  alt={story.alt || 'City Shop Master Studio & Craftsmanship'}
                  className="store-about-story-img"
                />
                {story.experienceYears && (
                  <div className="store-about-img-badge">
                    <span className="store-about-img-badge-num">{story.experienceYears}</span>
                    <span className="store-about-img-badge-text">{story.experienceLabel || 'Years of Crafting Smiles'}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. Custom Rich Content Section (CKEditor Pure Content Block) ── */}
      {customContent?.isVisible !== false && customContent?.content && (
        <section className="store-about-custom-section">
          <div className="store-container">
            <div
              className="store-about-custom-prose"
              dangerouslySetInnerHTML={{ __html: customContent.content }}
            />
          </div>
        </section>
      )}

      {/* ── 4. Pillars of Craftsmanship & Excellence (Unified Luxury Design) ── */}
      <section className="store-about-pillars-section">
        <div className="store-container">
          
          {/* Symmetric, Balanced Section Header */}
          <div className="store-about-pillars-header text-center">
            <div className="store-about-tag-badge">
              <Sparkles size={12} className="text-amber-500" />
              <span>{pillars.tag || 'THE CITY SHOP PROMISE'}</span>
            </div>
            <h2 className="store-about-heading store-about-pillars-title">
              {pillars.heading}
            </h2>
            {pillars.subtitle && (
              <p className="store-about-pillars-subtitle">
                {pillars.subtitle}
              </p>
            )}
          </div>

          {/* 4 Pillars Grid (Centered) */}
          <div className="store-about-pillars-grid">
            {(pillars.items || []).map((pillar, idx) => {
              const Icon = ICON_MAP[pillar.icon] || Award;

              return (
                <div key={idx} className="store-about-pillar-card">
                  <div className="store-about-pillar-icon-wrapper">
                    {pillar.image ? (
                      <img
                        src={pillar.image}
                        alt={pillar.title}
                        className="store-about-pillar-custom-img"
                      />
                    ) : (
                      <Icon size={24} className="store-about-pillar-icon" />
                    )}
                  </div>
                  
                  <h3 className="store-about-pillar-title">{pillar.title}</h3>
                  <p className="store-about-pillar-desc">{pillar.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── 5. Mission, Vision & Absolute Promise (Bento Cards) ── */}
      {missionVision?.isVisible !== false && (
        <section className="store-about-mission-section">
          <div className="store-container">
            <div className="store-about-mission-grid">
              
              {/* Mission */}
              <div className="store-about-mission-card mission-variant">
                <div className="store-about-mission-icon-box">
                  <Target size={22} className="text-blue-500" />
                </div>
                <h3 className="store-about-mission-title">
                  {missionVision.missionTitle || 'Our Purpose & Mission'}
                </h3>
                <p className="store-about-mission-desc">{missionVision.missionText}</p>
              </div>

              {/* Vision */}
              <div className="store-about-mission-card vision-variant">
                <div className="store-about-mission-icon-box">
                  <Sparkles size={22} className="text-amber-500" />
                </div>
                <h3 className="store-about-mission-title">
                  {missionVision.visionTitle || 'Our Future Vision'}
                </h3>
                <p className="store-about-mission-desc">{missionVision.visionText}</p>
              </div>

              {/* Promise */}
              <div className="store-about-mission-card promise-variant">
                <div className="store-about-mission-icon-box">
                  <ShieldCheck size={22} className="text-emerald-500" />
                </div>
                <h3 className="store-about-mission-title">
                  {missionVision.promiseTitle || 'Our Absolute Promise'}
                </h3>
                <p className="store-about-mission-desc">{missionVision.promiseText}</p>
              </div>

            </div>
          </div>
        </section>
      )}

    </div>
  );
}
