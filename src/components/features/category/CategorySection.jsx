import Image from "next/image";
import Link from "next/link";
import ProductCard from "src/ui/ProductCard";

export default function CategorySection({ category, products = [] }) {
    return (
        <section className="project-grid-page section my-0">
            <div className="container">
                <div className="row g-4 align-items-center justify-content-center text-center mb-70">
                    <div className="col-lg-6">
                        <div className="section-title two">
                            <span>Our Products</span>
                            <h2>{category?.name ? `${category.name} Products` : 'Our Range of Products'}</h2>
                        </div>
                    </div>
                </div>

                {products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                        No products found in this category.
                    </div>
                ) : (
                    <div className="row gy-5">
                        {products.map((product) => (
                            <div className="col-md-3" key={product._id}>
                                <ProductCard
                                    product={{
                                        ...product,
                                        // Normalize field names for ProductCard
                                        slug: `/${category?.slug || ''}/${product.slug}`,
                                        tag: category?.name || 'Steel',
                                        title: product.name,
                                        cta: 'View grades & tolerances',
                                        image: product.image || '/images/thin.jpeg',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}