import Image from "next/image";
import Link from "next/link";
import { FadeInUp } from "../../animations/GSAPWrapper";
import PDFThumbnailWrapper from "src/components/features/PDFThumbnailWrapper";
import GalleryWrapper from "src/components/features/gallery/GalleryWrapper";

export default function CertificationsGrid({ certifications, extra }) {
  const displayCertificates = certifications && certifications.length > 0
    ? certifications
    : [];

  const subtitle = extra?.certified_subtitle;
  const title = extra?.certified_title || "Our Certifications";

  return (
    <div className="home2-certification-section section my-0 py-5 bg-light">
      <style>{`
        .cert-card-hover {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          overflow: hidden;
          border: 1px solid #eaeaea;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          cursor: pointer;
          background-color: #fff;
          transition: all 0.3s ease;
        }
        .cert-card-hover:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.12);
          border-color: #0f172a;
        }
      `}</style>
      <div className="container mb-80">
        <FadeInUp duration={0.8}>
          <div className="row justify-content-center mb-5">
            <div className="col-xl-6 col-lg-7 col-md-8">
              <div className="section-title text-center">
                {subtitle && <span>{subtitle}</span>}
                <h2>{title}</h2>
              </div>
            </div>
          </div>
        </FadeInUp>

        <GalleryWrapper className="row justify-content-start g-4">
          {displayCertificates.map((cert, index) => {
            const isImage = cert.file_url?.match(/\.(jpeg|jpg|gif|png|webp)$/i);

            return (
              <div
                key={cert._id?.toString() || index}
                className="col-12 col-md-6 col-lg-3 mb-4 certification-item-wrapper"
                style={{
                  animation: `fadeInUp 0.6s ease forwards`,
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                  transform: 'translateY(20px)'
                }}
              >
                <div className="modern-cert-card h-100 position-relative d-flex flex-column" style={{
                  border: "1px solid #eaeaea",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                  backgroundColor: "#fff",
                  transition: "all 0.3s ease"
                }}>
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
            )
          })}

          {displayCertificates.length === 0 && (
            <div className="col-12 text-center py-5">
              <p className="text-muted">No documents available at the moment.</p>
            </div>
          )}
        </GalleryWrapper>
      </div>
    </div>
  );
}
