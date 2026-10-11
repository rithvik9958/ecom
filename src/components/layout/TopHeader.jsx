import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, FileText } from "lucide-react";

export default function TopHeader({ settings }) {
  const email = settings?.primaryEmail || "info@jindalmetals.com";
  const phone = settings?.primaryPhone || "+91 93235 82341";
  const pdf1Url = settings?.pdf1Url || "/pdf/company-profile.pdf";
  const pdf1Text = settings?.pdf1Text || "Stainless steel BROCHURE";
  const pdf2Url = settings?.pdf2Url || "#";
  const pdf2Text = settings?.pdf2Text || "High Carbon & H & T BROCHURE";
  const logo = settings?.logoImage || "/images/logo.png";

  return (
    <div className="top-header">
      <div className="container-fluid">
        <div className="top-header-inner mx-3">
          {/* Logo */}
          <div className="top-header-logo">
            <Link href="/">
              <Image
                src={logo}
                alt="Jindal Metals"
                width={180}
                height={60}
                priority
              />
            </Link>
          </div>

          {/* Right Content */}
          <div className="top-header-right">
            {/* Email */}
            <a href={`mailto:${email}`} className="top-info-item">
              <Mail size={18} />
              <span>{email}</span>
            </a>

            {/* Phone */}
            <a href={`tel:${phone.replace(/\s+/g, '')}`} className="top-info-item">
              <Phone size={18} />
              <span>{phone}</span>
            </a>

            {/* PDF Button 1 */}
            <a
              href={pdf1Url}
              target="_blank"
              rel="noopener noreferrer"
              className="top-btn pdf-btn"
            >
              <FileText size={18} />
              {pdf1Text}
            </a>

            {/* PDF Button 2 */}
            <a
              href={pdf2Url}
              target="_blank"
              rel="noopener noreferrer"
              className="top-btn contact-btn"
            >
              <FileText size={18} />
              {pdf2Text}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
