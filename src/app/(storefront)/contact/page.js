'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Headphones,
  CheckCircle2,
  Building2,
  ChevronRight,
  ShieldCheck,
  Zap,
  MessageCircle,
  Sparkle,
  HeartHandshake
} from 'lucide-react';
import showToast from '@/lib/storeToast';

const DEFAULT_CONFIG = {
  headerTitle: "We’re Here to Help You Celebrate",
  headerSubtitle: "Have a question about your order, customized corporate hampers, or scheduled delivery? Reach out to our dedicated gifting concierges anytime.",
  phone: "+91 11-26802680",
  phoneSub: "Mon–Sun, 24 Hours Active",
  email: "support@cityshop.com",
  emailSub: "Avg. response under 15 mins",
  address: "Plot No. 75P, Sector-44, Gurugram, Haryana - 122003",
  addressSub: "CIN: U52100HR2021PTC118882",
  deliveryHours: "Same-Day: 8 AM – 9 PM\nMidnight: 11 PM – 11:59 PM",
  deliveryHoursSub: "365 Days a Year Across India",
  whatsappNumber: "911126802680",
  corporateEmail: "corporate@cityshop.com",
  mapIframeUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3507.962635905063!2d77.0655!3d28.4505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d18f175402685%3A0x6b1070621415df82!2sSector%2044%2C%20Gurugram%2C%20Haryana%20122003!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
};

