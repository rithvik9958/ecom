/**
 * Public route group — instant loading shell.
 *
 * Shown immediately on click while the server fetches DB data.
 * Matches the real page structure to avoid CLS.
 * This is a Server Component — zero JS shipped to the client.
 */
export default function PublicLoading() {
  return (
    <>
      {/* Page header shimmer */}
      <div
        aria-hidden="true"
        style={{
          width: "100%",
          height: "280px",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        {/* Shimmer overlay */}
        <div style={{ position: "absolute", inset: 0 }} className="page-loading-shimmer" />
        {/* Breadcrumb skeleton */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", opacity: 0.5 }}>
          <div className="skeleton-box" style={{ width: "50px", height: "14px", borderRadius: "4px" }} />
          <div className="skeleton-box" style={{ width: "8px", height: "8px", borderRadius: "50%" }} />
          <div className="skeleton-box" style={{ width: "100px", height: "14px", borderRadius: "4px" }} />
        </div>
        {/* Title skeleton */}
        <div className="skeleton-box" style={{ width: "240px", height: "40px", borderRadius: "6px" }} />
      </div>

      {/* Content area shimmer */}
      <div style={{ padding: "60px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Section heading */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div className="skeleton-box" style={{ width: "180px", height: "28px", borderRadius: "6px", margin: "0 auto 12px" }} />
          <div className="skeleton-box" style={{ width: "320px", height: "16px", borderRadius: "4px", margin: "0 auto" }} />
        </div>

        {/* Card grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-card"
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                animationDelay: `${i * 0.07}s`,
              }}
            >
              <div className="skeleton-box" style={{ width: "100%", height: "200px" }} />
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="skeleton-box" style={{ width: "70%", height: "18px", borderRadius: "4px" }} />
                <div className="skeleton-box" style={{ width: "90%", height: "13px", borderRadius: "4px" }} />
                <div className="skeleton-box" style={{ width: "60%", height: "13px", borderRadius: "4px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
</>
  );
}
