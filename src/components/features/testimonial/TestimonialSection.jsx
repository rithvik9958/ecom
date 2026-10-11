"use client";

import TestimonialCard from "./TestimonialCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

const testimonialData = [
    {
        heading: "Precision You Can Depend On",
        description:
            "The consistency and quality of Jindal Metals' stainless steel products have played a key role in maintaining our manufacturing standards. Their attention to detail and commitment to excellence set them apart.",
        image: "/images/slide1.jpg",
        name: "Senior Procurement Manager",
        designation: "Engineering Solutions Company",
    },
    {
        heading: "A Partner Built on Trust",
        description:
            "From product development to final delivery, the Jindal Metals team demonstrates professionalism, technical expertise, and exceptional customer support. They are a trusted extension of our supply chain.",
        image: "/images/slide2.jpg",
        name: "Head of Operations",
        designation: "Automotive Manufacturing Sector",
    },
    {
        heading: "Consistent Quality, Every Time",
        description:
            "Jindal Metals continues to exceed expectations with reliable delivery schedules, superior product quality, and a customer-first approach. Their materials consistently meet our most demanding specifications.",
        image: "/images/slide3.jpg",
        name: "Technical Director",
        designation: "Industrial Equipment Manufacturer",
    },
];

export default function TestimonialSection() {
    return (
        <section className="home1-testimonial-section home1-testimonial-slider section my-0 patt-bg">
            <div className="container">
                <div className="row gy-5 align-items-center">
                    {/* Left Content */}
                    <div className="col-xl-4">
                        <div className="testimonial-title-area">
                            <div className="section-title text-light">
                                <span className="text-light">Our Client Testimonial</span>

                                <h2 className="text-light py-3">Trusted by Our Partners.</h2>

                                <p className="text-light pt-0">
                                    Building long-term partnerships through quality products, technical expertise, and customer-focused solutions.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Slider */}
                    <div className="col-xl-8">
                        <Swiper
                            modules={[Navigation, Autoplay]}
                            navigation={{
                                prevEl: ".testimonial-slider-prev",
                                nextEl: ".testimonial-slider-next",
                            }}
                            autoplay={{
                                delay: 4000,
                                disableOnInteraction: false,
                            }}
                            spaceBetween={30}
                            breakpoints={{
                                0: {
                                    slidesPerView: 1,
                                },
                                768: {
                                    slidesPerView: 1,
                                },
                                992: {
                                    slidesPerView: 2,
                                },
                            }}
                        >
                            {testimonialData.map((testimonial, index) => (
                                <SwiperSlide key={index}>
                                    <TestimonialCard testimonial={testimonial} />
                                </SwiperSlide>
                            ))}
                        </Swiper>

                        {/* Navigation */}
                        <div className="slider-btn-grp mt-4">
                            <div className="slider-btn testimonial-slider-prev">
                                ←
                            </div>

                            <div className="slider-btn testimonial-slider-next">
                                →
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}