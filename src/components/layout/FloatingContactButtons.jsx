"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function FloatingContactButtons({ phoneNumber, socialLinks = [] }) {
  // Format phone number for WhatsApp (remove spaces and special characters)
  const formattedForWhatsApp = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
  const waUrl = formattedForWhatsApp ? `https://wa.me/${formattedForWhatsApp}` : '#';
  const callUrl = phoneNumber ? `tel:${phoneNumber.replace(/\s+/g, '')}` : '#';

  // Find LinkedIn URL from global settings or fallback
  const linkedInLink = socialLinks.find(link => link.platform?.toLowerCase() === 'linkedin' && link.isActive !== false);
  const linkedInUrl = linkedInLink?.url || 'https://linkedin.com';

  if (!phoneNumber) return null;

  return (
    <>
      <style>{`
        .floating-contact-container {
          position: fixed;
          bottom: 80px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          pointer-events: auto;
        }
        .floating-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          color: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.3s, background-color 0.3s;
          text-decoration: none;
        }
        .floating-btn:hover {
          transform: scale(1.1);
          color: #fff;
        }
        .floating-btn.call-btn {
          background-color: #2563eb;
        }
        .floating-btn.call-btn:hover {
          background-color: #1d4ed8;
        }
        .floating-btn.wa-btn {
          background-color: #22c55e;
        }
        .floating-btn.wa-btn:hover {
          background-color: #16a34a;
        }
        .floating-btn.li-btn {
          background-color: #0a66c2;
        }
        .floating-btn.li-btn:hover {
          background-color: #004182;
        }
        .floating-tooltip {
          position: absolute;
          right: 60px;
          background-color: #111827;
          color: #fff;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          opacity: 0;
          white-space: nowrap;
          pointer-events: none;
          transition: opacity 0.3s;
        }
        .floating-btn:hover .floating-tooltip {
          opacity: 1;
        }
      `}</style>
      <div className="floating-contact-container">
        {/* Call Button */}
        <a href={callUrl} className="floating-btn call-btn" aria-label="Call Us">
          <span className="floating-tooltip">Call Us</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </a>

        {/* WhatsApp Button */}
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="floating-btn wa-btn" aria-label="Chat on WhatsApp">
          <span className="floating-tooltip">WhatsApp</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </a>

        {/* LinkedIn Button */}
        <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="floating-btn li-btn" aria-label="Visit our LinkedIn">
          <span className="floating-tooltip">LinkedIn</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        </a>
      </div>
    </>
  );
}
