"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Parallax, Autoplay } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import SlideTypingEffect from "src/components/animations/TypingEffect";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import "./HeroSlider.css";

const defaultSlides = [
  {
    image: "/images/slide1.jpg",
    title: "India's Leading Precision Stainless Steel Manufacturer",
    subtitle:
      "Delivering world-class stainless steel strips, foils, and alloy steel solutions engineered for performance, precision, and reliability.",
    button: "Request a Quote",
    link: "/contact",
  },
  {
    image: "/images/slide2.jpg",
    title: "Precision Engineered for Critical Industries",
    subtitle:
      "Trusted by automotive, engineering, electrical, and industrial manufacturers for consistent quality and superior performance.",
    button: "Explore Products",
    link: "/products",
  },
  {
    image: "/images/slide3.jpg",
    title: "Driving Sustainable Manufacturing Excellence",
    subtitle:
      "Committed to innovation, responsible manufacturing, and creating long-term value for customers, partners, and communities.",
    button: "Contact Us",
    link: "/contact",
  },
];

export default function HeroSlider({ slides, certifications = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const displaySlides = slides && slides.length > 0
    ? slides.map(s => ({
        image: s.image || "/images/slide1.jpg",
        title: s.title || "",
        subtitle: s.subtitle || "",
        button: s.buttonText || "Read More",
        link: s.url || "#",
        showCertifications: s.showCertifications || false,
      }))
    : defaultSlides;

  return (
    <section className="hero-slider hero-style">
      <Swiper
        modules={[Navigation, Pagination, Parallax, Autoplay]}
        speed={1000}
        loop={displaySlides.length > 1}
        parallax={true}
        autoplay={{
          delay: 6500,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        className="mySwiper"
        onSlideChange={(swiper) => {
          // Use realIndex so looping works correctly
          setActiveIndex(swiper.realIndex);
        }}
      >
        {displaySlides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="slide-inner position-relative">
              <div className="bg-image-wrapper">
                  <Image
                    src={slide.image}
                    alt={slide.title || "Slide Image"}
                    fill
                    priority={index === 0}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    sizes="100vw"
                    style={{ objectFit: "cover" }}
                  />
              </div>
              <div className="slide-overlay"></div>

              <div className="h-container">
                <div className="hero-content-box">
                  <div className="slide-title">
                    {index === 0 ? (
                      <h1 className="text-light">
                        {/* slideKey = `${index}-${activeIndex}` re-mounts when this slide becomes active */}
                        <SlideTypingEffect
                          text={slide.title}
                          speed={18}
                          delay={400}
                          cursor={false}
                          slideKey={`slide-${index}-active-${activeIndex}`}
                        />
                      </h1>
                    ) : (
                      <p className="text-light h1">
                        <SlideTypingEffect
                          text={slide.title}
                          speed={38}
                          delay={400}
                          cursor={false}
                          slideKey={`slide-${index}-active-${activeIndex}`}
                        />
                      </p>
                    )}
                  </div>

                  <div className="slide-text">
                    <p dangerouslySetInnerHTML={{ __html: slide.subtitle }} className="mx-auto"></p>
                  </div>

                  {slide.showCertifications && certifications && certifications.length > 0 && (
                    <div className="slide-certifications-wrapper d-flex justify-content-center">
                      <div className="glass-certifications">
                        {certifications.slice(0, 5).map((cert, i) => (
                          <div key={i} className="glass-cert-item">
                            <Image
                              src={cert.logo || "/images/c-1.png"}
                              alt={cert.title || "Certification"}
                              width={85}
                              height={85}
                              style={{ objectFit: "contain" }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="slide-btns d-flex justify-content-center">
                    <Link href={slide.link} className="theme-btn-s2">
                      {slide.button}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
