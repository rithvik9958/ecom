export const dynamic = 'force-dynamic';
import { Toaster } from 'react-hot-toast';
import { StoreAuthProvider } from '@/context/StoreAuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { CompareProvider } from '@/context/CompareContext';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import MobileBottomNav from '@/components/storefront/MobileBottomNav';
import CompareDock from '@/components/storefront/CompareDock';
import CustomerSupportWidget from '@/components/storefront/CustomerSupportWidget';
import PwaInstallPrompt from '@/components/storefront/PwaInstallPrompt';
import WebPushPrompt from '@/components/storefront/WebPushPrompt';
import { StoreThemeProvider } from '@/context/StoreThemeContext';
import { getEcomTheme, DEFAULT_ECOM_THEME } from '@/app/models/EcomTheme';
import { getEcomCategory } from '@/app/models/EcomCategory';
import GlobalSetting from '@/app/models/GlobalSetting';
import '@/css/storefront.css';


export const metadata = {
  manifest: '/manifest.json',
  title: {
    default: 'MyCart',
    template: '%s | MyCart',
  },
  description:
    'Your one-stop destination for online shopping. Fast delivery across India.',
  keywords: ['shopping', 'ecommerce', 'store', 'India'],
  openGraph: {
    type: 'website',
    siteName: 'MyCart',
  },
};

async function getCategories() {
  try {
    const Category = await getEcomCategory();
    const categories = await Category.find({ isActive: true }).sort({ order: 1, title: 1 }).lean();
    return JSON.parse(JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to load categories for header nav:', err);
    return [];
  }
}

async function getTheme() {
  try {
    const Theme = await getEcomTheme();
    const theme = await Theme.findOne({ id: 'global' }).lean();
    const gs = await GlobalSetting.findOne().lean().catch(() => null);

    const effectiveLogo = (theme?.logo && theme?.logo !== '/logo.png') 
      ? theme.logo 
      : (gs?.logoImage || theme?.logo || '/logo.png');

    const effectiveFavicon = (theme?.favicon && theme?.favicon !== '/favicon.ico') 
      ? theme.favicon 
      : (gs?.favicon || theme?.favicon || '/favicon.ico');

    const effectiveBrandName = theme?.brandName || gs?.adminTitle || 'EShop';

    if (theme) {
      return JSON.parse(JSON.stringify({
        ...DEFAULT_ECOM_THEME,
        ...theme,
        logo: effectiveLogo,
        favicon: effectiveFavicon,
        brandName: effectiveBrandName,
        lightMode: { ...DEFAULT_ECOM_THEME.lightMode, ...(theme.lightMode || {}) },
        darkMode: { ...DEFAULT_ECOM_THEME.darkMode, ...(theme.darkMode || {}) }
      }));
    }
  } catch (e) {
    console.error('Failed to load theme:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_ECOM_THEME));
}

// Server layout — fetches categories for nav, wraps in client providers
export default async function StorefrontLayout({ children }) {
  const categories = await getCategories();
  const theme = await getTheme();

  return (
    <StoreThemeProvider initialTheme={theme}>
      <div className="storefront-body">
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --store-primary: ${theme.primaryColor || '#111111'};
              --store-primary-dark: ${theme.secondaryColor || '#1e293b'};
              --store-accent: ${theme.accentColor || '#c59b27'};
              --store-bg: ${theme.lightMode?.bg || '#ffffff'};
              --store-surface: ${theme.lightMode?.surface || '#ffffff'};
              --store-text: ${theme.lightMode?.text || '#111111'};
              --store-muted: ${theme.lightMode?.muted || '#64748b'};
              --store-border: ${theme.lightMode?.border || '#e2e8f0'};

              /* Backwards-compatibility mappings */
              --fnp-green: ${theme.primaryColor || '#111111'};
              --fnp-green-dark: ${theme.secondaryColor || '#1e293b'};
              --fnp-gold: ${theme.accentColor || '#c59b27'};
              --fnp-cream: ${theme.lightMode?.bg || '#ffffff'};
              --fnp-white: ${theme.lightMode?.surface || '#ffffff'};
              --fnp-gray-900: ${theme.lightMode?.text || '#111111'};
            }

            .dark, .storefront-body.dark {
              --store-bg: ${theme.darkMode?.bg || '#0b0f19'};
              --store-surface: ${theme.darkMode?.surface || '#111827'};
              --store-text: ${theme.darkMode?.text || '#f8fafc'};
              --store-muted: ${theme.darkMode?.muted || '#94a3b8'};
              --store-border: ${theme.darkMode?.border || 'rgba(255, 255, 255, 0.12)'};

              /* Dark mode overrides for FNP tokens */
              --fnp-green: ${theme.primaryColor || '#111111'};
              --fnp-green-dark: ${theme.secondaryColor || '#1e293b'};
              --fnp-gold: ${theme.accentColor || '#c59b27'};
              --fnp-cream: ${theme.darkMode?.bg || '#0b0f19'};
              --fnp-white: ${theme.darkMode?.surface || '#111827'};
              --fnp-gray-900: ${theme.darkMode?.text || '#f8fafc'};
              --fnp-gray-700: #cbd5e1;
              --fnp-gray-500: #94a3b8;
              --fnp-gray-300: rgba(255, 255, 255, 0.18);
              --fnp-gray-200: rgba(255, 255, 255, 0.12);
              --fnp-gray-100: rgba(255, 255, 255, 0.08);
              --fnp-gray-50: rgba(255, 255, 255, 0.04);
            }
          `
        }} />
        <StoreAuthProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                <StorefrontHeader categories={categories} />
                <main className="storefront-main">
                  {children}
                </main>
                <StorefrontFooter />
                <MobileBottomNav />
                <CompareDock />
                <CustomerSupportWidget />
                <PwaInstallPrompt />
                <WebPushPrompt />
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      "@context": "https://schema.org",
                      "@type": "WebSite",
                      "name": theme.brandName || "EShop",
                      "url": process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
                      "potentialAction": {
                        "@type": "SearchAction",
                        "target": `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/products?search={search_term_string}`,
                        "query-input": "required name=search_term_string"
                      }
                    })
                  }}
                />
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      "@context": "https://schema.org",
                      "@type": "Organization",
                      "name": theme.brandName || "EShop",
                      "url": process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
                      "logo": `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}${theme.logo || "/logo.png"}`,
                      "contactPoint": {
                        "@type": "ContactPoint",
                        "telephone": "+91-9999999999",
                        "contactType": "Customer Service"
                      }
                    })
                  }}
                />
                <Toaster
                  position="bottom-right"
                  gutter={10}
                  toastOptions={{
                    duration: 3500,
                    style: {
                      background: '#18181b',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      padding: '12px 18px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.08)',
                      letterSpacing: '0.01em',
                      fontFamily: 'var(--fnp-font, "Poppins", sans-serif)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    },
                    success: {
                      style: {
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        background: '#111827',
                      },
                      iconTheme: {
                        primary: '#22c55e',
                        secondary: '#111827',
                      },
                    },
                    error: {
                      style: {
                        border: '1px solid rgba(239, 68, 68, 0.45)',
                        background: '#181111',
                      },
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#ffffff',
                      },
                    },
                  }}
                />
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </StoreAuthProvider>
      </div>
    </StoreThemeProvider>
  );
}
