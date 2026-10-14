'use client';
import { useState, useEffect } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

function getImageUrl(url) {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${url}`;
}

export default function ProductGallery({ images = [], title = 'Product Image' }) {
  const [activeImg, setActiveImg] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // prevent background scrolling
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isModalOpen]);

  const activeUrl = getImageUrl(images[activeImg]);

  return (
    <>
      <div className="fnp-product-gallery">
        {/* Thumbnails Sidebar */}
        {images.length > 1 && (
          <div className="fnp-gallery-thumbs">
            {images.map((img, i) => (
              <button
                key={i}
                className={`fnp-gallery-thumb ${i === activeImg ? 'active' : ''}`}
                onClick={() => setActiveImg(i)}
              >
                <img
                  src={getImageUrl(img)}
                  alt={`View ${i + 1}`}
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Image */}
        <div className="fnp-gallery-main">
          {activeUrl ? (
            <div 
              style={{ width: '100%', height: '100%', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: '#ffffff' }} 
              onClick={() => setIsModalOpen(true)}
            >
              <img
                src={activeUrl}
                alt={title}
                style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }}
              />
              <button
                style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(255,255,255,0.9)', padding: '8px', borderRadius: '8px', border: '1px solid #e5e5e5', zIndex: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                aria-label="Expand image"
              >
                <Maximize2 size={16} color="#4b5563" />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem', opacity: 0.3 }}>🌸</div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal via React Portal to prevent distortion */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.9)', padding: '2rem' }}>
          <button
            onClick={() => setIsModalOpen(false)}
            style={{ position: 'absolute', top: '24px', right: '24px', color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%', cursor: 'pointer', zIndex: 60, transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
          
          <div style={{ width: '90%', maxWidth: '900px', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'row', height: '80vh', maxHeight: '700px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            
            {/* Main Modal Image Area */}
            <div style={{ flex: 1, position: 'relative', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflow: 'hidden' }}>
              
              {images.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg - 1 + images.length) % images.length); }}
                  style={{ position: 'absolute', left: '16px', background: 'white', border: '1px solid #e5e5e5', borderRadius: '50%', padding: '8px', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} color="#111" />
                </button>
              )}

              <img
                src={activeUrl}
                alt={title}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />

              {images.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg + 1) % images.length); }}
                  style={{ position: 'absolute', right: '16px', background: 'white', border: '1px solid #e5e5e5', borderRadius: '50%', padding: '8px', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  aria-label="Next image"
                >
                  <ChevronRight size={24} color="#111" />
                </button>
              )}
            </div>

            {/* Modal Thumbnails */}
            {images.length > 1 && (
              <div style={{ width: '140px', backgroundColor: 'white', borderLeft: '1px solid #e5e5e5', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{ flexShrink: 0, width: '100%', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', border: i === activeImg ? '2px solid #111' : '2px solid transparent', opacity: i === activeImg ? 1 : 0.7 }}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`View ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>,
        document.body
      )}
    </>
  );
}
