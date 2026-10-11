"use client";

import { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export default function PDFThumbnail({ fileUrl }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set up the PDF.js worker using unpkg to avoid Webpack issues
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    setMounted(true);
  }, []);

  if (!mounted) return (
    <div className="d-flex flex-column align-items-center justify-content-center h-100 bg-light">
      <span style={{ fontSize: '4rem' }}>📄</span>
    </div>
  );

  return (
    <div className="position-relative w-100 h-100 overflow-hidden bg-light d-flex align-items-center justify-content-center">
      <style>{`
        .pdf-responsive-page {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pdf-responsive-page .react-pdf__Page__canvas {
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain;
          border-radius: 4px;
        }
      `}</style>
      <Document
        file={fileUrl}
        loading={
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
            <div className="spinner-border spinner-border-sm mb-2" role="status"></div>
            <small>Loading...</small>
          </div>
        }
        error={
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
            <span style={{ fontSize: '3rem' }}>📄</span>
            <small>PDF Document</small>
          </div>
        }
      >
        <Page
          pageNumber={1}
          height={220}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="pdf-responsive-page shadow-sm"
        />
      </Document>
    </div>
  );
}
