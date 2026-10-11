"use client";
import { useState, useEffect } from "react";
import AIAssistantButton from "@/components/dashboard/AIAssistantButton";
import Breadcrumb from "@/components/dashboard/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FloatingInput, FloatingTextarea } from "@/components/ui/floating-input";
import { Save, MapPin, Search, FileText, Phone, Mail, Clock, MessageCircle, Building2, Sparkles } from "lucide-react";
import Toast from "@/components/dashboard/Toast";

export default function ContactPageCMS() {
  const [data, setData] = useState({
    headerTitle: "We’re Here to Help You Celebrate",
    headerSubtitle: "Have a question about your order, customized corporate hampers, or scheduled delivery? Reach out to our dedicated gifting concierges anytime.",
    headerImage: "",

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

    mapIframeUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3507.962635905063!2d77.0655!3d28.4505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d18f175402685%3A0x6b1070621415df82!2sSector%2044%2C%20Gurugram%2C%20Haryana%20122003!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",

    metatag: "Contact Us - City Shop Support & Concierge",
    metaDescription: "Get in touch with City Shop customer concierge for 24/7 order assistance, midnight delivery, and customized gifting.",
    metakeywords: "[\"contact\", \"customer support\", \"gifting concierge\", \"flower delivery help\"]",
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
    twitterCard: "summary_large_image",
    robots: "index, follow",
    schemaMarkup: "{}"
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [tab, setTab] = useState("channels");

  const addToast = (msg, type = "success") =>
    setToasts((t) => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/contact-page");
      const json = await res.json();

      if (json.data) {
        setData({
          headerTitle: json.data.headerTitle || "We’re Here to Help You Celebrate",
          headerSubtitle: json.data.headerSubtitle || "Have a question about your order, customized corporate hampers, or scheduled delivery? Reach out to our dedicated gifting concierges anytime.",
          headerImage: json.data.headerImage || "",

          phone: json.data.phone || "+91 11-26802680",
          phoneSub: json.data.phoneSub || "Mon–Sun, 24 Hours Active",

          email: json.data.email || "support@cityshop.com",
          emailSub: json.data.emailSub || "Avg. response under 15 mins",

          address: json.data.address || "Plot No. 75P, Sector-44, Gurugram, Haryana - 122003",
          addressSub: json.data.addressSub || "CIN: U52100HR2021PTC118882",

          deliveryHours: json.data.deliveryHours || "Same-Day: 8 AM – 9 PM\nMidnight: 11 PM – 11:59 PM",
          deliveryHoursSub: json.data.deliveryHoursSub || "365 Days a Year Across India",

          whatsappNumber: json.data.whatsappNumber || "911126802680",
          corporateEmail: json.data.corporateEmail || "corporate@cityshop.com",

          mapIframeUrl: json.data.mapIframeUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3507.962635905063!2d77.0655!3d28.4505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d18f175402685%3A0x6b1070621415df82!2sSector%2044%2C%20Gurugram%2C%20Haryana%20122003!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",

          metatag: json.data.metatag || "Contact Us - City Shop Support & Concierge",
          metaDescription: json.data.metaDescription || "Get in touch with City Shop customer concierge for 24/7 order assistance, midnight delivery, and customized gifting.",
          metakeywords: Array.isArray(json.data.metakeywords)
            ? JSON.stringify(json.data.metakeywords)
            : "[\"contact\", \"customer support\", \"gifting concierge\", \"flower delivery help\"]",
          canonicalUrl: json.data.canonicalUrl || "",
          ogTitle: json.data.ogTitle || "",
          ogDescription: json.data.ogDescription || "",
          twitterCard: json.data.twitterCard || "summary_large_image",
          robots: json.data.robots || "index, follow",
          schemaMarkup: json.data.schemaMarkup
            ? JSON.stringify(json.data.schemaMarkup, null, 2)
            : "{}"
        });
      }
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });

      const res = await fetch("/api/contact-page", {
        method: "PUT",
        body: formData
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      addToast("Contact Page settings saved successfully!");
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  const TABS = [
    { key: "channels", label: "Hero & Contact Channels", icon: FileText },
    { key: "escalation", label: "Fast Escalation Desk", icon: MessageCircle },
    { key: "map", label: "Google Map Embed", icon: MapPin },
    { key: "seo", label: "SEO Settings", icon: Search }
  ];

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading Contact CMS...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <Breadcrumb
          title="Contact Page Management"
          crumbs={[{ label: "Contact Page CMS" }]}
        />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 w-full">
        <Card className="border-0 shadow-sm shadow-primary/5 bg-background">
          <CardHeader className="border-b border-border/40 pb-5 px-6 py-5 bg-card rounded-t-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">Contact Page Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage hero header, 4 channel cards, fast connect routes, Google Map coordinates, and SEO tags.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-xl flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </Button>
            </div>
          </CardHeader>

          <div className="flex flex-wrap gap-2 border-b border-border px-6 mt-2 pb-3 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    tab === t.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>


          <form onSubmit={handleSave}>
            <CardContent className="p-6 bg-card rounded-b-2xl">
              
              {/* TAB 1: HERO & 4 CHANNEL CARDS */}
              {tab === "channels" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Hero Banner Section */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Hero Header Banner</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FloatingInput
                        label="Hero Title"
                        name="headerTitle"
                        value={data.headerTitle}
                        onChange={handleChange}
                        required
                      />
                      <FloatingInput
                        label="Hero Subtitle"
                        name="headerSubtitle"
                        value={data.headerSubtitle}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* 4 Contact Channels Section */}
                  <div className="pt-6 border-t border-border/40 space-y-6">
                    <h4 className="font-bold text-base text-foreground">4 Channel Information Cards</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Channel 1: Phone */}
                      <div className="p-5 border border-border rounded-xl bg-muted/10 space-y-4">
                        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                          <Phone className="w-4 h-4 text-primary" />
                          <span>Channel 1: Phone & WhatsApp</span>
                        </div>
                        <FloatingInput
                          label="Primary Phone Number"
                          name="phone"
                          value={data.phone}
                          onChange={handleChange}
                          placeholder="+91 11-26802680"
                        />
                        <FloatingInput
                          label="Availability Badge / Subtitle"
                          name="phoneSub"
                          value={data.phoneSub}
                          onChange={handleChange}
                          placeholder="Mon–Sun, 24 Hours Active"
                        />
                      </div>

                      {/* Channel 2: Email */}
                      <div className="p-5 border border-border rounded-xl bg-muted/10 space-y-4">
                        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                          <Mail className="w-4 h-4 text-primary" />
                          <span>Channel 2: Email Helpdesk</span>
                        </div>
                        <FloatingInput
                          label="Support Email Address"
                          name="email"
                          value={data.email}
                          onChange={handleChange}
                          placeholder="support@cityshop.com"
                        />
                        <FloatingInput
                          label="Response SLA Subtitle"
                          name="emailSub"
                          value={data.emailSub}
                          onChange={handleChange}
                          placeholder="Avg. response under 15 mins"
                        />
                      </div>

                      {/* Channel 3: Address */}
                      <div className="p-5 border border-border rounded-xl bg-muted/10 space-y-4">
                        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>Channel 3: Corporate Headquarters</span>
                        </div>
                        <FloatingInput
                          label="Office / Headquarters Address"
                          name="address"
                          value={data.address}
                          onChange={handleChange}
                          placeholder="Plot No. 75P, Sector-44, Gurugram, Haryana - 122003"
                        />
                        <FloatingInput
                          label="Company Identifier (CIN / Reg)"
                          name="addressSub"
                          value={data.addressSub}
                          onChange={handleChange}
                          placeholder="CIN: U52100HR2021PTC118882"
                        />
                      </div>

                      {/* Channel 4: Delivery Hours */}
                      <div className="p-5 border border-border rounded-xl bg-muted/10 space-y-4">
                        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>Channel 4: Delivery Fulfillment Hours</span>
                        </div>
                        <FloatingTextarea
                          label="Operating Hours Text"
                          name="deliveryHours"
                          value={data.deliveryHours}
                          onChange={handleChange}
                          rows={2}
                          placeholder="Same-Day: 8 AM – 9 PM&#10;Midnight: 11 PM – 11:59 PM"
                        />
                        <FloatingInput
                          label="Coverage Scope Subtitle"
                          name="deliveryHoursSub"
                          value={data.deliveryHoursSub}
                          onChange={handleChange}
                          placeholder="365 Days a Year Across India"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: FAST ESCALATION DESK */}
              {tab === "escalation" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="font-bold text-base text-foreground">Right Side Escalation & Fast Connect Routes</h4>
                  <p className="text-sm text-muted-foreground -mt-4">
                    Configure the quick-connect actions shown beside the message form.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 border border-border rounded-xl bg-muted/10 space-y-4">
                      <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                        <MessageCircle className="w-4 h-4 text-emerald-500" />
                        <span>Live WhatsApp Stylist Number</span>
                      </div>
                      <FloatingInput
                        label="WhatsApp Number (Digits with country code)"
                        name="whatsappNumber"
                        value={data.whatsappNumber}
                        onChange={handleChange}
                        placeholder="911126802680"
                      />
                      <p className="text-xs text-muted-foreground">Used for direct 1-click WhatsApp customer chat.</p>
                    </div>

                    <div className="p-5 border border-border rounded-xl bg-muted/10 space-y-4">
                      <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span>Corporate & B2B Gifting Email</span>
                      </div>
                      <FloatingInput
                        label="Corporate Team Email"
                        name="corporateEmail"
                        value={data.corporateEmail}
                        onChange={handleChange}
                        placeholder="corporate@cityshop.com"
                      />
                      <p className="text-xs text-muted-foreground">Used for B2B bulk orders and corporate queries.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GOOGLE MAP */}
              {tab === "map" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="font-bold text-base text-foreground">Interactive Google Maps Embed</h4>
                  
                  <div className="space-y-4">
                    <FloatingInput
                      label="Google Map Iframe Embed URL (src link only)"
                      name="mapIframeUrl"
                      value={data.mapIframeUrl}
                      onChange={handleChange}
                      placeholder="https://www.google.com/maps/embed?..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Go to Google Maps ➔ Share ➔ Embed a map ➔ Copy only the <code>src="..."</code> link.
                    </p>

                    {data.mapIframeUrl && (
                      <div className="mt-4 p-2 border border-border rounded-2xl bg-muted/10 overflow-hidden">
                        <iframe
                          src={data.mapIframeUrl}
                          width="100%"
                          height="320"
                          style={{ border: 0, borderRadius: "14px" }}
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: SEO SETTINGS */}
              {tab === "seo" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="font-bold text-base text-foreground">SEO & Meta Configuration</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FloatingInput
                      label="Page Title Tag (Meta Title)"
                      name="metatag"
                      value={data.metatag}
                      onChange={handleChange}
                    />
                    <FloatingInput
                      label="Canonical URL"
                      name="canonicalUrl"
                      value={data.canonicalUrl}
                      onChange={handleChange}
                      placeholder="https://cityshop.com/contact"
                    />
                  </div>

                  <FloatingTextarea
                    label="Meta Description"
                    name="metaDescription"
                    value={data.metaDescription}
                    onChange={handleChange}
                    rows={3}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FloatingInput
                      label="OpenGraph Title (og:title)"
                      name="ogTitle"
                      value={data.ogTitle}
                      onChange={handleChange}
                    />
                    <FloatingInput
                      label="Robots Meta Directives"
                      name="robots"
                      value={data.robots}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-border/40 flex justify-end">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-primary-foreground font-bold px-8 py-2.5 rounded-xl shadow-lg shadow-primary/20"
                >
                  {saving ? "Saving Changes..." : "Save Contact Page CMS"}
                </Button>
              </div>

            </CardContent>
          </form>
        </Card>
      </div>

      <Toast toasts={toasts} onRemove={id => setToasts(prev => prev.filter(x => x.id !== id))} />
    </div>
  );
}
