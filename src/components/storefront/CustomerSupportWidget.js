'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare, X, ChevronDown, ChevronUp, Phone, Package, RotateCcw,
  Tag, ShieldCheck, Clock, Send, Sparkles, ExternalLink, Bot,
  MessageCircle, User, Loader2, ArrowRight, Star, ShoppingBag, CheckCircle2
} from 'lucide-react';
import { useStoreTheme } from '@/context/StoreThemeContext';

const WhatsAppIcon = ({ size = 20, color = '#25D366' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ color, flexShrink: 0 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16C10.66 20.16 9.3 19.8 8.09 19.08L7.79 18.9L4.67 19.72L5.5 16.68L5.3 16.36C4.51 15.01 4.09 13.48 4.09 11.91C4.09 7.37 7.79 3.67 12.04 3.67ZM8.82 7.03C8.61 7.03 8.35 7.11 8.14 7.34C7.88 7.62 7.15 8.3 7.15 9.69C7.15 11.08 8.16 12.42 8.3 12.61C8.44 12.8 10.28 15.63 13.09 16.85C13.76 17.14 14.28 17.31 14.69 17.44C15.36 17.65 15.97 17.62 16.46 17.55C17 17.47 18.14 16.86 18.38 16.19C18.62 15.52 18.62 14.94 18.55 14.82C18.48 14.7 18.27 14.63 17.96 14.47C17.65 14.31 16.12 13.56 15.83 13.46C15.55 13.35 15.34 13.3 15.13 13.61C14.92 13.92 14.33 14.63 14.15 14.83C13.97 15.04 13.79 15.06 13.48 14.91C13.17 14.75 12.18 14.43 11.01 13.38C10.09 12.56 9.47 11.55 9.29 11.24C9.11 10.93 9.27 10.76 9.43 10.61C9.57 10.47 9.74 10.24 9.89 10.06C10.05 9.88 10.1 9.75 10.2 9.54C10.3 9.33 10.25 9.15 10.17 9C10.1 8.85 9.47 7.31 9.21 6.69C8.96 6.08 8.71 6.17 8.52 6.16C8.35 6.15 8.14 6.15 7.93 6.15C7.72 6.15 7.38 6.23 7.09 6.55L8.82 7.03Z" />
  </svg>
);

const FAQS = [
  {
    q: 'How fast will my order be delivered?',
    a: 'We offer Express Same-Day and Scheduled Delivery slots for eligible pin codes, and 2–4 business days for standard national shipping.'
  },
  {
    q: 'What is your Return & Replacement policy?',
    a: 'Perishable gifts like fresh flowers and cakes have a 24-hour freshness replacement guarantee. Non-perishables enjoy 7-day easy returns.'
  },
  {
    q: 'Can I send gifts anonymously or with a custom note?',
    a: 'Absolutely! You can choose "Hide sender details" and write a free customized greeting message during checkout.'
  },
  {
    q: 'How do I use my reward coupons & promo codes?',
    a: 'You can browse active promo codes in your account under "My Coupons" or enter coupon codes directly on the Cart page for instant savings.'
  },
  {
    q: 'Are online payments secure?',
    a: 'Yes, 100% bank-grade 256-bit encryption with support for Dynamic UPI QR Code, Credit/Debit cards, NetBanking, and Cash on Delivery.'
  }
];

const INITIAL_AI_MESSAGE = {
  sender: 'ai',
  text: "Hello! 👋 I am your 24/7 AI Shopping & Support Concierge. How can I help you today?",
  quickActions: []
};

// Formats markdown text (bolding, bullet points, links) safely
function renderFormattedText(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, lIdx) => {
    // Process markdown links [text](url) and bold **bold**
    const parts = line.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
    return (
      <span key={lIdx} style={{ display: 'block', minHeight: '1.2em' }}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
          }
          const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
          if (linkMatch) {
            const [, linkText, linkUrl] = linkMatch;
            return (
              <a
                key={pIdx}
                href={linkUrl}
                target={linkUrl.startsWith('http') ? '_blank' : '_self'}
                rel="noopener noreferrer"
                style={{
                  color: 'inherit',
                  textDecoration: 'underline',
                  fontWeight: 600
                }}
              >
                {linkText}
              </a>
            );
          }
          return part;
        })}
      </span>
    );
  });
}

