import Image from "next/image";
import Link from "next/link";
import { FadeInLeft, FadeInRight, ParallaxImage, TextRevealScrub } from "../../animations/GSAPWrapper";

export default function CompanyOverview({ data }) {
  const title = data?.title || "Company Overview";
  const description = data?.description || `Jindal Metals & Alloys Ltd as a subsidiary unit of Jindal
                  SAW Ltd. (part of the multi-billion dollar diversified O.P.
                  Jindal Group – a frontrunner in Total Pipe Solutions).
                  Jindal Metals & Alloys Ltd began operations over more than
                  four decades ago and has an enviable track record of
                  stability, trust and growth in the industry.

                  Jindal innovates to produce thin & Ultra-thin Precision Stainless Steel Strips with the Perfect balance of Quality, turning ideas into new processes through Partnering customers in Product development with the Philosophy of Engineering Satisfaction which offers technically & economically adapted and viable Niche Product for highly Niche Market.`;
  const image = data?.image || "/images/about.jpeg";
  const alt = data?.alt || "about";

  return (
    <section className="home3-company-info-section section my-5 overflow-hidden">
      <div className="container">
        <div className="row gy-md-5 gy-4 align-items-center">

          {/* Left Image */}
          <div className="col-lg-6 ss ss2 position-relative">
            <FadeInLeft duration={1.2} className="position-relative z-3">
              <div
                className="company-info-img-and-countdown-area z-2"
                style={{ padding: 'clamp(12px, 4vw, 48px)' }}
              >

                <div className="info-img magnetic-item">
                  <div
                    className="position-relative overflow-hidden"
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 4",
                    }}
                  >
                    <ParallaxImage speed={1.2}>
                      <Image
                        src={image}
                        alt={alt}
                        fill
                        className="object-fit-cover img-fluid"
                      />
                    </ParallaxImage>
                  </div>
                </div>
              </div>
            </FadeInLeft>
          </div>

          {/* Right Content */}
          <div className="col-lg-6">
            <FadeInRight duration={1.2} delay={0.2}>
              <div className="company-info-content about-line position-relative py-5 px-4 z-2">
                <div className=" z-2 p-first position-relative" style={{ backgroundColor: "#ffffff" }}>
                  <h2>{title}</h2>

                  <TextRevealScrub>
                    <div className="mb-4" dangerouslySetInnerHTML={{ __html: description }}></div>
                  </TextRevealScrub>

                  <Link href={data?.link || "/about-us"} className="primary-btn2 two mx-3" style={{ backgroundColor: "#ffffff" }}>
                    <span>Know More</span>

                    <svg
                      className="arrow"
                      width="23"
                      height="23"
                      viewBox="0 0 23 23"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g>
                        <path d="M0.113861 0H22.9999V4.28425L4.32671 22.9997L0 18.7154L12.7524 6.08815L0.113861 6.20089V0Z"></path>
                        <path d="M23 22.9996V8.56848L16.8516 14.6566V22.9996H23Z"></path>
                      </g>
                    </svg>
                  </Link>
                </div>
              </div>
            </FadeInRight>
          </div>
        </div>
      </div>
    </section>
  );
}