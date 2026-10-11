import Link from "next/link";
import Image from "next/image";
import GlobalSetting from "src/app/models/GlobalSetting";
import { connectDB } from "src/app/lib/config";

const companyLinks = [
  { name: "About Us", href: "/about-us" },
  { name: "Contact Us", href: "/contact" },

  { name: "Blog & Article", href: "/blog" },
  { name: "Gallery", href: "/gallery" },
];


const careerLinks = [
  { name: "Certifications", href: "/certifications" },
  { name: "Open Positions", href: "/human-resource/current-openings" },
  { name: "Stainless steel BROCHURE", href: "#" },
  { name: "High Carbon & H & T BROCHURE", href: "#" },
];

const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    icon: "bi-linkedin",
  },
  {
    name: "Facebook",
    href: "https://facebook.com",
    icon: "bi-facebook",
  },
  {
    name: "Twitter",
    href: "https://x.com",
    icon: "bi-twitter-x",
  },
  {
    name: "Instagram",
    href: "https://instagram.com",
    icon: "bi-instagram",
  },
];

export default async function Footer() {
  let settings = null;
  try {
    await connectDB();
    settings = await GlobalSetting.findOne().lean();
  } catch (error) {
    console.error("Error fetching global settings for footer:", error);
  }

  const logo = settings?.logoImage || "/images/logo.png";
  const desc = settings?.footerDescription || "Leading manufacturer and supplier of high-quality metal products delivering excellence and innovation.";

  const email = settings?.primaryEmail || "info@jindalmetals.com";
  const phone = settings?.footerPhone || "+91 98765 43210";
  const address = settings?.address || "New Delhi, India";

  const dynamicSocialLinks = (settings?.socialLinks || []).filter(link => link.isActive !== false);

  const dynamicCareerLinks = [
    { name: "Certifications", href: "/certifications" },
    { name: "Open Positions", href: "/human-resource/current-openings" },
  ];

  return (
    <footer className="footer-section style-2">
      <div className="footer-wrapper">
        <div className="container">
          <div className="footer-menu-and-address-wrap">
            <div className="row align-items-center pt-4">
              {/* Logo & About */}
              <div className="col-lg-3">
                <div className="footer-widget text-light">
                  <div className="address-area px-4 py-5 c-foot pb-3">
                    <Image
                      src={logo}
                      alt="Jindal Metals & Alloys Ltd"
                      width={180}
                      height={60}
                      className="img-fluid mb-4"
                    />

                    <p>{desc}</p>
                  </div>
                </div>
              </div>

              {/* Footer Links */}
              <div className="col-lg-9">
                <div className="footer-menu">
                  <div className="row gy-4">
                    {/* Company */}
                    <div className="col-md-4">
                      <div className="footer-widget">
                        <div className="widget-title">
                          <h3 className="h5 text-light">COMPANY</h3>
                        </div>

                        <ul className="widget-list">
                          {companyLinks.map((link) => (
                            <li key={link.name}>
                              <Link href={link.href}>{link.name}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Career */}
                    <div className="col-md-4">
                      <div className="footer-widget">
                        <div className="widget-title">
                          <h3 className="h5 text-light">QUICK LINKS</h3>
                        </div>

                        <ul className="widget-list">
                          {dynamicCareerLinks.map((link) => (
                            <li key={link.name}>
                              <Link href={link.href}>{link.name}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="col-md-4">
                      <div className="footer-widget">
                        <div className="widget-title">
                          <h3 className="h5 text-light">Contact Us</h3>
                        </div>

                        <ul className="contact-area list-unstyled">
                          <li className="d-flex align-items-start gap-3 mb-4">
                            <div className="icon mt-1">
                              <i className="bi bi-telephone text-light fs-4"></i>
                            </div>
                            <div className="content">
                              <span className="text-light d-block mb-1">CALL US</span>
                              <h6>
                                <a
                                  href={`tel:${phone.replace(/\s+/g, '')}`}
                                  className="text-light"
                                >
                                  {phone}
                                </a>
                              </h6>
                            </div>
                          </li>

                          <li className="d-flex align-items-start gap-3 mb-4">
                            <div className="icon mt-1">
                              <i className="bi bi-geo-alt text-light fs-4"></i>
                            </div>
                            <div className="content">
                              <span className="text-light d-block mb-1">ADDRESS</span>
                              <h6 className="text-light lh-base">{address}</h6>
                            </div>
                          </li>

                          <li className="d-flex align-items-start gap-3">
                            <div className="icon mt-1">
                              <i className="bi bi-envelope text-light fs-4"></i>
                            </div>
                            <div className="content">
                              <span className="text-light d-block mb-1">SAY HELLO</span>
                              <h6>
                                <a
                                  href={`mailto:${email}`}
                                  className="text-light"
                                >
                                  {email}
                                </a>
                              </h6>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom-wrap">
        <div className="container">
          <div className="footer-bottom d-flex justify-content-between align-items-center flex-wrap">
            <div className="copyright-area">
              <p className="text-light">
                © {new Date().getFullYear()} <Link href="/" className="text-white text-decoration-none fw-semibold hover-opacity">Jindal Metals</Link>
                . All Rights Reserved.
              </p>
            </div>

            <ul className="social-area d-flex gap-3">
              {dynamicSocialLinks.map((social) => (
                <li key={social.platform || social.name}>
                  <a
                    href={social.url || social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className={`bi ${social.icon}`}></i> {social.platform || social.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