export default function CustomerSupportWidget() {
  const pathname = usePathname();
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(p => pathname?.startsWith(p));

  const { isDarkMode } = useStoreTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'contact'
  const [openFaq, setOpenFaq] = useState(null);
  const [customMsg, setCustomMsg] = useState('');
  const [phoneSupport, setPhoneSupport] = useState('+91 98765 43210');
  const [whatsappNumber, setWhatsappNumber] = useState('919876543210');
  const [enableAiHelp, setEnableAiHelp] = useState(true);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState([INITIAL_AI_MESSAGE]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch('/api/store-payment-settings')
      .then(r => r.json())
      .then(data => {
        if (data.data?.supportPhone) {
          setPhoneSupport(data.data.supportPhone);
        }
        if (data.data?.whatsappNumber) {
          setWhatsappNumber(data.data.whatsappNumber.replace(/\D/g, ''));
        } else if (data.data?.supportPhone) {
          setWhatsappNumber(data.data.supportPhone.replace(/\D/g, ''));
        }
        if (data.data?.enableAiHelp !== undefined) {
          setEnableAiHelp(data.data.enableAiHelp);
          if (!data.data.enableAiHelp) setActiveTab('contact');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'ai' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiTyping, activeTab]);

  const handleSendWhatsApp = (customText) => {
    const text = customText || customMsg || 'Hi! I have a question regarding shopping / my order on your store.';
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setCustomMsg('');
  };

  const handleSendAiQuery = async (queryText) => {
    const query = (queryText || inputQuery).trim();
    if (!query || isAiTyping) return;

    // Append user message
    const userMsgObj = { sender: 'user', text: query };
    setChatMessages(prev => [...prev, userMsgObj]);
    setInputQuery('');
    setIsAiTyping(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/store-ai-assistant', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: query, history: chatMessages })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: data.reply || 'Here is what I found for you!',
            products: data.products || [],
            quickActions: data.quickActions || []
          }
        ]);
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: data.reply || "I am available to assist you. If you need urgent help, feel free to connect on WhatsApp!",
            quickActions: [{ label: '💬 Chat on WhatsApp', action: 'whatsapp' }]
          }
        ]);
      }
    } catch {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "I'm having a brief connection pause. Please tap below to chat with our live care team on WhatsApp!",
          quickActions: [{ label: '💬 Chat on WhatsApp', action: 'whatsapp' }]
        }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  if (isAuthPage) return null;

  return (
    <div
      className="fnp-support-widget-root"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: isOpen ? 9999 : 700,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
        fontFamily: 'inherit'
      }}
    >
      {/* ── CHAT & SUPPORT MODAL ── */}
      {isOpen && (
        <div
          className="fnp-support-modal"
          style={{
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: 'min(560px, calc(100dvh - 225px))',
            maxHeight: 'calc(100dvh - 225px)',
            borderRadius: '22px',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.25), 0 4px 14px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fnpWidgetPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            transformOrigin: 'bottom right',
            boxSizing: 'border-box'
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              background: 'linear-gradient(135deg, #111827 0%, #1e293b 100%)',
              padding: '1rem 1.15rem',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8'
                  }}
                >
                  {activeTab === 'ai' ? <Sparkles size={18} /> : <WhatsAppIcon size={18} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    {activeTab === 'ai' ? 'AI Shopping & Support' : 'Customer Help & WhatsApp'}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Active • Instant Response</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {activeTab === 'ai' && chatMessages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setChatMessages([INITIAL_AI_MESSAGE]);
                      setInputQuery('');
                    }}
                    title="Start New Chat (Clear History)"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#cbd5e1',
                      height: '28px',
                      padding: '0 8px',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#ffffff'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#cbd5e1'; }}
                    aria-label="Start New Chat"
                  >
                    <RotateCcw size={12} />
                    <span>New Chat</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#94a3b8',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#ffffff'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
                  aria-label="Close Support Modal"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Segmented Tab Switcher */}
            {enableAiHelp && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.28)',
                  padding: '3px',
                  borderRadius: '12px',
                  display: 'flex',
                  gap: '3px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('ai')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '9px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: activeTab === 'ai' ? 800 : 600,
                    background: activeTab === 'ai' ? '#ffffff' : 'transparent',
                    color: activeTab === 'ai' ? '#0f172a' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    transition: 'all 0.18s ease',
                    boxShadow: activeTab === 'ai' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                  }}
                >
                  <Sparkles size={13} color={activeTab === 'ai' ? '#d97706' : 'currentColor'} />
                  AI Assistant
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '9px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: activeTab === 'contact' ? 800 : 600,
                    background: activeTab === 'contact' ? '#ffffff' : 'transparent',
                    color: activeTab === 'contact' ? '#0f172a' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    transition: 'all 0.18s ease',
                    boxShadow: activeTab === 'contact' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                  }}
                >
                  <WhatsAppIcon size={14} color={activeTab === 'contact' ? '#16a34a' : 'currentColor'} />
                  WhatsApp &amp; FAQs
                </button>
              </div>
            )}
          </div>

          {/* ── TAB 1: AI CHAT CONVERSATION ── */}
          {activeTab === 'ai' && enableAiHelp ? (
            <div className="fnp-support-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Message List */}
              <div
                className="fnp-support-messages"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                {chatMessages.map((msg, idx) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                        gap: '5px'
                      }}
                    >
                      {/* Avatar badge */}
                      {!isUser && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, marginLeft: '2px' }}>
                          <Bot size={12} color="#38bdf8" /> AI Shopping Concierge
                        </div>
                      )}

                      {/* Text Bubble */}
                      <div
                        className={isUser ? 'fnp-chat-bubble-user' : 'fnp-chat-bubble-ai'}
                        style={{
                          maxWidth: '88%',
                          padding: '0.8rem 1rem',
                          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          fontSize: '0.82rem',
                          lineHeight: 1.5,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                        }}
                      >
                        {renderFormattedText(msg.text)}
                      </div>

                      {/* Product Recommendation Mini-Cards */}
                      {!isUser && msg.products && msg.products.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px', width: '92%' }}>
                          {msg.products.map((prod, pIdx) => (
                            <Link
                              key={pIdx}
                              href={`/products/${prod.id || prod.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="fnp-chat-prod-card"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 10px',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ width: '42px', height: '42px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'rgba(128,128,128,0.1)' }}>
                                <img
                                  src={prod.thumbnail}
                                  alt={prod.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={e => { e.currentTarget.src = '/placeholder.png'; }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {prod.title}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#16a34a' }}>
                                    ₹{(prod.discountedPrice || prod.price).toLocaleString('en-IN')}
                                  </span>
                                  {prod.rating && (
                                    <span style={{ fontSize: '0.68rem', color: '#eab308', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                                      ★ {prod.rating}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ArrowRight size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Quick Action Buttons */}
                      {!isUser && msg.quickActions && msg.quickActions.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px', maxWidth: '92%' }}>
                          {msg.quickActions.map((qa, qIdx) => (
                            qa.url ? (
                              <Link
                                key={qIdx}
                                href={qa.url}
                                onClick={() => setIsOpen(false)}
                                className="fnp-chat-quick-action"
                                style={{ textDecoration: 'none' }}
                              >
                                {qa.label} <ArrowRight size={11} />
                              </Link>
                            ) : qa.action === 'whatsapp' ? (
                              <button
                                key={qIdx}
                                type="button"
                                onClick={() => handleSendWhatsApp()}
                                className="fnp-chat-quick-action whatsapp"
                              >
                                <WhatsAppIcon size={12} /> {qa.label}
                              </button>
                            ) : qa.action === 'reset' ? (
                              <button
                                key={qIdx}
                                type="button"
                                onClick={() => {
                                  setChatMessages([INITIAL_AI_MESSAGE]);
                                  setInputQuery('');
                                }}
                                className="fnp-chat-quick-action"
                              >
                                <RotateCcw size={11} /> {qa.label}
                              </button>
                            ) : (
                              <button
                                key={qIdx}
                                type="button"
                                onClick={() => handleSendAiQuery(qa.text)}
                                className="fnp-chat-quick-action"
                              >
                                {qa.label}
                              </button>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* AI Typing Indicator */}
                {isAiTyping && (
                  <div className="fnp-chat-typing-bubble">
                    <Loader2 size={13} className="animate-spin" color="#38bdf8" />
                    <span>Analyzing store catalog &amp; crafting reply…</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="fnp-support-input-bar">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAiQuery();
                  }}
                  className="fnp-support-form"
                >
                  <input
                    type="text"
                    placeholder="Ask about cakes, delivery, orders, coupons..."
                    value={inputQuery}
                    onChange={e => setInputQuery(e.target.value)}
                    disabled={isAiTyping}
                    className="fnp-support-input"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || isAiTyping}
                    className="fnp-support-send-btn"
                    aria-label="Send query"
                  >
                    <Send size={13} />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* ── TAB 2: WHATSAPP & CONTACT HUB ── */
            <div className="fnp-support-body" style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* WhatsApp Primary Connect Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '1px solid #bbf7d0',
                  borderRadius: '14px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)', flexShrink: 0 }}>
                    <WhatsAppIcon size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#166534' }}>
                      Chat on WhatsApp
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#15803d' }}>
                      Live concierge assistance
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSendWhatsApp()}
                  style={{
                    background: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.35)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Chat Now <ExternalLink size={12} />
                </button>
              </div>

              {/* Quick Actions Links */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                  Quick Self-Service Hub
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <Link
                    href="/track-order"
                    onClick={() => setIsOpen(false)}
                    className="fnp-faq-hub-btn"
                  >
                    <Package size={14} color="#059669" /> Track Orders
                  </Link>

                  <Link
                    href="/user/returns"
                    onClick={() => setIsOpen(false)}
                    className="fnp-faq-hub-btn"
                  >
                    <RotateCcw size={14} color="#3b82f6" /> Returns &amp; Help
                  </Link>

                  <Link
                    href="/user/coupons"
                    onClick={() => setIsOpen(false)}
                    className="fnp-faq-hub-btn"
                  >
                    <Tag size={14} color="#d97706" /> View Offers
                  </Link>

                  <a
                    href={`tel:${phoneSupport.replace(/\s+/g, '')}`}
                    className="fnp-faq-hub-btn"
                  >
                    <Phone size={14} color="#16a34a" /> Call Helpline
                  </a>
                </div>
              </div>

              {/* Instant FAQs Accordion */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                  Frequently Asked Questions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {FAQS.map((faq, idx) => (
                    <div
                      key={idx}
                      className="fnp-faq-item"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="fnp-faq-btn"
                      >
                        <span>{faq.q}</span>
                        {openFaq === idx ? <ChevronUp size={13} color="currentColor" /> : <ChevronDown size={13} color="currentColor" />}
                      </button>
                      {openFaq === idx && (
                        <div className="fnp-faq-answer">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct WhatsApp Custom Message Input */}
              <div style={{ marginTop: 'auto', paddingTop: '0.35rem' }}>
                <div className="fnp-support-form">
                  <input
                    type="text"
                    placeholder="Type a message to WhatsApp..."
                    value={customMsg}
                    onChange={e => setCustomMsg(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && customMsg.trim()) {
                        handleSendWhatsApp(customMsg.trim());
                      }
                    }}
                    className="fnp-support-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(customMsg.trim())}
                    disabled={!customMsg.trim()}
                    style={{
                      background: customMsg.trim() ? '#25D366' : 'rgba(128, 128, 128, 0.2)',
                      color: '#ffffff',
                      border: 'none',
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: customMsg.trim() ? 'pointer' : 'default',
                      transition: 'all 0.15s',
                      flexShrink: 0
                    }}
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Modal Footer */}
          <div
            className="fnp-support-footer"
            style={{
              padding: '0.55rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.72rem'
            }}
          >
            <ShieldCheck size={13} color="#16a34a" />
            <span>24/7 Smart Support • 100% Genuine Care</span>
          </div>
        </div>
      )}

      {/* ── FLOATING TRIGGER PILL ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fnp-support-trigger-btn"
        aria-label="Customer Support & AI Help"
      >
        {isOpen ? (
          <>
            <X size={18} />
            <span>Close</span>
          </>
        ) : (
          <>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              {/* Animated pulse ring */}
              <span style={{
                position: 'absolute',
                inset: '-6px',
                borderRadius: '50%',
                background: 'transparent',
                border: '2px solid rgba(56, 189, 248, 0.4)',
                animation: 'fnpPulseRing 2s ease-out infinite'
              }} />
              {/* Bot Avatar */}
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 18px rgba(56, 189, 248, 0.5)'
              }}>
                <Sparkles size={16} color="#ffffff" />
              </div>
              {/* Online dot */}
              <span style={{
                position: 'absolute',
                bottom: '0px',
                right: '-1px',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid #111',
                boxShadow: '0 0 6px #22c55e'
              }} />
            </div>
            <div className="fnp-support-trigger-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800, lineHeight: 1 }}>AI Assistant</span>
              <span className="fnp-support-trigger-sub" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>Online • Ask me anything</span>
            </div>
          </>
        )}
      </button>

      <style jsx global>{`
        @keyframes fnpWidgetPop {
          0% { opacity: 0; transform: scale(0.92) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes fnpPulseRing {
          0% { transform: scale(0.9); opacity: 0.7; }
          70% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        /* Support Modal Base Styling */
        .fnp-support-modal {
          background: #ffffff;
          border: 1px solid #e2e8f0;
        }
        .dark .fnp-support-modal {
          background: #0f172a !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
        }

        .fnp-support-body {
          background: #f8fafc;
        }
        .dark .fnp-support-body {
          background: #0b0f19 !important;
        }

        /* Chat Bubbles */
        .fnp-chat-bubble-user {
          background: #0f172a;
          color: #ffffff;
        }
        .dark .fnp-chat-bubble-user {
          background: #2563eb !important;
          color: #ffffff !important;
        }

        .fnp-chat-bubble-ai {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #e2e8f0;
        }
        .dark .fnp-chat-bubble-ai {
          background: #1e293b !important;
          color: #f8fafc !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        /* Product Cards in Chat */
        .fnp-chat-prod-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
        }
        .fnp-chat-prod-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .dark .fnp-chat-prod-card {
          background: rgba(255, 255, 255, 0.04) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }
        .dark .fnp-chat-prod-card:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }

        /* Quick Action Buttons */
        .fnp-chat-quick-action {
          padding: 4px 10px;
          border-radius: 20px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          transition: all 0.15s ease;
        }
        .fnp-chat-quick-action:hover {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }
        .fnp-chat-quick-action.whatsapp {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
        }
        .fnp-chat-quick-action.whatsapp:hover {
          background: #25D366;
          color: #ffffff;
          border-color: #25D366;
        }
        .dark .fnp-chat-quick-action {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          color: #e2e8f0 !important;
        }
        .dark .fnp-chat-quick-action:hover {
          background: #ffffff !important;
          color: #0f172a !important;
          border-color: #ffffff !important;
        }
        .dark .fnp-chat-quick-action.whatsapp {
          background: rgba(37, 211, 102, 0.15) !important;
          border-color: rgba(37, 211, 102, 0.3) !important;
          color: #4ade80 !important;
        }
        .dark .fnp-chat-quick-action.whatsapp:hover {
          background: #25D366 !important;
          color: #ffffff !important;
        }

        /* Typing indicator */
        .fnp-chat-typing-bubble {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 6px 12px;
          border-radius: 12px;
          width: fit-content;
          font-size: 0.74rem;
          color: #64748b;
        }
        .dark .fnp-chat-typing-bubble {
          background: #1e293b !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #94a3b8 !important;
        }

        /* Input bar */
        .fnp-support-input-bar {
          padding: 0.75rem 1rem;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
        }
        .dark .fnp-support-input-bar {
          background: #0f172a !important;
          border-top-color: rgba(255, 255, 255, 0.08) !important;
        }

        .fnp-support-form {
          display: flex;
          align-items: center;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          padding: 4px 6px 4px 12px;
          background: #ffffff;
          transition: border-color 0.15s;
        }
        .dark .fnp-support-form {
          background: rgba(255, 255, 255, 0.04) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }

        .fnp-support-input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.8rem;
          color: #0f172a;
          background: transparent;
        }
        .dark .fnp-support-input {
          color: #ffffff !important;
        }

        .fnp-support-send-btn {
          background: #0f172a;
          color: #ffffff;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .fnp-support-send-btn:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: default;
        }
        .dark .fnp-support-send-btn {
          background: #2563eb;
        }
        .dark .fnp-support-send-btn:disabled {
          background: rgba(255, 255, 255, 0.1);
          color: #64748b;
        }

        /* WhatsApp FAQ Hub Buttons */
        .fnp-faq-hub-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 10px;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          font-size: 0.78rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.15s;
        }
        .fnp-faq-hub-btn:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }
        .dark .fnp-faq-hub-btn {
          background: rgba(255, 255, 255, 0.04) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }
        .dark .fnp-faq-hub-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }

        /* FAQ Accordions */
        .fnp-faq-item {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          background: #ffffff;
          transition: all 0.15s;
        }
        .dark .fnp-faq-item {
          background: rgba(255, 255, 255, 0.03) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        .fnp-faq-btn {
          width: 100%;
          padding: 8px 11px;
          background: transparent;
          border: none;
          text-align: left;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.78rem;
          font-weight: 700;
          color: #0f172a;
          cursor: pointer;
          gap: 6px;
        }
        .dark .fnp-faq-btn {
          color: #ffffff !important;
        }

        .fnp-faq-answer {
          padding: 0 11px 9px;
          font-size: 0.74rem;
          color: #64748b;
          line-height: 1.48;
        }
        .dark .fnp-faq-answer {
          color: #94a3b8 !important;
        }

        /* Footer */
        .fnp-support-footer {
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
        }
        .dark .fnp-support-footer {
          background: #0f172a !important;
          border-top-color: rgba(255, 255, 255, 0.08) !important;
          color: #94a3b8 !important;
        }

        /* Floating Trigger Pill */
        .fnp-support-trigger-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0f172a;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 10px 18px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 0.86rem;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fnp-support-trigger-btn:hover {
          transform: translateY(-2px) scale(1.02);
          background: #000000;
        }
        .dark .fnp-support-trigger-btn {
          background: #111827 !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        .dark .fnp-support-trigger-btn:hover {
          background: #1e293b !important;
        }

        @media (max-width: 768px) {
          .fnp-support-widget-root {
            bottom: calc(var(--fnp-bottom-nav-height, 60px) + env(safe-area-inset-bottom, 0px) + 16px) !important;
            right: 16px !important;
          }

          /* On PDP with sticky purchase bar active, lift support widget above the purchase buttons */
          body:has(.fnp-mobile-sticky-bar) .fnp-support-widget-root {
            bottom: calc(var(--fnp-bottom-nav-height, 60px) + 64px + env(safe-area-inset-bottom, 0px) + 16px) !important;
          }
        }

        @media (max-width: 480px) {
          .fnp-support-trigger-btn {
            padding: 6px !important;
            border-radius: 50% !important;
            width: 46px !important;
            height: 46px !important;
            justify-content: center !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35) !important;
          }
          .fnp-support-trigger-text {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
