"use client";
import { FadeInUp } from "../../animations/GSAPWrapper";

/* ─────────────────────────────────────────────
   DEFAULT DATA
───────────────────────────────────────────── */
const defaultIndustries = [
  { title: "AUTOMOTIVE", image: "/images/slide1.jpg" },
  { title: "DEFENSE & AEROSPACE", image: "/images/slide2.jpg" },
  { title: "MEDICAL & SURGICAL", image: "/images/slide3.jpg" },
  { title: "ELECTRICALS & ELECTRONICS", image: "/images/stain.jpg" },
  { title: "KITCHENWARE & FOOD", image: "/images/cold.jpg" },
  { title: "IOT", image: "/images/about.jpg" },
  { title: "SOLAR & RENEWABLE ENERGY", image: "/images/cta.jpg" },
  { title: "ENERGY STORAGE & EV", image: "/images/motto.jpg" },
];

const defaultApplications = [
  { title: "Engine Gaskets", image: "/images/home1/about-img.jpg" },
  { title: "Heat Shields", image: "/images/slide1.jpg" },
  { title: "Flexi Hoses & Bellows", image: "/images/slide2.jpg" },
  { title: "Sensor Diaphragms", image: "/images/slide3.jpg" },
  { title: "Honeycombs", image: "/images/stain.jpg" },
  { title: "EMI/RF Shielding", image: "/images/cold.jpg" },
  { title: "Heat Exchangers", image: "/images/about.jpg" },
  { title: "Thermal Insulations", image: "/images/cta.jpg" },
  { title: "Hose Clamps", image: "/images/motto.jpg" },
];

/* ─────────────────────────────────────────────
   HELPER: polar to cartesian
───────────────────────────────────────────── */
function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/* ─────────────────────────────────────────────
   HELPER: smart word-wrap into ≤3 tspan lines
───────────────────────────────────────────── */
function TitleTspans({ title, x, maxChars }) {
  const words = title.split(" ");
  const limit = maxChars || 12;

  // Greedy pack words into lines respecting maxChars
  const lines = [];
  let current = [];
  for (const word of words) {
    const test = [...current, word].join(" ");
    if (test.length <= limit || current.length === 0) {
      current.push(word);
    } else {
      lines.push(current.join(" "));
      current = [word];
    }
  }
  if (current.length) lines.push(current.join(" "));

  // Cap at 3 lines
  const display = lines.slice(0, 3);
  const count = display.length;
  const lineH = 1.35; // em spacing between lines

  // Top-align the block so the first line is always at the same Y coordinate
  return display.map((line, i) => (
    <tspan
      key={i}
      x={x}
      dy={i === 0 ? "0" : `${lineH}em`}
    >
      {line}
    </tspan>
  ));
}

