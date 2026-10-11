"use client";

import dynamic from 'next/dynamic';

const PDFThumbnail = dynamic(() => import('./PDFThumbnail'), {
  ssr: false,
  loading: () => (
    <div className="d-flex flex-column align-items-center justify-content-center h-100 bg-light">
      <div className="spinner-border text-primary mb-2" role="status"></div>
      <small>Loading PDF...</small>
    </div>
  )
});

export default function PDFThumbnailWrapper(props) {
  return <PDFThumbnail {...props} />;
}
