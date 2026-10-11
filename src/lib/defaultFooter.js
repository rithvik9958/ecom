export const DEFAULT_ECOM_FOOTER = {
  key: 'global_footer',
  aboutSection: {
    isVisible: true,
    badge: "India's No. 1 Luxury Gifting Destination",
    title: "City Shop: India's Premier Online Gift, Flower & Luxury Hamper Boutique",
    content: `<p><strong>City Shop</strong> is India's most trusted online gifting brand dedicated to turning everyday moments into unforgettable memories. Whether you are celebrating <a href="/products?search=birthday">Birthdays</a>, <a href="/products?search=anniversary">Anniversaries</a>, Valentine’s Day, Mother’s Day, Raksha Bandhan, Diwali, or Christmas, our curated catalogue brings thoughtful and luxurious gifts right to your loved ones' doorsteps.</p><p>Our extensive collection features farm-fresh <a href="/category/flowers">flower bouquets</a>, artisanal handcrafted <a href="/category/cakes">gourmet cakes</a>, air-purifying <a href="/category/plants">potted plants</a>, bespoke <a href="/category/personalized">personalized keepsakes</a>, gourmet chocolates, and curated festive gift hampers.</p><p>Powered by a nationwide fulfillment network spanning over <strong>19,000+ PIN codes</strong> across India and international delivery across <strong>70+ countries</strong>, we ensure your heartfelt surprises arrive in pristine condition. Enjoy flexible delivery options including <strong>2-Hour Express Delivery</strong>, <strong>Midnight Surprise Delivery</strong>, and <strong>Same-Day Guaranteed Delivery</strong>.</p>`,
    stats: [
      { num: '19,000+', label: 'PIN Codes Served' },
      { num: '8 Million+', label: 'Smiles Delivered' },
      { num: '2-Hour', label: 'Express Delivery' },
      { num: '4.9 ★', label: 'Customer Rating' }
    ]
  },
  columns: [
    {
      id: 'col-policy',
      title: 'Policy Info',
      order: 1,
      isVisible: true,
      links: [
        { label: 'Terms & Conditions', url: '/terms', badge: '', isExternal: false },
        { label: 'Privacy Policy', url: '/privacy', badge: '', isExternal: false },
        { label: 'Return & Refund Policy', url: '/returns-policy', badge: '', isExternal: false },
        { label: 'Shipping & Delivery Policy', url: '/shipping-policy', badge: '', isExternal: false },
        { label: 'Terms of Use & Disclaimer', url: '/disclaimer', badge: '', isExternal: false },
        { label: 'Security & Compliance', url: '/security', badge: '', isExternal: false },
      ]
    },
    {
      id: 'col-about',
      title: 'About Company',
      order: 2,
      isVisible: true,
      links: [
        { label: 'About City Shop', url: '/about', badge: '', isExternal: false },
        { label: 'Our Story & Mission', url: '/about#story', badge: '', isExternal: false },
        { label: 'Customer Testimonials', url: '/testimonials', badge: 'Verified', isExternal: false },
        { label: 'The Gifting Blog', url: '/blog', badge: 'New', isExternal: false },
        { label: 'Corporate & Bulk Gifts', url: '/contact', badge: '', isExternal: false },
        { label: 'Help & FAQs Desk', url: '/faqs', badge: '', isExternal: false },
      ]
    },
    {
      id: 'col-business',
      title: 'City Shop Business',
      order: 3,
      isVisible: true,
      links: [
        { label: 'Corporate Gifting', url: '/contact', badge: '', isExternal: false },
        { label: 'Bulk & Custom Orders', url: '/contact', badge: '', isExternal: false },
        { label: 'Customer Helpdesk', url: '/contact', badge: '', isExternal: false },
        { label: 'Track Active Order', url: '/orders', badge: 'Live', isExternal: false },
        { label: 'Store Wallet', url: '/user/wallet', badge: '', isExternal: false },
        { label: 'Customer Reviews', url: '/testimonials', badge: '', isExternal: false },
      ]
    },
    {
      id: 'col-categories',
      title: 'Trending Gifting',
      order: 4,
      isVisible: true,
      links: [
        { label: 'Fresh Flower Bouquets', url: '/category/flowers', badge: 'Hot', isExternal: false },
        { label: 'Artisan Designer Cakes', url: '/category/cakes', badge: '', isExternal: false },
        { label: 'Gourmet Gift Hampers', url: '/category/hampers', badge: 'Luxury', isExternal: false },
        { label: 'Air-Purifying Plants', url: '/category/plants', badge: '', isExternal: false },
        { label: 'Personalized Gifts', url: '/category/personalized', badge: '', isExternal: false },
        { label: 'Chocolates & Sweets', url: '/category/chocolates', badge: '', isExternal: false },
      ]
    },
    {
      id: 'col-specialty',
      title: 'Express & Occasions',
      order: 5,
      isVisible: true,
      links: [
        { label: 'Midnight Surprise Delivery', url: '/category/midnight-gifts', badge: '11:59 PM', isExternal: false },
        { label: 'Same-Day Fast Delivery', url: '/category/same-day', badge: '', isExternal: false },
        { label: 'Birthday Celebrations', url: '/category/birthday', badge: '', isExternal: false },
        { label: 'Anniversary Specials', url: '/category/anniversary', badge: '', isExternal: false },
        { label: 'Congratulations & Cheer', url: '/category/congratulations', badge: '', isExternal: false },
        { label: 'Love & Romance Gifts', url: '/category/romance', badge: '', isExternal: false },
      ]
    }
  ],
  newsletter: {
    isVisible: true,
    title: 'Subscribe & Save',
    subtitle: 'Get instant ₹150 OFF on your first order, plus secret deals and festive gift previews.',
    discountCode: 'WELCOME150',
    supportPhone: '+91 11-26802680'
  },
  corporate: {
    isVisible: true,
    companyName: 'City Shop E-Retail Private Limited',
    cin: 'U52100HR2021PTC118882',
    regOffice: 'Plot No. 75P, Sector-44, Gurugram, Haryana, India - 122003',
    grievanceOfficer: 'Mr. S. Karmakar (grievance@cityshop.com)',
    helpline: '+91 11-26802680 / 9755-248-248',
    hours: '24 Hours / 7 Days a Week',
    complianceLinks: [
      { label: 'Statutory Disclosures', url: '/security' },
      { label: 'Grievance Desk', url: '/contact' },
      { label: 'CSR Policy', url: '/csr-policy' },
      { label: 'Investor Relations', url: '/investor-relations' },
      { label: 'Code of Conduct', url: '/code-of-conduct' },
      { label: 'Whistleblower Policy', url: '/whistleblower' }
    ]
  },
  bottomBar: {
    copyright: '© 1994–2026 City Shop E-Retail Pvt. Ltd. All rights reserved.',
    socialLinks: [
      { platform: 'Instagram', icon: 'instagram', url: 'https://instagram.com', isActive: true },
      { platform: 'Facebook', icon: 'facebook', url: 'https://facebook.com', isActive: true },
      { platform: 'YouTube', icon: 'youtube', url: 'https://youtube.com', isActive: true },
      { platform: 'Pinterest', icon: 'pinterest', url: 'https://pinterest.com', isActive: true },
      { platform: 'LinkedIn', icon: 'linkedin', url: 'https://linkedin.com', isActive: true },
      { platform: 'Twitter', icon: 'twitter', url: 'https://x.com', isActive: true }
    ],
    paymentBadges: []
  }
};
