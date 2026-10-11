"use client";

import React, { useState, useRef, useEffect } from "react";

/* Small styled select for the storefront form */
function ScfSelect({ name, value, onChange, children, ariaLabel, placeholder }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);
  const opts = React.Children.toArray(children)
    .filter(c => c.props && c.props.value !== undefined)
    .map(c => ({ value: String(c.props.value), label: typeof c.props.children === 'string' ? c.props.children : String(c.props.value) }));
  const filtered = q ? opts.filter(o => o.label.toLowerCase().includes(q.toLowerCase())) : opts;
  const selected = opts.find(o => o.value === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(''); } };
    if (open) {
      document.addEventListener('mousedown', h);
      setTimeout(() => searchRef.current?.focus(), 40);
    }
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const pick = v => {
    onChange({ target: { name, value: v } });
    setOpen(false); setQ('');
  };
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" aria-label={ariaLabel}
        onClick={() => setOpen(!open)}
        className="scf-select"
        style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--scf-input-bg,#fff)', color: selected ? 'inherit' : '#999' }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected ? selected.label : (placeholder || 'Select...')}</span>
        <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.5 }}>▼</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999, background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', padding: 6, minWidth: 180 }}>
          {opts.length >= 4 && (
            <div style={{ marginBottom: 6, padding: '0 2px' }}>
              <input ref={searchRef} type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: 12, outline: 'none' }} />
            </div>
          )}
          {filtered.length === 0 ? (
            <div style={{ padding: '8px 10px', fontSize: 12, color: '#888' }}>No results</div>
          ) : filtered.map((o, i) => (
            <button key={i} type="button" onClick={() => pick(o.value)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 7, fontSize: 13, cursor: 'pointer', border: 'none', background: o.value === String(value) ? 'rgba(var(--primary-rgb,99,102,241),0.18)' : 'transparent', color: o.value === String(value) ? 'var(--primary,#6366f1)' : '#e5e5e5', fontWeight: o.value === String(value) ? 700 : 400 }}
            >{o.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

const INITIAL = {
  companyName: "", contactPerson: "", email: "", contactNo: "", address: "",
  standard: "", grade: "", thicknessMin: "", thicknessMax: "",
  widthMin: "", widthMax: "", qty: "", surfaceFinish: "",
  hardness: "", selectOne: "", uts: "", ys: "", elongation: "",
  endUse: "", specialRequirements: "",
};

export default function SingleContactForm() {
  const [fd, setFd] = useState(INITIAL);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (e) => setFd((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fd),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Something went wrong");
      setDone(true);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) return (
    <div className="scf-success">
      <i className="bi bi-check-circle-fill scf-success__icon"></i>
      <h3 className="scf-success__heading">Enquiry Submitted!</h3>
      <p className="scf-success__body">
        Our team will review your requirements and get back to you shortly.
      </p>
      <button className="primary-btn4 btn-hover black-bg mt-4"
        onClick={() => { setFd(INITIAL); setDone(false); }}>
        Submit Another
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        /* ══ SCF – 3-column compact form ══════════════════════ */
        .scf-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px 20px;
        }
        @media (max-width: 991px) {
          .scf-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 575px) {
          .scf-grid { grid-template-columns: 1fr; }
        }

        .scf-span2 { grid-column: span 2; }
        .scf-span3 { grid-column: 1 / -1; }
        @media (max-width: 575px) {
          .scf-span2, .scf-span3 { grid-column: 1 / -1; }
        }

        /* Section header */
        .scf-section-hd {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 4px;
          border-bottom: 1.5px solid #e8e8e8;
          margin-bottom: 4px;
        }
        .scf-section-hd__badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--primary-color1, #0a6ebd);
          color: #fff;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          padding: 3px 11px;
          border-radius: 20px;
          white-space: nowrap;
        }
        .scf-section-hd__line { flex: 1; height: 1px; background: #e8e8e8; }

        /* Fields */
        .scf-field { display: flex; flex-direction: column; gap: 4px; }
        .scf-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #666;
        }
        .scf-req { color: #e53e3e; }
        .scf-input, .scf-select, .scf-textarea {
          width: 100%;
          padding: 9px 13px;
          border: 1.5px solid #e2e2e2;
          border-radius: 8px;
          font-size: 13.5px;
          color: #1a1a1a;
          background: #fafafa;
          transition: border-color .2s, box-shadow .2s, background .2s;
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }
        .scf-input:focus, .scf-select:focus, .scf-textarea:focus {
          border-color: var(--primary-color1, #0a6ebd);
          box-shadow: 0 0 0 3px rgba(10,110,189,.09);
          background: #fff;
        }
        .scf-textarea { resize: vertical; min-height: 76px; }

        /* Range pair inside a single cell */
        .scf-range-lbl {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .5px; color: #666; margin-bottom: 4px;
        }
        .scf-range-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .scf-range-sub { font-size: 10.5px; color: #999; font-weight: 600;
          text-transform: uppercase; letter-spacing: .3px; margin-bottom: 3px; }

        /* Wrapper */
        .scf-wrap {
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 16px;
          padding: 1.75rem 2rem;
        }
        @media (max-width: 575px) { .scf-wrap { padding: 1.25rem; } }

        /* Footer */
        .scf-footer {
          display: flex; align-items: center; gap: 1.25rem;
          flex-wrap: wrap; margin-top: 1.5rem;
        }
        .scf-note { font-size: 12px; color: #999; }

        /* Success */
        .scf-success {
          text-align: center; padding: 4rem 1rem;
          background: #fff; border-radius: 16px; border: 1px solid #e8e8e8;
        }
        .scf-success__icon { font-size: 3.5rem; color: #22c55e; display: block; margin-bottom: .75rem; }
        .scf-success__heading { font-size: 1.5rem; font-weight: 700; }
        .scf-success__body { font-size: 14px; color: #666; max-width: 400px; margin: .5rem auto 0; }
      `}</style>

      <form onSubmit={submit} noValidate>
        <div className="scf-wrap">
          <div className="scf-grid">

            {/* ── CONTACT INFORMATION ── */}
            <div className="scf-section-hd">
              <span className="scf-section-hd__badge">
                <i className="bi bi-person-lines-fill"></i> Contact Information
              </span>
              <span className="scf-section-hd__line"></span>
            </div>

            <div className="scf-field">
              <label className="scf-label">Company Name <span className="scf-req">*</span></label>
              <input className="scf-input" type="text" name="companyName"
                value={fd.companyName} onChange={set} placeholder="Acme Industries" required />
            </div>

            <div className="scf-field">
              <label className="scf-label">Contact Person <span className="scf-req">*</span></label>
              <input className="scf-input" type="text" name="contactPerson"
                value={fd.contactPerson} onChange={set} placeholder="Full name" required />
            </div>

            <div className="scf-field">
              <label className="scf-label">Email ID <span className="scf-req">*</span></label>
              <input className="scf-input" type="email" name="email"
                value={fd.email} onChange={set} placeholder="you@company.com" required />
            </div>

            <div className="scf-field">
              <label className="scf-label">Contact No. <span className="scf-req">*</span></label>
              <input className="scf-input" type="tel" name="contactNo"
                value={fd.contactNo} onChange={set} placeholder="+91 00000 00000" required />
            </div>

            <div className="scf-field scf-span2">
              <label className="scf-label">Address</label>
              <input className="scf-input" type="text" name="address"
                value={fd.address} onChange={set} placeholder="Company address (optional)" />
            </div>

            {/* ── MATERIAL REQUIREMENTS ── */}
            <div className="scf-section-hd" style={{ marginTop: "8px" }}>
              <span className="scf-section-hd__badge">
                <i className="bi bi-layers-fill"></i> Material Requirements
              </span>
              <span className="scf-section-hd__line"></span>
            </div>

            <div className="scf-field">
              <label className="scf-label">Standard</label>
              <ScfSelect name="standard" ariaLabel="Select Standard" value={fd.standard} onChange={set} placeholder="Select Standard">
                <option value="">Select Standard</option>
                <option value="ASTM">ASTM</option><option value="JIS">JIS</option><option value="EN">EN</option>
              </ScfSelect>
            </div>

            <div className="scf-field">
              <label className="scf-label">Grade</label>
              <ScfSelect name="grade" ariaLabel="Select Grade" value={fd.grade} onChange={set} placeholder="Select Grade">
                <option value="">Select Grade</option>
                <option value="304">304</option><option value="316">316</option><option value="430">430</option>
              </ScfSelect>
            </div>

            <div className="scf-field">
              <label className="scf-label">Qty (Kg)</label>
              <input className="scf-input" type="text" name="qty"
                value={fd.qty} onChange={set} placeholder="e.g. 500" />
            </div>

            {/* Thickness – occupies 1 cell */}
            <div>
              <p className="scf-range-lbl">Thickness (mm)</p>
              <div className="scf-range-row">
                <div>
                  <p className="scf-range-sub">Min.</p>
                  <input className="scf-input" type="text" name="thicknessMin"
                    value={fd.thicknessMin} onChange={set} placeholder="0.05" />
                </div>
                <div>
                  <p className="scf-range-sub">Max.</p>
                  <input className="scf-input" type="text" name="thicknessMax"
                    value={fd.thicknessMax} onChange={set} placeholder="3.00" />
                </div>
              </div>
            </div>

            {/* Width – occupies 1 cell */}
            <div>
              <p className="scf-range-lbl">Width (mm)</p>
              <div className="scf-range-row">
                <div>
                  <p className="scf-range-sub">Min.</p>
                  <input className="scf-input" type="text" name="widthMin"
                    value={fd.widthMin} onChange={set} placeholder="10" />
                </div>
                <div>
                  <p className="scf-range-sub">Max.</p>
                  <input className="scf-input" type="text" name="widthMax"
                    value={fd.widthMax} onChange={set} placeholder="650" />
                </div>
              </div>
            </div>

            <div className="scf-field">
              <label className="scf-label">Surface Finish</label>
              <input className="scf-input" type="text" name="surfaceFinish"
                value={fd.surfaceFinish} onChange={set} placeholder="e.g. 2B, BA, No.4" />
            </div>

            {/* ── MECHANICAL PROPERTIES ── */}
            <div className="scf-section-hd" style={{ marginTop: "8px" }}>
              <span className="scf-section-hd__badge">
                <i className="bi bi-bar-chart-fill"></i> Mechanical Properties
              </span>
              <span className="scf-section-hd__line"></span>
            </div>

            <div className="scf-field">
              <label className="scf-label">Hardness</label>
              <input className="scf-input" type="text" name="hardness"
                value={fd.hardness} onChange={set} placeholder="e.g. HRC 30" />
            </div>

            <div className="scf-field">
              <label className="scf-label">Select One</label>
              <ScfSelect name="selectOne" ariaLabel="Select an option" value={fd.selectOne} onChange={set} placeholder="Select Option">
                <option value="">Select Option</option>
                <option value="Option 1">Option 1</option><option value="Option 2">Option 2</option>
              </ScfSelect>
            </div>

            <div className="scf-field">
              <label className="scf-label">UTS (N/mm²)</label>
              <input className="scf-input" type="text" name="uts"
                value={fd.uts} onChange={set} placeholder="620" />
            </div>

            <div className="scf-field">
              <label className="scf-label">YS (N/mm²)</label>
              <input className="scf-input" type="text" name="ys"
                value={fd.ys} onChange={set} placeholder="310" />
            </div>

            <div className="scf-field">
              <label className="scf-label">Elongation %</label>
              <input className="scf-input" type="text" name="elongation"
                value={fd.elongation} onChange={set} placeholder="40" />
            </div>

            <div className="scf-field">
              <label className="scf-label">End Use</label>
              <input className="scf-input" type="text" name="endUse"
                value={fd.endUse} onChange={set} placeholder="e.g. Automotive springs" />
            </div>

            <div className="scf-field scf-span3">
              <label className="scf-label">Other Special Requirements</label>
              <textarea className="scf-textarea" name="specialRequirements" rows={3}
                value={fd.specialRequirements} onChange={set}
                placeholder="Any additional specifications, certifications, or remarks…" />
            </div>

          </div>{/* /scf-grid */}

          {/* Submit */}
          <div className="scf-footer">
            <button type="submit" className="primary-btn4 btn-hover black-bg" disabled={busy}>
              {busy ? "Sending…" : "Submit Enquiry"}
            </button>
            <span className="scf-note">
              Fields marked <span className="scf-req">*</span> are required. Technical details are optional.
            </span>
          </div>
        </div>
      </form>
    </>
  );
}
