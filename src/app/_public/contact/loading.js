/**
 * Contact page — instant loading shell.
 * Shown while the server fetches ContactPage and PageBanner data.
 */
export default function ContactLoading() {
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
        <div style={{ position: "absolute", inset: 0 }} className="ct-shimmer" />
        <div style={{ display: "flex", gap: "8px", alignItems: "center", opacity: 0.5 }}>
          <div className="ct-skel" style={{ width: "50px", height: "14px", borderRadius: "4px" }} />
          <div className="ct-skel" style={{ width: "8px", height: "8px", borderRadius: "50%" }} />
          <div className="ct-skel" style={{ width: "90px", height: "14px", borderRadius: "4px" }} />
        </div>
        <div className="ct-skel" style={{ width: "180px", height: "40px", borderRadius: "6px" }} />
      </div>

      {/* Contact form + info shimmer */}
      <div style={{ padding: "60px 20px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
          {/* Left: info blocks */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="ct-skel" style={{ width: "70%", height: "28px", borderRadius: "6px" }} />
            <div className="ct-skel" style={{ width: "100%", height: "14px", borderRadius: "4px" }} />
            <div className="ct-skel" style={{ width: "85%", height: "14px", borderRadius: "4px" }} />
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div className="ct-skel" style={{ width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="ct-skel" style={{ width: "60%", height: "15px", borderRadius: "4px", marginBottom: "8px" }} />
                  <div className="ct-skel" style={{ width: "80%", height: "13px", borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
          {/* Right: form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="ct-skel" style={{ height: "52px", borderRadius: "8px" }} />
              <div className="ct-skel" style={{ height: "52px", borderRadius: "8px" }} />
            </div>
            <div className="ct-skel" style={{ height: "52px", borderRadius: "8px" }} />
            <div className="ct-skel" style={{ height: "52px", borderRadius: "8px" }} />
            <div className="ct-skel" style={{ height: "120px", borderRadius: "8px" }} />
            <div className="ct-skel" style={{ width: "140px", height: "48px", borderRadius: "8px" }} />
          </div>
        </div>
      </div>
</>
  );
}