export default function ContactPage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    orderId: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/contact-page')
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) {
          setConfig((prev) => ({
            ...prev,
            ...data.data
          }));
        }
      })
      .catch((err) => console.error('Failed to load contact config:', err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) {
      showToast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        contactPerson: form.name,
        companyName: form.orderId ? `Order #${form.orderId}` : 'Storefront Contact Inquiry',
        email: form.email,
        contactNo: form.phone,
        message: form.message
      };

      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok || data._id) {
        setSubmitted(true);
        showToast.success('Your message has been received! Our support concierge will reply shortly.');
      } else {
        showToast.error(data.message || 'Failed to submit enquiry');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Network error. Please try again or call our helpline.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="store-contact-page">

      {/* ── 1. Dynamic Luxury Hero Header ── */}
      <section className="store-about-hero-banner relative overflow-hidden">
        <div className="store-about-ambient-glow" />

        <div className="store-about-header-container relative z-10">
          {/* Frosted Glass Breadcrumb */}
          <div className="store-about-breadcrumb">
            <Link href="/" className="store-about-bc-link">Home</Link>
            <ChevronRight size={12} className="store-about-bc-sep" />
            <span className="store-about-bc-current">Contact & Support Concierge</span>
          </div>

          <div className="store-testimonials-hero-content">
            <h1 className="store-about-title">{config.headerTitle || DEFAULT_CONFIG.headerTitle}</h1>
            <p className="store-about-subtitle">
              {config.headerSubtitle || DEFAULT_CONFIG.headerSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. Contact Channels Grid (4 Dynamic Symmetrical Cards) ── */}
      <section className="store-contact-channels-section">
        <div className="store-container">
          <div className="store-contact-channels-grid">

            {/* Channel 1: Phone & WhatsApp */}
            <div className="store-contact-channel-card">
              <div className="store-contact-channel-icon">
                <Phone size={22} />
              </div>
              <h3 className="store-contact-channel-title">Phone & WhatsApp</h3>
              <p className="store-contact-channel-desc">Call or chat for instant order assistance</p>
              <a href={`tel:${(config.phone || DEFAULT_CONFIG.phone).replace(/\s+/g, '')}`} className="store-contact-channel-link">
                {config.phone || DEFAULT_CONFIG.phone}
              </a>
              <span className="store-contact-channel-sub">{config.phoneSub || DEFAULT_CONFIG.phoneSub}</span>
            </div>

            {/* Channel 2: Email Helpdesk */}
            <div className="store-contact-channel-card">
              <div className="store-contact-channel-icon">
                <Mail size={22} />
              </div>
              <h3 className="store-contact-channel-title">Email Helpdesk</h3>
              <p className="store-contact-channel-desc">For order updates, bulk hampers & inquiries</p>
              <a href={`mailto:${config.email || DEFAULT_CONFIG.email}`} className="store-contact-channel-link">
                {config.email || DEFAULT_CONFIG.email}
              </a>
              <span className="store-contact-channel-sub">{config.emailSub || DEFAULT_CONFIG.emailSub}</span>
            </div>

            {/* Channel 3: Corporate Headquarters */}
            <div className="store-contact-channel-card">
              <div className="store-contact-channel-icon">
                <MapPin size={22} />
              </div>
              <h3 className="store-contact-channel-title">Corporate Office</h3>
              <p className="store-contact-channel-desc">City Shop E-Retail Pvt. Ltd.</p>
              <p className="store-contact-channel-text">
                {config.address || DEFAULT_CONFIG.address}
              </p>
              <span className="store-contact-channel-sub">{config.addressSub || DEFAULT_CONFIG.addressSub}</span>
            </div>

            {/* Channel 4: Delivery Fulfillment */}
            <div className="store-contact-channel-card">
              <div className="store-contact-channel-icon">
                <Clock size={22} />
              </div>
              <h3 className="store-contact-channel-title">Delivery Operations</h3>
              <p className="store-contact-channel-desc">Express Same-Day & Midnight Slots</p>
              <p className="store-contact-channel-text whitespace-pre-line">
                {config.deliveryHours || DEFAULT_CONFIG.deliveryHours}
              </p>
              <span className="store-contact-channel-sub">{config.deliveryHoursSub || DEFAULT_CONFIG.deliveryHoursSub}</span>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. Interactive Enquiry Form & Executive Command Hub ── */}
      <section className="store-contact-main-section">
        <div className="store-container">
          <div className="store-contact-main-grid">

            {/* Left Column: Direct Message Form */}
            <div className="store-contact-form-card">
              <div className="store-contact-form-header">
                <h2 className="store-contact-form-title">Send Us a Direct Message</h2>
                <p className="store-contact-form-subtitle">
                  Fill out the details below and our customer support specialist will respond right away.
                </p>
              </div>

              {submitted ? (
                <div className="store-contact-success-box">
                  <div className="store-contact-success-icon">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Message Sent Successfully!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                    Thank you for reaching out. We have received your inquiry and an acknowledgment email has been sent.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: '', email: '', phone: '', orderId: '', message: '' });
                    }}
                    className="store-contact-submit-btn max-w-xs mx-auto mt-6"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="store-contact-form">
                  
                  {/* Row 1: Full Name & Email Address (2-in-a-row) */}
                  <div className="store-contact-row-2col">
                    <div className="store-contact-field-group">
                      <label className="store-contact-label">Your Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Rahul Sharma"
                        required
                        className="store-contact-input"
                      />
                    </div>

                    <div className="store-contact-field-group">
                      <label className="store-contact-label">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="e.g. rahul@example.com"
                        required
                        className="store-contact-input"
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone Number & Order ID (2-in-a-row) */}
                  <div className="store-contact-row-2col">
                    <div className="store-contact-field-group">
                      <label className="store-contact-label">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="e.g. +91 98765 43210"
                        required
                        className="store-contact-input"
                      />
                    </div>

                    <div className="store-contact-field-group">
                      <label className="store-contact-label">Order ID (Optional)</label>
                      <input
                        type="text"
                        name="orderId"
                        value={form.orderId}
                        onChange={handleChange}
                        placeholder="e.g. CS-9821 (if applicable)"
                        className="store-contact-input"
                      />
                    </div>
                  </div>

                  {/* Row 3: Your Message */}
                  <div className="store-contact-field-group">
                    <label className="store-contact-label">Your Message *</label>
                    <textarea
                      rows={4}
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Please describe your inquiry, customization request, or delivery question in detail..."
                      required
                      className="store-contact-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="store-contact-submit-btn"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send size={15} />
                        <span>Submit Inquiry</span>
                      </span>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Right Column: Unified Executive Live Concierge & Support Hub */}
            <div className="store-contact-hub-card">

              {/* 1. Clean Modern Header */}
              <div className="store-contact-hub-header">
                <div className="store-contact-hub-pill-tag">
                  <Headphones size={13} />
                  <span>Direct Escalation Desk</span>
                </div>
                <h3 className="store-contact-hub-title">Instant Support & Fast Connect</h3>
                <p className="store-contact-hub-subtitle">
                  Need immediate assistance with a live order or customized floral arrangement? Pick your preferred fast-connect channel below.
                </p>
              </div>

              {/* 2. Fast-Action Connect Grid (4 Dynamic Interactive Channels) */}
              <div className="store-contact-hub-actions-grid">
                
                {/* Action 1: WhatsApp Chat */}
                <a
                  href={`https://wa.me/${(config.whatsappNumber || DEFAULT_CONFIG.whatsappNumber).replace(/\+/g, '')}?text=Hi%20City%20Shop%20Concierge%2C%20I%20need%20assistance%20with%20my%20order.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-contact-hub-action-btn group"
                >
                  <div className="store-contact-hub-action-icon">
                    <MessageCircle size={18} />
                  </div>
                  <span className="store-contact-hub-action-label">WhatsApp Chat</span>
                  <span className="store-contact-hub-action-sub">Direct with Stylist</span>
                </a>

                {/* Action 2: VIP Priority Line */}
                <a
                  href={`tel:${(config.phone || DEFAULT_CONFIG.phone).replace(/\s+/g, '')}`}
                  className="store-contact-hub-action-btn group"
                >
                  <div className="store-contact-hub-action-icon">
                    <Phone size={18} />
                  </div>
                  <span className="store-contact-hub-action-label">Direct Call</span>
                  <span className="store-contact-hub-action-sub">Toll-Free Helpline</span>
                </a>

                {/* Action 3: Corporate & B2B Desk */}
                <a
                  href={`mailto:${config.corporateEmail || DEFAULT_CONFIG.corporateEmail}?subject=Corporate%20Gifting%20Inquiry`}
                  className="store-contact-hub-action-btn group"
                >
                  <div className="store-contact-hub-action-icon">
                    <Building2 size={18} />
                  </div>
                  <span className="store-contact-hub-action-label">B2B Corporate</span>
                  <span className="store-contact-hub-action-sub">Bulk Gifting Team</span>
                </a>

                {/* Action 4: Midnight Dispatch Desk */}
                <a
                  href={`tel:${(config.phone || DEFAULT_CONFIG.phone).replace(/\s+/g, '')}`}
                  className="store-contact-hub-action-btn group"
                >
                  <div className="store-contact-hub-action-icon">
                    <Zap size={18} />
                  </div>
                  <span className="store-contact-hub-action-label">Midnight Ops</span>
                  <span className="store-contact-hub-action-sub">11:59 PM Surprises</span>
                </a>

              </div>

              {/* 3. Customer Commitments & Guarantees Strip */}
              <div className="store-contact-hub-guarantees">
                <div className="store-contact-hub-guarantee-item">
                  <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0" />
                  <span>100% On-Time Guarantee</span>
                </div>
                <div className="store-contact-hub-guarantee-item">
                  <Sparkle size={14} className="text-amber-500 flex-shrink-0" />
                  <span>Farm-Fresh Florals</span>
                </div>
                <div className="store-contact-hub-guarantee-item">
                  <Clock size={14} className="text-blue-500 flex-shrink-0" />
                  <span>15-Min Response SLA</span>
                </div>
                <div className="store-contact-hub-guarantee-item">
                  <HeartHandshake size={14} className="text-rose-500 flex-shrink-0" />
                  <span>Hassle-Free Refunds</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── 4. Dynamic Interactive Location Map ── */}
      <section className="store-contact-map-section">
        <div className="store-container">
          <div className="store-contact-map-card">
            <iframe
              title="City Shop Headquarters Location"
              src={config.mapIframeUrl || DEFAULT_CONFIG.mapIframeUrl}
              className="store-contact-map-frame"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

    </div>
  );
}
