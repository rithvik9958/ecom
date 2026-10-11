export const dynamic = 'force-dynamic';

import { connectDB } from '@/app/lib/config';
import { verifyCustomerToken } from '@/app/lib/customerAuth';
import { getEcomProduct } from '@/app/models/EcomProduct';
import { getEcomCategory } from '@/app/models/EcomCategory';
import { getEcomCoupon } from '@/app/models/EcomCoupon';
import { getEcomOrder } from '@/app/models/EcomOrder';
import PaymentSetting from '@/app/models/PaymentSetting';
import GlobalSetting from '@/app/models/GlobalSetting';

// ─── LLM Provider Callers with Auto-Fallback ────────────────────────────────

async function callGroq(apiKey, systemPrompt, messages) {
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text || ''
            }))
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });
      const data = await res.json();
      if (res.ok && data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
    } catch (err) {
      console.warn(`[Groq ${model} error]:`, err.message);
    }
  }
  throw new Error('Groq calls exhausted');
}

async function callCerebras(apiKey, systemPrompt, messages) {
  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text || ''
        }))
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });
  const data = await res.json();
  if (!res.ok || !data.choices?.[0]?.message?.content) {
    throw new Error(data.error?.message || 'Cerebras response empty');
  }
  return data.choices[0].message.content;
}

async function callOpenRouter(apiKey, systemPrompt, messages) {
  const models = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-7b-instruct:free',
    'openrouter/free'
  ];

  for (const model of models) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
          'X-Title': 'EShop AI Concierge'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text || ''
            }))
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });
      const data = await res.json();
      if (res.ok && data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
    } catch (err) {
      console.warn(`[OpenRouter ${model} error]:`, err.message);
    }
  }
  throw new Error('OpenRouter calls exhausted');
}

