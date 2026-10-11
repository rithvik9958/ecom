"use client";

import SingleContactForm from "src/components/features/forms/MultiStepContactForm";

export default function ContactSection({ data }) {
  const subTitle = data?.contactSubTitle || "Get In Touch";
  const title    = data?.contactTitle    || "Contact Us";
  const desc     = data?.contactDescription || "Looking for reliable coiled solutions? Our experts are ready to assist you.";
  const mapUrl   = data?.mapIframeUrl    || "";

  return (
    <section className="two section my-0 crop-bg" id="scroll-section">
      <style>{`
        /* ── Contact Section Layout ───────────────── */
        .cs-header {
          margin-bottom: 2rem;
        }
        .cs-header__desc {
          max-width: 800px;
          font-size: 15px;
          color: #9ca3af;
          font-weight: 400;
          margin: 2px 0 0 0;
          line-height: 1.6;
        }
        .cs-map-strip {
          width: 100%;
          height: 220px;
          border: 0;
          border-radius: 12px;
          margin-top: 2.5rem;
          display: block;
        }
        .cs-map-strip[src=""] { display: none; }
      `}</style>

      <div className="container">
        {/* ── Top: heading + description side by side ── */}
        <div className="cs-header">
          <div className="section-title two" style={{ marginBottom: 0 }}>
            {subTitle && <span>{subTitle}</span>}
            <h2 style={{ marginBottom: 0 }}>{title}</h2>
            <p className="cs-header__desc">{desc}</p>
          </div>
        </div>

        {/* ── Full-width form ── */}
        <SingleContactForm />

        {/* ── Map strip below form ── */}
        {mapUrl && (
          <iframe
            src={mapUrl}
            className="cs-map-strip"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Map"
          />
        )}
      </div>
    </section>
  );
}
