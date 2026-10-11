'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { Printer, ArrowLeft, Building2, Phone, MapPin, Mail, Globe, CheckCircle2, ShieldCheck, CreditCard, Wallet, Smartphone, Package, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function InvoicePage({ params }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const router = useRouter();
  const { user, loading: authLoading } = useStoreAuth();
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchOrder() {
      try {
        const token = localStorage.getItem('store_token');
        const res = await fetch(`/api/store-auth/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
        } else {
          router.push('/orders');
        }
        const settingsRes = await fetch('/api/store-invoice-settings');
        const settingsData = await settingsRes.json();
        if (settingsData.success) {
          setSettings(settingsData.settings);
        }
      } catch (err) {
        console.error('Failed to fetch invoice data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [user, authLoading, id, router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <div className="w-10 h-10 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Order Not Found</h2>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const invoiceNumber = `INV-${order._id.substring(order._id.length - 8).toUpperCase()}`;
  const shortOrderId = order._id.substring(order._id.length - 8).toUpperCase();

  // Robust Payment Mode Resolution
  const rawMethod = String(order.paymentMethod || '').toLowerCase().trim();
  const hasStripe = Boolean(order.stripeSessionId);
  const isPaid = order.paymentStatus === 'paid' || order.status === 'paid' || hasStripe || (rawMethod !== 'cod' && order.status !== 'cancelled' && order.paymentStatus !== 'failed');

  let paymentMethodLabel = 'Cash on Delivery (COD)';
  let PaymentIcon = Wallet;
  if (hasStripe || rawMethod === 'stripe' || rawMethod === 'card' || rawMethod === 'credit_card' || rawMethod === 'debit_card') {
    paymentMethodLabel = 'Credit / Debit Card (Stripe)';
    PaymentIcon = CreditCard;
  } else if (rawMethod === 'upi') {
    paymentMethodLabel = 'UPI / Instant QR Payment';
    PaymentIcon = Smartphone;
  } else if (rawMethod === 'razorpay') {
    paymentMethodLabel = 'Online Payment (Razorpay)';
    PaymentIcon = CreditCard;
  } else if (rawMethod === 'cod' && isPaid) {
    paymentMethodLabel = 'Card / Online (Prepaid)';
    PaymentIcon = CreditCard;
  } else if (rawMethod && rawMethod !== 'cod') {
    paymentMethodLabel = order.paymentMethod.toUpperCase();
  }

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '2.5rem 1rem', fontFamily: 'var(--font-inter, -apple-system, sans-serif)' }}>
      
      {/* Top Controls Bar - Hidden on print */}
      <div className="no-print" style={{ maxWidth: '880px', margin: '0 auto 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link 
          href={`/orders/${id}`} 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#334155', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', background: '#fff', padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <ArrowLeft size={16} /> Back to Order
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--fnp-green)', color: '#fff', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)', transition: 'all 0.2s' }}
          >
            <Printer size={17} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Modern Invoice Document Card */}
      <div className="invoice-document" style={{ 
        maxWidth: '880px', margin: '0 auto', background: '#fff', 
        boxShadow: '0 12px 36px rgba(0,0,0,0.06)', borderRadius: '16px', overflow: 'hidden',
        border: '1px solid #e2e8f0', position: 'relative'
      }}>
        
        {/* Top Accent Stripe */}
        <div style={{ height: '6px', background: 'linear-gradient(90deg, var(--fnp-green) 0%, #15803d 50%, #047857 100%)' }}></div>

        <div style={{ padding: '3rem 3.5rem' }}>
          
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
            
            {/* Left Company Details */}
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img 
                  src="/logo.png" 
                  alt={settings?.companyName || "Store"} 
                  style={{ height: '44px', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a' }}>
                  {settings?.companyName || "City Shop"}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', color: '#64748b', fontSize: '0.86rem', lineHeight: 1.45 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Building2 size={14} color="var(--fnp-green)" /> {settings?.companyAddress || '123 Tech Park, Sector 45, Gurugram, India 122003'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Phone size={14} color="var(--fnp-green)" /> {settings?.supportPhone || '+91 98765 43210'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Mail size={14} color="var(--fnp-green)" /> {settings?.supportEmail || 'support@cityshop.com'}
                </span>
                {settings?.taxId && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#334155', marginTop: '0.2rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', width: 'fit-content' }}>
                    GSTIN / Tax ID: {settings.taxId}
                  </span>
                )}
              </div>
            </div>

            {/* Right Invoice & Order Metadata Box */}
            <div style={{ textAlign: 'right', minWidth: '240px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#15803d', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                <ShieldCheck size={13} /> Official Tax Invoice
              </div>
              
              <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                {invoiceNumber}
              </h2>

              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'right', fontSize: '0.86rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <span style={{ color: '#64748b' }}>Order Reference:</span>
                  <strong style={{ color: '#0f172a' }}>#{shortOrderId}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <span style={{ color: '#64748b' }}>Invoice Date:</span>
                  <strong style={{ color: '#0f172a' }}>{orderDate}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Payment Status:</span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '50px',
                    background: isPaid ? '#ecfdf5' : '#fffbeb',
                    color: isPaid ? '#15803d' : '#b45309',
                    border: `1px solid ${isPaid ? '#bbf7d0' : '#fde68a'}`
                  }}>
                    {isPaid ? <CheckCircle2 size={11} /> : null}
                    {isPaid ? 'PAID IN FULL' : 'PAY ON DELIVERY'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Customer & Shipping 2-Column Info Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            
            {/* Billed To Box */}
            <div style={{ background: '#f8fafc', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.8px', marginBottom: '0.6rem', fontWeight: 800 }}>
                Billed To
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                {user?.name || order.customerName || 'Valued Customer'}
              </div>
              <div style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.5 }}>
                <div>{user?.email || order.email}</div>
                {(user?.phone || order.phone) && <div style={{ marginTop: '2px' }}>Ph: {user?.phone || order.phone}</div>}
              </div>
            </div>
            
            {/* Shipped & Delivered To Box */}
            <div style={{ background: '#f8fafc', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.8px', marginBottom: '0.6rem', fontWeight: 800 }}>
                Shipped & Delivered To
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                {order.address?.name || order.customerName || user?.name}
              </div>
              <div style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.5, display: 'flex', gap: '0.45rem' }}>
                <MapPin size={15} color="var(--fnp-green)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                <div>
                  {order.address?.flat ? (
                    <>
                      <span>{order.address.flat}, {order.address.locality}</span><br />
                      <span>{order.address.city}, {order.address.state} - <strong>{order.address.pincode || order.address.postalCode}</strong></span>
                    </>
                  ) : (
                    <>
                      <span>{order.address}</span><br />
                      <span>{order.city || order.address?.city}, {order.state || order.address?.state} - <strong>{order.postalCode || order.address?.postalCode}</strong></span>
                    </>
                  )}
                  {(order.address?.phone || order.phone) && (
                    <div style={{ marginTop: '3px', fontWeight: 600, color: '#334155' }}>
                      Ph: {order.address?.phone || order.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Itemized Table */}
          <div style={{ marginBottom: '2.5rem', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.8px', width: '52%' }}>Item Details</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.8px', width: '16%' }}>Unit Price</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.8px', width: '12%' }}>Qty</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.8px', width: '20%' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => {
                  const vAttrs = item.selectedVariantAttrs || item.variant?.attrs;
                  return (
                    <tr key={idx} style={{ borderBottom: idx !== order.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.98rem', marginBottom: '0.2rem' }}>
                          {item.title}
                        </div>
                        
                        {vAttrs && typeof vAttrs === 'object' && Object.keys(vAttrs).length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '3px 0' }}>
                            {Object.entries(vAttrs).map(([k, v]) => (
                              <span key={k} style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                {k.replace(/_/g, ' ')}: {v}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.addons && item.addons.length > 0 && (
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                            <span style={{ fontWeight: 600 }}>Addons: </span>
                            {item.addons.map(a => `${a.title} (+₹${a.price})`).join(', ')}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#475569' }}>
                        ₹{(item.price || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#0f172a', fontWeight: 700 }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#0f172a', fontWeight: 800 }}>
                        ₹{((item.price || 0) * item.quantity).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Payment Overview & Financial Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
            
            {/* Left Terms & Payment Stamp */}
            <div style={{ flex: 1, minWidth: '260px' }}>
              
              {/* Payment Mode Box */}
              <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fnp-green)', flexShrink: 0 }}>
                  <PaymentIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Payment Method
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                    {paymentMethodLabel}
                  </div>
                </div>
              </div>

              {/* Terms Card */}
              <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.8px', marginBottom: '0.4rem', fontWeight: 800 }}>
                  Terms & Conditions
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {settings?.terms || '1. Returns and refunds accepted within 7 days per store return policy.\n2. In case of queries, please contact our support team with your Invoice Number.'}
                </p>
              </div>
            </div>
            
            {/* Right Calculation Totals */}
            <div style={{ width: '320px', maxWidth: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                <span>Items Subtotal:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{(order.subtotal || order.total || 0).toLocaleString('en-IN')}</span>
              </div>

              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', color: '#16a34a', fontSize: '0.9rem', fontWeight: 600 }}>
                  <span>Discount Applied:</span>
                  <span>-₹{(order.discount).toLocaleString('en-IN')}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                <span>Delivery / Shipping:</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>
                  {order.shipping ? `₹${order.shipping.toLocaleString('en-IN')}` : 'FREE'}
                </span>
              </div>
              
              {order.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                  <span>GST / Tax:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{(order.tax).toLocaleString('en-IN')}</span>
                </div>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#fff',
                borderRadius: '10px',
                marginTop: '0.75rem',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
              }}>
                <span style={{ fontSize: '1rem', fontWeight: 800 }}>Total Amount:</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#4ade80' }}>
                  ₹{(order.total || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

          </div>

          {/* Computer Generated Authentication Notice */}
          <div style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.8rem' }}>
            This is an electronically generated invoice validated by the store system. No physical signature is required.
          </div>

        </div>
      </div>
      
      {/* Print CSS Rules */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .invoice-document { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: 100% !important; border-radius: 0 !important; }
        }
      `}} />
    </div>
  );
}
