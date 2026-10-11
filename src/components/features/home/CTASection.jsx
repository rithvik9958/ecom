import Link from "next/link";
import PopupCtaForm from "src/components/core/PopupCtaForm";
import { ZoomIn, TextRevealScrub } from "../../animations/GSAPWrapper";

export default function CTASection({ data, extra }) {
  const subtitle = extra?.contact_subtitle;
  const title = data?.title || "Looking for Precision Steel Solutions?";
  const content =
    data?.content ||
    "Partner with a trusted manufacturer of precision stainless steel strips, foils, and alloy steel products.";
  const bgImage = data?.image || null;

  return (
    <div className="footer-top-banner-section section my-0 patt-bg position-relative">
      <div className="container">
        <ZoomIn duration={1} scale={0.95}>
          <div
            className="footer-top-banner-wrap rounded-4 position-relative overflow-hidden shadow-lg"
            style={{ padding: 'clamp(32px, 6vw, 60px) clamp(20px, 5vw, 40px)', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
          >

            <div className="section-title white text-center mb-5">
              {/* {subtitle && <span className="text-uppercase fw-semibold" style={{ color: '#94a3b8', letterSpacing: '2px' }}>{subtitle}</span>} */}

              <h2 className="display-5 fw-bold mt-3 mb-4">{title}</h2>

              <TextRevealScrub>
                <div
                  className="text-light fs-5 mx-auto"
                  style={{ maxWidth: '700px', color: '#cbd5e1', lineHeight: '1.6' }}
                  dangerouslySetInnerHTML={{ __html: content }}
                ></div>
              </TextRevealScrub>
            </div>

            <div className="btn-grp justify-content-center d-flex gap-3 flex-wrap">
              <PopupCtaForm
                buttonText="Know More"
                buttonClass="primary-btn1 white-bg px-5 py-3 rounded-pill fw-bold"
              />

              <Link href="/contact" className="btn btn-outline-light px-5 py-3 rounded-pill fw-bold d-flex align-items-center gap-2 hover-bg-white hover-text-dark transition-all">
                Contact Our Experts
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 9 9"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0.0445549 0H9.00008V1.67647L1.69308 9L0 7.32353L4.99014 2.38235L0.0445549 2.42647V0Z" />
                  <path d="M9.0002 8.99999V3.35294L6.59424 5.73529V8.99999H9.0002Z" />
                </svg>
              </Link>
            </div>
          </div>
        </ZoomIn>
      </div>

      <svg
        className="arrow-vector"
        width="147"
        height="147"
        viewBox="0 0 147 147"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <path d="M0.727728 0H147.001V27.3823L27.6537 147L0 119.617L81.5055 38.9117L0.727728 39.6323V0Z" />
          <path d="M147.002 146.999V54.7637L107.705 93.6754V146.999H147.002Z" />
        </g>
      </svg>
    </div>
  );
}
