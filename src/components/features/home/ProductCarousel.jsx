"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import ProductCard from "src/ui/ProductCard";

export default function ProductCarousel({ products }) {
  const count = products.length;

  // Cap each breakpoint's slidesPerView at the actual item count
  const cap = (n) => Math.min(n, count);

  return (
    <div className="home2-service-slider-area">
      <div className="row mb-30">
        <div className="col-lg-12">
          <Swiper
            modules={[Navigation]}
            spaceBetween={30}
            slidesPerView={cap(4)}
            navigation={{
              prevEl: ".service-slider-prev",
              nextEl: ".service-slider-next",
            }}
            breakpoints={{
              0: {
                slidesPerView: cap(1),
              },
              576: {
                slidesPerView: cap(2),
              },
              768: {
                slidesPerView: cap(2),
              },
              992: {
                slidesPerView: cap(3),
              },
              1200: {
                slidesPerView: cap(4),
              },
            }}
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {count > cap(4) && (
        <div className="row">
          <div className="col-lg-12 d-flex justify-content-center">
            <div className="slider-btn-grp two">
              <div className="slider-btn service-slider-prev">
                <i className="bi bi-arrow-left"></i>
              </div>

              <div className="slider-btn service-slider-next">
                <i className="bi bi-arrow-right"></i>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