async function callGemini(apiKey, systemPrompt, messages) {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  const contents = [
    { role: 'user', parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}` }] },
    { role: 'model', parts: [{ text: 'Understood! I am ready to assist customers with warm, authentic, highly knowledgeable guidance.' }] }
  ];

  for (const m of messages) {
    contents.push({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text || '' }]
    });
  }

  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      });
      const data = await res.json();
      if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.warn(`[Gemini ${model} error]:`, err.message);
    }
  }
  throw new Error('Gemini calls exhausted');
}

// ─── Main Route Handler ──────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { message = '', history = [] } = body;
    const query = message.trim();

    if (!query) {
      return Response.json({
        success: true,
        reply: "Hello! 👋 I am your 24/7 AI Shopping Concierge. How can I help you make today special?",
        quickActions: [
          { label: '🎂 Gift Suggestions', text: 'Recommend gifts under ₹1000' },
          { label: '📦 Track My Order', text: 'Where is my order?' },
          { label: '🚚 Delivery Timelines', text: 'What are your delivery options?' },
          { label: '🎟️ Active Coupons', text: 'What discount coupons are active?' }
        ]
      });
    }

    await connectDB();

    // 1. Check Authenticated Customer Context
    const customer = verifyCustomerToken(request);
    let userOrders = [];
    let userContextSummary = 'Guest Customer (Not logged in)';

    if (customer?.id || customer?._id) {
      try {
        const EcomOrder = await getEcomOrder();
        const orders = await EcomOrder.find({
          $or: [
            { customerId: customer.id || customer._id },
            { email: customer.email }
          ]
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        userOrders = orders || [];
        userContextSummary = `Customer Profile: Name: "${customer.name || 'Customer'}", Email: "${customer.email}". Recent Orders Count: ${userOrders.length}. Orders Data: ${userOrders.map(o => `[Order #${o.orderNumber || String(o._id).slice(-8).toUpperCase()} | Status: ${o.status || 'Pending'} | Total: ₹${o.total || 0} | Placed: ${new Date(o.createdAt).toLocaleDateString('en-IN')} | Items: ${o.items?.map(i => `${i.title} x${i.quantity}`).join(', ') || 'N/A'}]`).join('; ')}`;
      } catch (err) {
        console.warn('[store-ai-assistant] customer orders fetch error:', err);
      }
    }

    // 2. Fetch Live Catalog, Categories, Coupons & Store Settings
    const EcomProduct = await getEcomProduct();
    const EcomCategory = await getEcomCategory();
    const EcomCoupon = await getEcomCoupon();

    const [categories, activeCoupons, paymentSettings, globalSettings] = await Promise.all([
      EcomCategory.find({ isActive: true }).select('name slug description').lean().catch(() => []),
      EcomCoupon.find({ isActive: true }).select('code description discountType discountValue minOrderValue').lean().catch(() => []),
      PaymentSetting.findOne().lean().catch(() => null),
      GlobalSetting.findOne().lean().catch(() => null)
    ]);

    // Intelligent Search across live products
    const lowerQuery = query.toLowerCase();
    const cleanWords = lowerQuery.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'what', 'how', 'can', 'you', 'show', 'give', 'please', 'tell', 'want'].includes(w));
    
    let matchingProducts = [];
    if (cleanWords.length > 0) {
      const regexPatterns = cleanWords.map(kw => new RegExp(kw, 'i'));
      matchingProducts = await EcomProduct.find({
        isActive: true,
        $or: [
          { title: { $in: regexPatterns } },
          { category: { $in: regexPatterns } },
          { description: { $in: regexPatterns } },
          { tags: { $in: regexPatterns } }
        ]
      })
        .select('id title price discountedPrice category thumbnail images rating reviewsCount slug stock')
        .limit(6)
        .lean()
        .catch(() => []);
    }

    // Fallback to top curated bestsellers
    if (matchingProducts.length === 0) {
      matchingProducts = await EcomProduct.find({ isActive: true })
        .sort({ rating: -1, order: 1 })
        .select('id title price discountedPrice category thumbnail images rating reviewsCount slug stock')
        .limit(4)
        .lean()
        .catch(() => []);
    }

    const formattedProducts = matchingProducts.map(p => ({
      id: p.id || String(p._id),
      title: p.title,
      price: p.price,
      discountedPrice: p.discountedPrice || 0,
      category: p.category || 'Gifts',
      thumbnail: p.thumbnail || p.images?.[0] || '/placeholder.png',
      rating: p.rating || 4.8,
      reviewsCount: p.reviewsCount || 120,
      slug: p.slug || p.id
    }));

    // 3. Collect LLM API Keys
    const keys = {
      groq:       globalSettings?.groqApiKey       || process.env.GROQ_API_KEY       || '',
      cerebras:   globalSettings?.cerebrasApiKey   || process.env.CEREBRAS_API_KEY   || '',
      openRouter: globalSettings?.openRouterApiKey || process.env.OPENROUTER_API_KEY || '',
      gemini:     globalSettings?.geminiApiKey     || process.env.GEMINI_API_KEY     || '',
    };

    const systemPrompt = `You are the authentic, highly attentive, and sophisticated 24/7 AI Shopping Concierge & Customer Care Specialist for "EShop" (India's leading premium destination for handcrafted designer cakes, fresh exotic flowers, live plants, luxury chocolates, and personalized gifts).

CUSTOMER CONTEXT:
${userContextSummary}

LIVE STORE CATALOG CONTEXT:
- Store Categories: ${categories.map(c => c.name).join(', ') || 'Flowers, Cakes, Plants, Chocolates, Personalized Gifts, Hampers'}
- Active Promo Coupons: ${activeCoupons.map(c => `${c.code} (${c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}${c.minOrderValue ? ` on min ₹${c.minOrderValue}` : ''})`).join(' | ') || 'WELCOME10 (10% off)'}
- Live In-Stock Relevant Products:
${formattedProducts.map(p => `• "${p.title}" (₹${p.discountedPrice > 0 ? p.discountedPrice : p.price}) - Category: ${p.category} | Rating: ${p.rating}★`).join('\n')}

STORE LOGISTICS & CUSTOMER POLICIES:
1. Delivery Speeds:
   - Same-Day Express Delivery available for select pin codes & cakes/flowers ordered before 6 PM.
   - Midnight Delivery Slots (11 PM - 11:59 PM) available for birthdays and anniversaries.
   - Standard National Shipping: 2 to 4 business days.
   - Customers can check exact delivery dates by entering their 6-digit pin code on product pages.
2. Returns & Refunds:
   - 7-Day hassle-free return or replacement on genuine verified orders directly from /user/returns.
   - Pending/processing orders can be cancelled with 1-click in /orders.
3. 100% Secure Payments:
   - Instant UPI QR Code (GPay, PhonePe, Paytm, BHIM), Credit/Debit cards, NetBanking, and Cash on Delivery (COD).
4. WhatsApp Helpline: ${paymentSettings?.supportPhone || '+91 98765 43210'}

COMMUNICATION PRINCIPLES:
- Speak naturally, warmly, and empathetically like a premier luxury store concierge.
- Address the user by their first name if logged in.
- If asked about orders, reference the customer's actual live orders from customer context.
- If asked for gift recommendations, suggest specific items from the live in-stock list with exact ₹ prices.
- If asked for discounts, provide real active coupon codes (e.g. ${activeCoupons[0]?.code || 'WELCOME10'}).
- Understand Hindi / Hinglish naturally (e.g. "bhai delivery kab tak aayegi?", "cake suggest karo under 800") and respond in a matching polite tone.
- Use markdown formatting with bullet points, bold key terms, and helpful emojis.`;

    let reply = '';
    let usedLLM = false;

    // Try available AI providers
    const sequence = ['groq', 'cerebras', 'openRouter', 'gemini'];
    for (const prov of sequence) {
      const k = keys[prov];
      if (k && !reply) {
        try {
          if (prov === 'groq') reply = await callGroq(k, systemPrompt, [...history, { sender: 'user', text: query }]);
          else if (prov === 'cerebras') reply = await callCerebras(k, systemPrompt, [...history, { sender: 'user', text: query }]);
          else if (prov === 'openRouter') reply = await callOpenRouter(k, systemPrompt, [...history, { sender: 'user', text: query }]);
          else if (prov === 'gemini') reply = await callGemini(k, systemPrompt, [...history, { sender: 'user', text: query }]);

          if (reply) {
            usedLLM = true;
            break;
          }
        } catch (err) {
          console.warn(`[store-ai-assistant] Provider ${prov} failed:`, err.message);
        }
      }
    }

    // 4. Dynamic NLP Conversational Generator (when no LLM key is configured)
    if (!reply) {
      const isGreeting = lowerQuery.match(/^(hi|hello|hey|hola|namaste|good\s*(morning|afternoon|evening)|wassup|yo)/i);
      const isHinglish = lowerQuery.match(/(bhai|karo|batao|chahiye|kab|kaise|kitna|hoga|kuch|achha|gift)/i);
      const customerFirstName = customer?.name ? customer.name.split(' ')[0] : null;

      if (lowerQuery.includes('track') || lowerQuery.includes('status') || lowerQuery.includes('where is my order') || lowerQuery.includes('order id') || lowerQuery.includes('shipment') || lowerQuery.includes('kahan hai')) {
        if (userOrders.length > 0) {
          const latest = userOrders[0];
          const orderNum = latest.orderNumber || String(latest._id).slice(-8).toUpperCase();
          const itemsSummary = latest.items?.map(i => `${i.title} (x${i.quantity})`).join(', ') || 'Your items';
          reply = `📦 **Hello ${customerFirstName || 'there'}! Here are the live details for your latest order:**\n\n• **Order ID:** \`#${orderNum}\`\n• **Current Status:** **${String(latest.status || 'Pending').toUpperCase()}**\n• **Items:** ${itemsSummary}\n• **Total Paid:** ₹${(latest.total || 0).toLocaleString('en-IN')}\n• **Placed On:** ${new Date(latest.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}\n\nYou can view real-time courier milestones anytime on the **[Track Order](/track-order)** page!`;
        } else {
          reply = `📦 **Live Order Tracking:**\n\nTo check your shipment's 4-stage live progress (Ordered ➔ Processing ➔ Dispatched ➔ Delivered):\n\n1. Head over to our **[Track Order](/track-order)** page.\n2. Enter your **Order ID** and the phone or email used during checkout.\n3. You'll get instant live tracking and estimated arrival times!`;
        }
      } else if (lowerQuery.includes('delivery') || lowerQuery.includes('shipping') || lowerQuery.includes('same day') || lowerQuery.includes('midnight') || lowerQuery.includes('speed') || lowerQuery.includes('slot') || lowerQuery.includes('pincode') || lowerQuery.includes('time')) {
        reply = `🚚 **Delivery Speeds & Flexible Slots:**\n\n• **⚡ Same-Day Express:** Available for selected fresh flowers, designer cakes & gifts placed before 6 PM.\n• **🌙 Midnight Surprise (11:00 PM – 11:59 PM):** Make birthdays and anniversaries memorable.\n• **📅 Scheduled Slots:** Choose morning, afternoon, or standard evening slots at checkout.\n• **📦 Standard Courier:** Delivered in 2 to 4 business days nationwide.\n\n*Pro-tip:* Enter your 6-digit pin code on any product page to check exact delivery slots and earliest available time!`;
      } else if (lowerQuery.includes('return') || lowerQuery.includes('refund') || lowerQuery.includes('cancel') || lowerQuery.includes('replace') || lowerQuery.includes('damaged') || lowerQuery.includes('wapas')) {
        reply = `🔄 **Hassle-Free 7-Day Returns & 100% Refunds:**\n\n• **Delivered Orders:** You can request a **💰 100% Refund** or **🔄 Free Replacement** within 7 days directly from the **[Returns & Refunds](/user/returns)** page.\n• **Pending Orders:** You can cancel orders in \`pending\` or \`processing\` status with 1-click in your order details.\n• **Refund Modes:** Instant store wallet credit or 3–5 business days to your original bank/UPI account.`;
      } else if (lowerQuery.includes('coupon') || lowerQuery.includes('discount') || lowerQuery.includes('offer') || lowerQuery.includes('promo') || lowerQuery.includes('code') || lowerQuery.includes('save') || lowerQuery.includes('deal')) {
        if (activeCoupons.length > 0) {
          const couponList = activeCoupons.map(c => `• **\`${c.code}\`**: ${c.description || `${c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}`}${c.minOrderValue ? ` on min order of ₹${c.minOrderValue}` : ''}`).join('\n');
          reply = `🎟️ **Here are today's active promo coupons for you:**\n\n${couponList}\n\n*Apply these codes directly in your **[Cart](/cart)** to enjoy instant savings on your order!*`;
        } else {
          reply = `🎟️ **Special Store Discounts:**\n\n• Use code **\`WELCOME10\`** to receive **10% OFF** your purchase!\n• Check your **[My Coupons](/user/coupons)** dashboard for personalized seasonal vouchers.`;
        }
      } else if (lowerQuery.includes('gift') || lowerQuery.includes('cake') || lowerQuery.includes('flower') || lowerQuery.includes('plant') || lowerQuery.includes('hamper') || lowerQuery.includes('chocolate') || lowerQuery.includes('birthday') || lowerQuery.includes('anniversary') || lowerQuery.includes('under') || lowerQuery.includes('recommend') || lowerQuery.includes('suggest')) {
        const topPicks = formattedProducts.slice(0, 3);
        reply = `🎁 **Curated Recommendations ${customerFirstName ? `for you, ${customerFirstName}` : ''}:**\n\nHere are some of our most loved, freshly handcrafted gifts available for delivery today:\n\n${topPicks.map(p => `• **${p.title}** — ₹${(p.discountedPrice || p.price).toLocaleString('en-IN')} (${p.rating}★)`).join('\n')}\n\nAll cakes include complimentary message cards, and fresh flowers are hand-tied on the day of delivery!`;
      } else if (lowerQuery.includes('payment') || lowerQuery.includes('upi') || lowerQuery.includes('cod') || lowerQuery.includes('card') || lowerQuery.includes('safe') || lowerQuery.includes('pay') || lowerQuery.includes('qr')) {
        reply = `💳 **100% Safe & Encrypted Payments:**\n\nWe support all major payment modes across India:\n• **Dynamic UPI QR Code** (GPay, PhonePe, Paytm, BHIM)\n• **Credit & Debit Cards** (Visa, Mastercard, RuPay)\n• **NetBanking** across 50+ major banks\n• **Cash on Delivery (COD)** on eligible pin codes\n\nAll transactions are secured with 256-bit bank-grade SSL encryption.`;
      } else if (isGreeting) {
        reply = isHinglish
          ? `Namaste ${customerFirstName ? customerFirstName : ''}! 🙏 Main aapka 24/7 AI Shopping & Support Concierge hoon. Bataiye aaj aapke liye kya special gift ya assistance chahiye?`
          : `Hello ${customerFirstName ? customerFirstName : 'there'}! 👋 Welcome to EShop. I am your 24/7 AI Shopping Concierge.\n\nI can help you with:\n• **Handcrafted Cakes, Flowers & Gift Recommendations**\n• **Live Order Tracking & Shipment Status**\n• **Delivery Speeds & Same-Day Slots**\n• **Exclusive Active Coupons & Discounts**\n• **7-Day Returns & Refunds**\n\nWhat can I assist you with today?`;
      } else {
        reply = `Thank you for your message! 😊 I am here to assist you with everything on EShop:\n\n• **Personalized Gift Suggestions** (Cakes, Flowers, Plants & Hampers)\n• **Real-Time Order Tracking**\n• **Same-Day & Midnight Delivery Slots**\n• **Active Promo Codes & Deals**\n• **Returns, Replacements & Refunds**\n\nFeel free to ask any question or browse our catalog!`;
      }
    }

    // 5. Dynamic Quick Action Suggestions
    let quickActions = [];
    if (lowerQuery.includes('track') || lowerQuery.includes('status') || lowerQuery.includes('order')) {
      quickActions = [
        { label: '📦 Open Live Tracker', url: '/track-order' },
        { label: '📋 View All Orders', url: '/user' },
        { label: '💬 Chat on WhatsApp', action: 'whatsapp' }
      ];
    } else if (lowerQuery.includes('gift') || lowerQuery.includes('cake') || lowerQuery.includes('flower') || lowerQuery.includes('recommend')) {
      quickActions = [
        { label: '🌸 Browse Catalog', url: '/products' },
        { label: '⚖️ Compare Items', url: '/compare' },
        { label: '🎟️ View Active Coupons', url: '/user/coupons' }
      ];
    } else if (lowerQuery.includes('coupon') || lowerQuery.includes('discount')) {
      quickActions = [
        { label: '🎟️ My Coupons', url: '/user/coupons' },
        { label: '🛒 Go to Cart', url: '/cart' }
      ];
    } else if (lowerQuery.includes('return') || lowerQuery.includes('refund')) {
      quickActions = [
        { label: '🔄 Request Return', url: '/user/returns' },
        { label: '💬 WhatsApp Support', action: 'whatsapp' }
      ];
    } else {
      quickActions = [
        { label: '🎂 Gift Suggestions', text: 'Recommend gifts under ₹1000' },
        { label: '📦 Track My Order', text: 'Where is my order?' },
        { label: '🎟️ Today\'s Coupons', text: 'What discount coupons are active?' },
        { label: '🚚 Delivery Timelines', text: 'What are your delivery options?' }
      ];
    }

    const shouldShowProducts = lowerQuery.includes('gift') || lowerQuery.includes('cake') || lowerQuery.includes('flower') || lowerQuery.includes('plant') || lowerQuery.includes('hamper') || lowerQuery.includes('recommend') || lowerQuery.includes('under') || lowerQuery.includes('price') || lowerQuery.includes('suggest') || lowerQuery.includes('buy') || lowerQuery.includes('chahiye');

    return Response.json({
      success: true,
      reply,
      products: shouldShowProducts ? formattedProducts.slice(0, 3) : [],
      quickActions,
      isAiPowered: usedLLM
    });
  } catch (err) {
    console.error('[store-ai-assistant POST]', err);
    return Response.json({
      success: false,
      reply: "I'm having a brief connection pause. Please tap below to chat with our 24/7 care team on WhatsApp!",
      quickActions: [{ label: '💬 WhatsApp Support', action: 'whatsapp' }]
    }, { status: 500 });
  }
}

