/**
 * Blog listing page — instant loading shell.
 * Shown while the server fetches blog posts and pagination data.
 */
export default function BlogLoading() {
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
        <div style={{ position: "absolute", inset: 0 }} className="bl-shimmer" />
        <div style={{ display: "flex", gap: "8px", alignItems: "center", opacity: 0.5 }}>
          <div className="bl-skel" style={{ width: "50px", height: "14px", borderRadius: "4px" }} />
          <div className="bl-skel" style={{ width: "8px", height: "8px", borderRadius: "50%" }} />
          <div className="bl-skel" style={{ width: "80px", height: "14px", borderRadius: "4px" }} />
        </div>
        <div className="bl-skel" style={{ width: "140px", height: "40px", borderRadius: "6px" }} />
      </div>

      {/* Blog card grid shimmer */}
      <div style={{ padding: "60px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "32px",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                animation: `bl-fadein 0.35s ease-out ${i * 0.06}s both`,
              }}
            >
              {/* Thumbnail */}
              <div className="bl-skel" style={{ width: "100%", height: "220px" }} />
              {/* Body */}
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div className="bl-skel" style={{ width: "60px", height: "20px", borderRadius: "20px" }} />
                  <div className="bl-skel" style={{ width: "80px", height: "20px", borderRadius: "20px" }} />
                </div>
                <div className="bl-skel" style={{ width: "90%", height: "20px", borderRadius: "4px" }} />
                <div className="bl-skel" style={{ width: "70%", height: "20px", borderRadius: "4px" }} />
                <div className="bl-skel" style={{ width: "100%", height: "14px", borderRadius: "4px" }} />
                <div className="bl-skel" style={{ width: "85%", height: "14px", borderRadius: "4px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                  <div className="bl-skel" style={{ width: "90px", height: "13px", borderRadius: "4px" }} />
                  <div className="bl-skel" style={{ width: "70px", height: "30px", borderRadius: "20px" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
</>
  );
}
