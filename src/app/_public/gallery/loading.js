/**
 * Gallery page — instant loading shell.
 * Shown while the server fetches gallery images from the database.
 */
export default function GalleryLoading() {
  return (
    <>
      {/* Page Header shimmer */}
      <div
        aria-hidden="true"
        style={{
          width: "100%",
          height: "280px",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <div style={{ position: "absolute", inset: 0 }} className="gl-shimmer" />
        <div style={{ display: "flex", gap: "8px", alignItems: "center", opacity: 0.5 }}>
          <div className="gl-skel" style={{ width: "50px", height: "14px", borderRadius: "4px" }} />
          <div className="gl-skel" style={{ width: "8px", height: "8px", borderRadius: "50%" }} />
          <div className="gl-skel" style={{ width: "70px", height: "14px", borderRadius: "4px" }} />
        </div>
        <div className="gl-skel" style={{ width: "140px", height: "40px", borderRadius: "6px" }} />
      </div>

      {/* Gallery masonry-style grid shimmer */}
      <div style={{ padding: "60px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Filter tabs skeleton */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "40px" }}>
          {[80, 100, 90, 110, 85].map((w, i) => (
            <div key={i} className="gl-skel" style={{ width: `${w}px`, height: "36px", borderRadius: "20px" }} />
          ))}
        </div>

        {/* Image grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => {
            // Vary heights to simulate masonry feel
            const heights = [240, 300, 260, 320, 240, 280, 260, 300, 240];
            return (
              <div
                key={i}
                className="gl-skel"
                style={{
                  height: `${heights[i % heights.length]}px`,
                  borderRadius: "10px",
                  animation: `gl-sweep 1.6s ease-in-out infinite, gl-fadein 0.4s ease-out ${i * 0.05}s both`,
                }}
              />
            );
          })}
        </div>
      </div>
</>
  );
}