/* ─────────────────────────────────────────────
   RESPONSIVE GRID TIMELINE COMPONENT
───────────────────────────────────────────── */
function WindingTimeline({ items, id, accentColor }) {
  const n = items.length;
  if (n === 0) return null;

  return (
    <div className="wt-wrapper">
      <div className="wt-grid">
        {items.map((item, i) => {
          const color = accentColor || "#1a2980";

          return (
            <div className="wt-node-cell" key={`wt-node-${i}`}>
              <svg
                viewBox="-125 -125 250 340"
                className="wt-node-svg"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <clipPath id={`wt-clip-${id}-${i}`}>
                    <circle cx={0} cy={0} r={95} />
                  </clipPath>
                  <filter id={`wt-shadow-${id}-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="rgba(0,0,0,0.08)" />
                  </filter>
                </defs>

                {/* Node Group */}
                <g>
                  {/* Large white background card */}
                  <circle cx={0} cy={0} r={120} fill="#ffffff" filter={`url(#wt-shadow-${id}-${i})`} />

                  {/* Bold primary arc */}
                  <circle
                    cx={0} cy={0} r={105}
                    fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray="494 660"
                    transform={`rotate(${i % 2 === 0 ? 135 : -45})`}
                  />

                  {/* Main Image */}
                  <image
                    href={item.image}
                    x="-95" y="-95" width="190" height="190"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#wt-clip-${id}-${i})`}
                  />
                  
                  {/* Inner border */}
                  <circle cx={0} cy={0} r={95} fill="none" stroke="#e2e8f0" strokeWidth="1" />
                </g>

                {/* Text */}
                <g transform={`translate(0, 160)`}>
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="wt-title wt-title-desktop"
                    fill="#1e293b"
                    fontSize="18"
                    fontWeight="700"
                    letterSpacing="0.5px"
                  >
                    <TitleTspans title={item.title} x={0} maxChars={22} />
                  </text>
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="wt-title wt-title-mobile"
                    fill="#1e293b"
                    fontSize="18"
                    fontWeight="700"
                    letterSpacing="0.5px"
                  >
                    <TitleTspans title={item.title} x={0} maxChars={14} />
                  </text>
                </g>
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
export default function SegmentsSection({ segments, extra }) {
  let industries = segments?.filter(s => s.category === "Industry") || [];
  let applications = segments?.filter(s => s.category === "Application") || [];

  const bgPhotos = [
    "/images/slide1.jpg", "/images/slide2.jpg", "/images/slide3.jpg",
    "/images/stain.jpg", "/images/cold.jpg", "/images/about.jpg",
    "/images/cta.jpg", "/images/motto.jpg", "/images/home1/about-img.jpg",
  ];

  const fmt = (s, i) => {
    const logoUrl = s.logo || s.image || "";
    const isSvg = logoUrl.toLowerCase().endsWith(".svg");
    const bgImage = isSvg || !logoUrl ? bgPhotos[i % bgPhotos.length] : logoUrl;
    return { title: s.title || "", image: bgImage };
  };

  industries = industries.map(fmt);
  applications = applications.map(fmt);

  const title = extra?.work_title || "Our Focus Areas";

  return (
    <div className="seg-section">
      <style>{`
        .seg-section {
          background: #ffffff;
          padding: 60px 0;
          overflow: hidden;
        }
        .seg-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .seg-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .seg-title {
          font-size: clamp(26px, 3.5vw, 40px);
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
        }
        .seg-subtitle {
          font-size: 28px;
          font-weight: 800;
          color: #1e293b;
          text-align: center;
          margin: 0 0 0px 0;
          width: 100%;
        }
        
        /* 1-column grid */
        .seg-grid {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          width: 100%;
        }
        
        .seg-divider {
          border: 0;
          height: 1px;
          background: #cbd5e1;
          margin: 20px 40px;
          width: calc(100% - 80px);
        }

        .seg-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        /* Grid Timeline layout */
        .wt-wrapper {
          width: 100%;
          padding: 20px 0;
        }
        .wt-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          width: 100%;
          justify-items: center;
        }
        .wt-node-cell {
          width: 100%;
          max-width: 250px;
        }
        .wt-node-svg {
          display: block;
          width: 100%;
          height: auto;
          overflow: visible; /* To allow shadows to spill out */
        }
        
        .wt-title-mobile {
          display: none;
        }

        @media (max-width: 1024px) {
          .wt-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 30px 20px;
          }
        }
        
        @media (max-width: 768px) {
          .wt-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 40px 15px;
          }
          .wt-title-desktop {
            display: none;
          }
          .wt-title-mobile {
            display: block;
          }
          /* Increase the base font size for SVG text on mobile to compensate for the viewBox scaling */
          .wt-title { font-size: 21px; }
        }
      `}</style>

      <div className="seg-container">
        <div className="seg-grid">
          <FadeInUp duration={0.9} delay={0.1}>
            <div className="seg-block">
              <h3 className="seg-subtitle">Industries We Cater</h3>
              <WindingTimeline
                id="ind"
                items={industries}
                accentColor="#1a2980"
              />
            </div>
          </FadeInUp>

          <hr className="seg-divider" />

          <FadeInUp duration={0.9} delay={0.25}>
            <div className="seg-block">
              <h3 className="seg-subtitle">Critical End Applications</h3>
              <WindingTimeline
                id="app"
                items={applications}
                accentColor="#b91c1c"
              />
            </div>
          </FadeInUp>
        </div>
      </div>
    </div>
  );
}