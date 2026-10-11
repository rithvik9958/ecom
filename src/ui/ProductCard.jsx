import Link from "next/link";
import Image from "next/image";

export default function ProductCard({ product }) {
  return (
    <Link href={product.slug} className="prod-card flagship">
      <Image
        className="prod-card-img"
        src={product.image}
        alt={product.title}
        width={600}
        height={800}
      />

      <div className="prod-shimmer"></div>
      <div className="prod-overlay"></div>

      <span className="prod-arrow">↗</span>

      <div className="prod-body">
        <p className="prod-tag">{product.tag}</p>

        <p className="prod-name">{product.title}</p>

        <p className="prod-cta">
          {product.cta}
          <span> →</span>
        </p>
      </div>
    </Link>
  );
}