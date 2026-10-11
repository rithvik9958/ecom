/**
 * Certifications page — instant loading shell.
 */
export default function CertificationsLoading() {
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
        <div style={{ position: "absolute", inset: 0 }} className="cert-shimmer" />
        <div style={{ display: "flex", gap: "8px", alignItems: "center", opacity: 0.5 }}>
          <div className="cert-skel" style={{ width: "50px", height: "14px", borderRadius: "4px" }} />
          <div className="cert-skel" style={{ width: "8px", height: "8px", borderRadius: "50%" }} />
          <div className="cert-skel" style={{ width: "130px", height: "14px", borderRadius: "4px" }} />
        </div>
        <div className="cert-skel" style={{ width: "200px", height: "40px", borderRadius: "6px" }} />
      </div>

      {/* Certification cards shimmer */}
      <div style={{ padding: "60px 20px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div className="cert-skel" style={{ width: "180px", height: "28px", borderRadius: "6px", margin: "0 auto 12px" }} />
          <div className="cert-skel" style={{ width: "300px", maxWidth: "100%", height: "15px", borderRadius: "4px", margin: "0 auto" }} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "24px",
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                borderRadius: "12px",
                padding: "24px",
                background: "#fff",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "14px",
                animation: `cert-fadein 0.4s ease-out ${i * 0.05}s both`,
              }}
            >
              <div className="cert-skel" style={{ width: "120px", height: "80px", borderRadius: "8px" }} />
              <div className="cert-skel" style={{ width: "80%", height: "14px", borderRadius: "4px" }} />
              <div className="cert-skel" style={{ width: "60%", height: "12px", borderRadius: "4px" }} />
            </div>
          ))}
        </div>
      </div>
</>
  );
}
