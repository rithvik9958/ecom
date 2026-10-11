/**
 * Dashboard route — instant loading shell.
 *
 * Shown between dashboard page navigations (e.g. /dashboard → /dashboard/blogs).
 * Matches the dashboard inner content area to avoid layout shift.
 * Server Component — no client JS.
 */
export default function DashboardLoading() {
  return (
    <div
      style={{
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        animation: "dash-fade-in 0.25s ease-out both",
      }}
    >
      {/* Page title bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="dash-skel" style={{ width: "200px", height: "28px", borderRadius: "8px", marginBottom: "10px" }} />
          <div className="dash-skel" style={{ width: "140px", height: "16px", borderRadius: "6px" }} />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <div className="dash-skel" style={{ width: "90px", height: "36px", borderRadius: "10px" }} />
          <div className="dash-skel" style={{ width: "36px", height: "36px", borderRadius: "10px" }} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="dash-skel-card"
            style={{
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              animationDelay: `${i * 0.06}s`,
            }}
          >
            <div className="dash-skel" style={{ width: "36px", height: "36px", borderRadius: "50%" }} />
            <div className="dash-skel" style={{ width: "80%", height: "14px", borderRadius: "4px" }} />
            <div className="dash-skel" style={{ width: "50%", height: "28px", borderRadius: "6px" }} />
          </div>
        ))}
      </div>

      {/* Table placeholder */}
      <div
        style={{
          borderRadius: "16px",
          border: "1px solid rgba(0,0,0,0.07)",
          overflow: "hidden",
          background: "var(--card, #fff)",
        }}
      >
        {/* Table head */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(0,0,0,0.07)",
            display: "flex",
            gap: "16px",
          }}
        >
          {[160, 120, 90, 80].map((w, i) => (
            <div key={i} className="dash-skel" style={{ width: `${w}px`, height: "14px", borderRadius: "4px" }} />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: "14px 20px",
              borderBottom: i < 5 ? "1px solid rgba(0,0,0,0.04)" : "none",
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <div className="dash-skel" style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", gap: "16px" }}>
              {[120, 90, 70].map((w, j) => (
                <div key={j} className="dash-skel" style={{ width: `${w}px`, height: "13px", borderRadius: "4px" }} />
              ))}
            </div>
            <div className="dash-skel" style={{ width: "60px", height: "22px", borderRadius: "20px" }} />
          </div>
        ))}
      </div>
</div>
  );
}
