import Image from "next/image";
import { FadeInUp, TextRevealScrub } from "../../animations/GSAPWrapper";

export default function MottoSection({ data }) {
  const subtitle = data?.subtitle || "Our Motto";
  const title = data?.title || "Our Motto";
  const content =
    data?.content ||
    "We are committed to creating sustainable value for our customers, employees, business partners, and stakeholders through continuous innovation, operational excellence, and responsible manufacturing practices. By delivering high-quality precision stainless steel and alloy steel solutions, we help industries improve performance, efficiency, and reliability in an increasingly competitive global marketplace.";

  return (
    <div className="section my-0 py-0 position-relative">
      <div
        className="banner-wrapper position-relative"
        style={{ height: "clamp(300px, 50vw, 500px)", overflow: "hidden" }}
      >
        <Image
          src={data?.image || "/images/motto.jpg"}
          alt={title}
          fill
          style={{
            objectFit: "cover",
            objectPosition: "center",
            transform: "scale(1.05)",
          }}
          className="hover-scale-slow"
          quality={90}
        />

        {/* Premium Dark Gradient Overlay */}
        <div
          className="position-absolute w-100 h-100"
          style={{
            top: 0,
            left: 0,
            background:
              "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 100%)",
          }}
        ></div>

        <div
          className="position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center px-4"
          style={{ top: 0, left: 0, zIndex: 1 }}
        >
          <FadeInUp duration={1}>
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <h2
                className="text-white fw-bold mb-4"
                style={{
                  letterSpacing: "-1px",
                  fontSize: "clamp(24px, 5vw, 52px)",
                  lineHeight: "1.2",
                }}
              >
                {title}
              </h2>
              <TextRevealScrub>
                <div
                  className="text-light"
                  style={{
                    lineHeight: "1.8",
                    fontWeight: "300",
                    fontSize: "clamp(14px, 1.8vw, 18px)",
                  }}
                  dangerouslySetInnerHTML={{ __html: content }}
                ></div>
              </TextRevealScrub>
            </div>
          </FadeInUp>
        </div>
      </div>
    </div>
  );
}