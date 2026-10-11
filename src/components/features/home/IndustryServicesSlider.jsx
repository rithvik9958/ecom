'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// npm install swiper
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import SectionHeading from 'src/ui/SectionHeading'
import Container from 'src/ui/Container'

export default function IndustryServicesSlider({ services }) {
  // services = [{title, image, desc, slug}, ...] from backend API
  return (
    <div className="home2-service-section mb-60">

        <Container>

     

        <div className="row g-4 align-items-center justify-content-between mb-70">
          <div className="col-lg-6">
            <SectionHeading title="text" subTitle="subtutle" />
          </div>
          <div className="col-lg-3 d-flex justify-content-lg-end">
            <Link href="/products" className="primary-btn3">View All Services</Link>
          </div>
        </div>

        <Swiper
          modules={[Navigation]}
          slidesPerView={4}
          spaceBetween={30}
          loop={true}
          navigation={{
            nextEl: '.service-slider-next',
            prevEl: '.service-slider-prev',
          }}
          breakpoints={{
            320:  { slidesPerView: 1 },
            768:  { slidesPerView: 2 },
            1200: { slidesPerView: 4 },
          }}
        >
          {services.map((service) => (
            <SwiperSlide key={service._id}>
              <div className="service-card">
                <h4><Link href={`/products/${service.slug}`}>{service.title}</Link></h4>
                <Link href={`/products/${service.slug}`} className="service-img">
                  <Image src={service.image} alt={service.title} width={400} height={250} />
                </Link>
                <p>{service.desc}</p>
                <Link href={`/products/${service.slug}`} className="primary-btn3">View Details</Link>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="slider-btn-grp two d-flex justify-content-center">
          <div className="slider-btn service-slider-prev">‹</div>
          <div className="slider-btn service-slider-next">›</div>
        </div>
        </Container>
    </div>
  )
}