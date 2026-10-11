"use client";

import Image from "next/image";
import Link from "next/link";
import PopupCtaForm from "src/components/core/PopupCtaForm";

export default function ProductDetails({ product, relatedProducts = [], category = "stainless-steel" }) {
    return (
        <section className="project-details-page my-5">
            <div className="container">

                {/* ── Full-width: image + description ── */}
                <div className="mb-5">
                    {(product.detailImage || product.image) && (
                        <div className="position-relative mb-4" style={{ height: "400px", borderRadius: "10px", overflow: "hidden" }}>
                            <Image
                                src={product.detailImage || product.image}
                                alt={product.alt || product.name}
                                fill
                                className="object-fit-cover"
                                sizes="100vw"
                                priority
                            />
                        </div>
                    )}

                    {product.description && (
                        <div
                            className="details-content-wrapper ck-content"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                    )}
                </div>

                {/* ── Full-width CTA Banner ── */}
                <div className="pd-cta">
                    {/* Decorative circles */}
                    <div className="pd-cta__circle pd-cta__circle--1" aria-hidden="true"></div>
                    <div className="pd-cta__circle pd-cta__circle--2" aria-hidden="true"></div>

                    {/* Left: icon + text */}
                    <div className="pd-cta__left">
                        <div className="pd-cta__icon-wrap">
                            <i className="bi bi-lightning-charge-fill"></i>
                        </div>
                        <div>
                            <h3 className="pd-cta__heading">
                                Ready to <span>work with us?</span>
                            </h3>
                            <p className="pd-cta__sub">
                                Get expert advice and a tailored quote for your steel requirements.
                            </p>
                        </div>
                    </div>

                    {/* Right: button */}
                    <div className="pd-cta__right">
                        <PopupCtaForm
                            buttonText="Connect Today"
                            buttonClass="primary-btn1 white-bg"
                        />
                    </div>
                </div>

                {/* ── Related Products — pill list below CTA ── */}
                {relatedProducts.length > 0 && (
                    <div className="pd-related">
                        <span className="pd-related__label">Related Products:</span>
                        <ul className="pd-related__list">
                            {relatedProducts.map((item) => (
                                <li key={item._id || item.slug}>
                                    <Link href={`/${category}/${item.slug}`} className="pd-related__pill">
                                        <svg width="9" height="9" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M0.0594069 0H12.0002V2.23531L2.25746 12.0001L0 9.76478L6.65357 3.17649L0.0594069 3.23532V0Z" />
                                            <path d="M12.0009 12.0002V4.4707L8.79297 7.6472V12.0002H12.0009Z" />
                                        </svg>
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

            </div>

            <style>{`
                /* ── Full-width CTA Banner ───────────────────────────── */
                .pd-cta {
                    position: relative;
                    overflow: hidden;
                    border-radius: 16px;
                    background: linear-gradient(120deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
                    padding: 2.25rem 2.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 2rem;
                    box-shadow: 0 8px 32px rgba(10, 110, 189, 0.2);
                    margin-bottom: 1.5rem;
                }

                /* Decorative blurred circles */
                .pd-cta__circle {
                    position: absolute;
                    border-radius: 50%;
                    pointer-events: none;
                }
                .pd-cta__circle--1 {
                    width: 280px; height: 280px;
                    background: radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%);
                    top: -80px; right: 80px;
                }
                .pd-cta__circle--2 {
                    width: 200px; height: 200px;
                    background: radial-gradient(circle, rgba(10,110,189,0.15) 0%, transparent 70%);
                    bottom: -60px; left: 60px;
                }

                /* Left side */
                .pd-cta__left {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    position: relative;
                    z-index: 1;
                }

                .pd-cta__icon-wrap {
                    flex-shrink: 0;
                    width: 52px; height: 52px;
                    border-radius: 14px;
                    background: rgba(56, 189, 248, 0.15);
                    border: 1px solid rgba(56, 189, 248, 0.25);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.4rem;
                    color: #38bdf8;
                }

                .pd-cta__heading {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #fff;
                    line-height: 1.2;
                    margin: 0 0 0.3rem;
                }
                .pd-cta__heading span { color: #38bdf8; }

                .pd-cta__sub {
                    font-size: 13.5px;
                    color: rgba(255, 255, 255, 0.5);
                    margin: 0;
                    line-height: 1.5;
                }

                /* Right side */
                .pd-cta__right {
                    flex-shrink: 0;
                    position: relative;
                    z-index: 1;
                }

                /* ── Related products pill row ───────────────────────── */
                .pd-related {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding: 1rem 0 0;
                }
                .pd-related__label {
                    font-size: 11.5px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.7px;
                    color: #888;
                    white-space: nowrap;
                }
                .pd-related__list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .pd-related__pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #444;
                    background: #f4f4f4;
                    border: 1px solid #e2e2e2;
                    padding: 5px 14px;
                    border-radius: 999px;
                    text-decoration: none;
                    transition: background .2s, color .2s, border-color .2s;
                }
                .pd-related__pill:hover {
                    background: var(--primary-color1, #0a6ebd);
                    color: #fff;
                    border-color: var(--primary-color1, #0a6ebd);
                }
                .pd-related__pill svg { fill: currentColor; flex-shrink: 0; }

                @media (max-width: 768px) {
                    .pd-cta {
                        flex-direction: column;
                        text-align: center;
                        padding: 1.75rem 1.25rem;
                    }
                    .pd-cta__left { flex-direction: column; text-align: center; }
                    .pd-related { justify-content: center; }
                }
            `}</style>
        </section>
    );
}