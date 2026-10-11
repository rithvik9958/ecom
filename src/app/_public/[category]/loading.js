/**
 * Product category page — instant loading shell.
 * Covers /[category] and /[category]/[slug] routes.
 */
export default function CategoryLoading() {
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
        <div style={{ position: "absolute", inset: 0 }} className="cat-shimmer" />
        <div style={{ display: "flex", gap: "8px", alignItems: "center", opacity: 0.5 }}>
          <div className="cat-skel" style={{ width: "50px", height: "14px", borderRadius: "4px" }} />
          <div className="cat-skel" style={{ width: "8px", height: "8px", borderRadius: "50%" }} />
          <div className="cat-skel" style={{ width: "120px", height: "14px", borderRadius: "4px" }} />
        </div>
        <div className="cat-skel" style={{ width: "220px", height: "40px", borderRadius: "6px" }} />
      </div>

      {/* Product grid shimmer */}
      <div style={{ padding: "60px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Section description */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="cat-skel" style={{ width: "200px", height: "28px", borderRadius: "6px", margin: "0 auto 14px" }} />
          <div className="cat-skel" style={{ width: "420px", maxWidth: "100%", height: "15px", borderRadius: "4px", margin: "0 auto 8px" }} />
          <div className="cat-skel" style={{ width: "340px", maxWidth: "100%", height: "15px", borderRadius: "4px", margin: "0 auto" }} />
        </div>

        {/* Product cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "28px",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                borderRadius: "14px",
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
                animation: `cat-fadein 0.4s ease-out ${i * 0.06}s both`,
              }}
            >
              <div className="cat-skel" style={{ width: "100%", height: "230px" }} />
              <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="cat-skel" style={{ width: "75%", height: "20px", borderRadius: "4px" }} />
                <div className="cat-skel" style={{ width: "95%", height: "13px", borderRadius: "4px" }} />
                <div className="cat-skel" style={{ width: "65%", height: "13px", borderRadius: "4px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                  <div className="cat-skel" style={{ width: "80px", height: "34px", borderRadius: "6px" }} />
                  <div className="cat-skel" style={{ width: "34px", height: "34px", borderRadius: "50%" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
</>
  );
}
