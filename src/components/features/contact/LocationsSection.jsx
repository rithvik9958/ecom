import React from "react";

export default function LocationsSection({ locations }) {
  const displayLocations = (locations || []).filter(loc => loc.isActive !== false);

  return (
    <section className="locations-section section bg-light section my-0">
      <div className="container">
        <div className="section-title text-center mb-5">
          <span>Our Network</span>
          <h2>Our Offices & Divisions</h2>
        </div>

        <div className="row g-4">
          {displayLocations.map((loc, index) => (
            <div className="col-lg-4 col-md-6" key={index}>
              <div
                className="location-card bg-white p-4 h-100 shadow-sm"
                style={{
                  borderRadius: "8px",
                  borderTop: "4px solid var(--primary-color1, #c8a84b)",
                  transition: "all 0.3s ease",
                }}
              >
                <h5
                  className="mb-4 text-uppercase fw-bold"
                  style={{ fontSize: "16px", letterSpacing: "0.5px" }}
                >
                  {loc.title}
                </h5>

                <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                  <li className="d-flex align-items-start gap-3">
                    <i className="bi bi-geo-alt fs-5 text-secondary"></i>
                    <span className="text-muted" style={{ fontSize: "15px" }}>
                      {loc.address}
                    </span>
                  </li>
                  <hr className="my-1 border-light" />
                  <li className="d-flex align-items-start gap-3">
                    <i className="bi bi-telephone fs-5 text-secondary"></i>
                    <span className="text-muted" style={{ fontSize: "15px" }}>
                      {loc.phone && loc.phone.split(",").map((p, i) => (
                        <React.Fragment key={i}>
                          {p.trim()}
                          {i < loc.phone.split(",").length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </span>
                  </li>
                  <li className="d-flex align-items-start gap-3">
                    <i className="bi bi-envelope fs-5 text-secondary"></i>
                    <span
                      className="text-muted text-break"
                      style={{ fontSize: "15px" }}
                    >
                      {loc.email && loc.email.split(",").map((e, i) => (
                        <React.Fragment key={i}>
                          <a
                            href={`mailto:${e.trim()}`}
                            className="text-muted text-decoration-none hover-primary"
                          >
                            {e.trim()}
                          </a>
                          {i < loc.email.split(",").length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
