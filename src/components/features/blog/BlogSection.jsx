"use client";

import BlogCard from "./BlogCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

const blogData = [
    {
        image: "/images/slide1.jpg",
        date: "10 August, 2025",
        category: "Industry",
        title: "Revolutionizing Production Then Future of Factories.",
        link: "#",
    },
    {
        image: "/images/slide2.jpg",
        date: "12 August, 2025",
        category: "Architecture",
        title: "Factory Spotlight Technology Efficiency in Manufacturing.",
        link: "#",
    },
    {
        image: "/images/slide3.jpg",
        date: "10 May, 2025",
        category: "Renovation",
        title: "Pulse of Manufacturing Factories News & Advances.",
        link: "#",
    },
    {
        image: "/images/slide2.jpg",
        date: "15 August, 2025",
        category: "Industry",
        title: "Technological Efficiency in the Factory.",
        link: "#",
    },
];

export default function BlogSection({ data }) {
    const displayBlogs = data && data.length > 0 ? data.map(b => ({
        image: b.coverImage || "/images/slide1.jpg",
        date: b.publishedAt || new Date(b.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
        category: b.category || "News",
        title: b.title,
        link: `/blog/${b.slug}`,
    })) : blogData;

    return (
        <section className="home1-blog-section section my-0">
            <div className="container">
                <div className="row align-items-end justify-content-between mb-70">
                    <div className="col-lg-5">
                        <div className="section-title">
                            <span>Our Blog & Article</span>
                            <h2>Factory Trends & Updates</h2>
                        </div>
                    </div>

                    <div className="col-lg-3 d-flex justify-content-lg-end">
                        <div className="slider-btn-grp">
                            <div className="slider-btn blog-slider-prev">
                                ←
                            </div>

                            <div className="slider-btn blog-slider-next">
                                →
                            </div>
                        </div>
                    </div>
                </div>

                <Swiper
                    modules={[Navigation]}
                    spaceBetween={30}
                    slidesPerView={3}
                    navigation={{
                        prevEl: ".blog-slider-prev",
                        nextEl: ".blog-slider-next",
                    }}
                    breakpoints={{
                        0: {
                            slidesPerView: 1,
                        },
                        768: {
                            slidesPerView: 2,
                        },
                        1200: {
                            slidesPerView: 3,
                        },
                    }}
                >
                    {displayBlogs.map((blog, index) => (
                        <SwiperSlide key={index}>
                            <BlogCard blog={blog} />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
}