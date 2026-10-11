import Image from "next/image";

const defaultFeatures = [
  {
    id: 1,
    image: "/images/qc.png",
    title: "Precision Quality Assurance",
    description:
      "Our comprehensive quality management system ensures every strip and foil meets stringent industry specifications for consistency, durability, and performance.",
  },
  {
    id: 2,
    image: "/images/scale.png",
    title: "Technical Expertise & Innovation",
    description:
      "Decades of metallurgical experience combined with advanced manufacturing technologies enable us to deliver innovative solutions for critical applications.",
  },
  {
    id: 3,
    image: "/images/sus.png",
    title: "Trusted Industry Partner",
    description:
      "We are committed to reliability, timely delivery, and sustainable manufacturing practices that create lasting value for customers across global industries.",
  },
];

export default function ChooseUs({ features, extra }) {
  const displayFeatures = features && features.length > 0
    ? features.map(f => ({
        id: f._id,
        image: f.icon || "/images/qc.png",
        title: f.title || "",
        description: f.content || ""
      }))
    : defaultFeatures;

  const subtitle = extra?.choose_subtitle;
  const title = extra?.choose_title || "Strength in Every Solution";

  return (
    <section className="home1-service-section section my-0 patt-bg position-relative">
      <div className="container">
        <div className="row g-4 align-items-center text-center justify-content-center mb-70">
          <div
            className="col-lg-6 wow animate fadeInLeft"
            data-wow-delay="200ms"
            data-wow-duration="1500ms"
          >
            <div className="section-title">
              {subtitle && <span className="text-light">{subtitle}</span>}
              <h2 className="text-light">{title}</h2>
            </div>
          </div>
        </div>

        <div className="feature-wrap">
          <div className="home1-feature-slider">
            <div className="row justify-content-between gx-5">
              {displayFeatures.map((feature) => (
                <div className="col-md-4" key={feature.id}>
                  <div className="single-feature text-center">
                    <div className="icon-img">
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        width={80}
                        height={80}
                      />
                    </div>

                    <h5 className="text-light">
                      {feature.title}
                    </h5>

                    <div className="text-light" dangerouslySetInnerHTML={{ __html: feature.description }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}