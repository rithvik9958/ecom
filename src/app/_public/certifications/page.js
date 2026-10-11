import PageHeader from "src/components/layout/PageHeader";
import GalleryWrapper from "src/components/features/gallery/GalleryWrapper";
import Image from "next/image";
import { connectDB } from "@/app/lib/config";
import CompanyCertification from "@/app/models/CompanyCertification";
import PageBanner from "@/app/models/PageBanner";
import PDFThumbnailWrapper from "src/components/features/PDFThumbnailWrapper";
export const metadata = {
    title: "Certifications | Jindal Metals & Alloys Ltd",
    description: "View our industry certifications, quality standards, and compliance documents.",
    alternates: { canonical: "https://jindalmetal.com/certifications" },
    openGraph: {
        title: "Certifications | Jindal Metals & Alloys Ltd",
        description: "View our industry certifications, quality standards, and compliance documents.",
        url: "https://jindalmetal.com/certifications",
        type: "website",
    }
};

export const revalidate = 3600; // 1 hour ISR


export default async function CertificationsPage() {
  await connectDB();
  
  const certifications = await CompanyCertification.find({ status: "active" }).sort({ sort: 1, createdAt: -1 }).lean();
  const banner = await PageBanner.findOne({ pageKey: 'certifications', isActive: true }).lean();

  const breadcrumb = [
    { name: "Home", href: "/" },
    { name: "Certifications" }
  ];

  return (
    <>
      <PageHeader
        title={banner?.title || "Our Certifications"}
        bgImage={banner?.image || "/images/slide1.jpg"}
        breadcrumb={breadcrumb}
      />

      <section className="certifications-section my-5">
        <div className="container mb-80">
          <GalleryWrapper>
            {certifications.map((cert, index) => {
              const isImage = cert.file_url?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
              
              return (
              <div 
                key={cert._id.toString()} 
                className="col-lg-3 col-md-6 mb-4 certification-item-wrapper"
                style={{
                  animation: `fadeInUp 0.6s ease forwards`,
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                  transform: 'translateY(20px)'
                }}
              >
                <div className="modern-cert-card h-100 position-relative d-flex flex-column">
                  <a 
                    href={!isImage ? `https://docs.google.com/viewer?url=${encodeURIComponent(cert.file_url)}` : cert.file_url} 
                    target={!isImage ? "_blank" : undefined}
                    rel="noreferrer"
                    data-fancybox={isImage ? "certifications" : undefined} 
                    data-caption={cert.name} 
                    className="d-block w-100 h-100 text-decoration-none d-flex flex-column"
                  >
                    {/* Image Container with Soft Background */}
                    <div 
                      className="position-relative w-100 d-flex align-items-center justify-content-center overflow-hidden" 
                      style={{ 
                        height: "280px", 
                        backgroundColor: "#f8fafc", 
                        borderBottom: "1px solid rgba(0,0,0,0.03)",
                        padding: "24px"
                      }}
                    >
                      <div className="modern-cert-img-wrapper position-relative w-100 h-100" style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.08))" }}>
                        {isImage ? (
                          <Image
                              src={cert.file_url}
                              alt={cert.name}
                              fill
                              className="cert-img"
                              style={{ objectFit: 'contain' }}
                              sizes="(max-width: 768px) 100vw, 25vw"
                          />
                        ) : (
                          <PDFThumbnailWrapper fileUrl={cert.file_url} />
                        )}
                      </div>
                    </div>
                    
                    {/* Text Content Area */}
                    <div className="p-4 pb-4 text-center d-flex flex-column flex-grow-1 bg-white">
                      <h3 className="fw-bold mb-2" style={{ color: "#0f172a", fontSize: "1.1rem", lineHeight: "1.4" }}>
                        {cert.name}
                      </h3>
                      
                      {cert.sub_title && (
                        <div className="fw-semibold mb-2" style={{ color: "#1689b5", fontSize: "0.9rem", letterSpacing: "0.5px" }}>
                          {cert.sub_title}
                        </div>
                      )}
                      
                      {cert.third_title && (
                        <div className="mt-auto pt-3">
                          <span className="py-1 px-3 rounded-pill" style={{ backgroundColor: "#f1f5f9", color: "#475569", fontSize: "0.8rem", fontWeight: "600" }}>
                            {cert.third_title}
                          </span>
                        </div>
                      )}
                    </div>
                  </a>
                </div>
              </div>
            )})}
            
            {certifications.length === 0 && (
                <div className="col-12 text-center py-5">
                    <p className="text-muted">No documents available at the moment.</p>
                </div>
            )}
          </GalleryWrapper>
        </div>
      </section>
    </>
  );
}
