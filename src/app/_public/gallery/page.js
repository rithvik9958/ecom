import PageHeader from "src/components/layout/PageHeader";
import GalleryWrapper from "src/components/features/gallery/GalleryWrapper";
import Image from "next/image";
import { connectDB } from "@/app/lib/config";
import GalleryImage from "@/app/models/GalleryImage";
import PageBanner from "@/app/models/PageBanner";

export const metadata = {
    title: "Gallery | Jindal Metals & Alloys Ltd",
    description: "View our state-of-the-art facilities, products, and infrastructure.",
    alternates: { canonical: "https://jindalmetal.com/gallery" },
    openGraph: {
        title: "Gallery | Jindal Metals & Alloys Ltd",
        description: "View our state-of-the-art facilities, products, and infrastructure.",
        url: "https://jindalmetal.com/gallery",
        type: "website",
    }
};

export const revalidate = 3600; // 1 hour ISR


export default async function GalleryPage() {
  await connectDB();
  
  const images = await GalleryImage.find({ isActive: true }).sort({ sort: 1, createdAt: -1 }).lean();
  const banner = await PageBanner.findOne({ pageKey: 'gallery', isActive: true }).lean();

  const breadcrumb = [
    { name: "Home", href: "/" },
    { name: "Gallery" }
  ];

  return (
    <>
      <PageHeader
        title={banner?.title || "Our Gallery"}
        bgImage={banner?.image || "/images/slide2.jpg"}
        breadcrumb={breadcrumb}
      />
<section className="gallery-section my-5">
        <div className="container mb-80">
          <GalleryWrapper>
            {images.map((img, index) => (
              <div 
                key={img._id.toString()} 
                className="col-lg-4 col-md-6 gallery-item-wrapper mb-4"
                style={{
                  animation: `fadeInUp 0.6s ease forwards`,
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                  transform: 'translateY(20px)'
                }}
              >
                <div className="gallery-item custom-gallery-item position-relative overflow-hidden rounded shadow-sm">
                  <a 
                    href={img.url} 
                    data-fancybox="gallery" 
                    data-caption={img.caption || "Gallery Image"} 
                    className="d-block w-100 h-100"
                  >
                    <div className="position-relative" style={{ height: "320px" }}>
                      <Image
                        src={img.url}
                        alt={img.caption || "Gallery Image"}
                        fill
                        className="object-fit-cover gallery-img"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      
                      <div 
                          className="custom-gallery-overlay d-flex flex-column align-items-center justify-content-center position-absolute w-100 h-100"
                          style={{
                              top: 0, left: 0,
                              pointerEvents: 'none'
                          }}
                      >
                          <div 
                              className="d-flex align-items-center justify-content-center rounded-circle border border-2 border-white"
                              style={{ width: '36px', height: '36px', marginBottom: '8px' }}
                          >
                              <span className="text-white fw-bold fs-4" style={{ lineHeight: '1' }}>+</span>
                          </div>
                          
                          {img.caption && (
                              <h4 className="text-white text-center px-3 m-0 fw-bold" style={{ fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                {img.caption}
                              </h4>
                          )}
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            ))}
          </GalleryWrapper>

          {images.length === 0 && (
              <div className="text-center py-5">
                  <p className="text-muted">No images available at the moment.</p>
              </div>
          )}

        </div>
      </section>
    </>
  );
}
