import Link from "next/link";
import ProductCarousel from "./ProductCarousel";
import { FadeInUp } from "../../animations/GSAPWrapper";

export default function ProductSection({ data, extra }) {
  const fallbackCategories = [
    {
      id: 1,
      image: "/images/thin.jpeg",
      tag: "Category",
      title: "Stainless Steel",
      cta: "Explore Products",
      slug: "/stainless-steel",
    },
    {
      id: 2,
      image: "/images/rollsub2.png",
      tag: "Category",
      title: "Edge Condition",
      cta: "Explore Products",
      slug: "/edge-condition",
    },
    {
      id: 3,
      image: "/images/about.jpeg",
      tag: "Category",
      title: "Tolerances",
      cta: "Explore Products",
      slug: "/tolerances",
    },
    {
      id: 4,
      image: "/images/stain.jpg",
      tag: "Category",
      title: "Hardness Ranges",
      cta: "Explore Products",
      slug: "/hardness-ranges",
    },
  ];

  const displayProducts = data && data.length > 0 ? data.map((cat) => ({
    id: cat._id,
    image: cat.image || "/images/thin.jpeg",
    tag: "Category",
    title: cat.name,
    cta: "Explore Products",
    slug: `/${cat.slug}`,
  })) : fallbackCategories;

  const subtitle = extra?.product_subtitle;
  const title = extra?.product_title || "Our Range of Products";

  return (
    <section className="home2-service-section section my-0 py-5 bg-light">
      <div className="container">
        <FadeInUp duration={0.8}>
          <div className="row g-4 align-items-center justify-content-between mb-30">
            <div className="col-lg-8">
              <div className="section-title two">
                {subtitle && <span>{subtitle}</span>}
                <h2>{title}</h2>
              </div>
            </div>
          </div>
        </FadeInUp>

        <FadeInUp duration={1} delay={0.2}>
          <ProductCarousel products={displayProducts} />
        </FadeInUp>
      </div>
    </section>
  );
}