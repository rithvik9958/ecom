export const dynamic = 'force-dynamic';
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NavigationProgress from "src/components/core/NavigationProgress";
import ClientTracker from "src/components/core/ClientTracker";
import { connectDB } from "./lib/config";
import { getEcomTheme, DEFAULT_ECOM_THEME } from "./models/EcomTheme";
import GlobalSetting from "./models/GlobalSetting";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export async function generateMetadata() {
  let faviconUrl = '/favicon.ico';
  let brandName = 'EShop';
  let logoUrl = '/logo.png';
  let description = 'Your one-stop destination for premium online shopping, gifts, and lifestyle products.';

  try {
    await connectDB();
    const Theme = await getEcomTheme();
    const theme = await Theme.findOne({ id: 'global' }).lean();
    const settings = await GlobalSetting.findOne().lean();

    if (theme?.favicon && theme.favicon !== '/favicon.ico') {
      faviconUrl = theme.favicon;
    } else if (settings?.favicon) {
      faviconUrl = settings.favicon;
    }

    if (theme?.brandName) brandName = theme.brandName;
    else if (settings?.adminTitle) brandName = settings.adminTitle;

    if (theme?.logo && theme.logo !== '/logo.png') logoUrl = theme.logo;
    else if (settings?.logoImage) logoUrl = settings.logoImage;
  } catch (e) {
    console.error("Failed to load metadata from DB", e);
  }

  return {
    metadataBase: new URL('http://localhost:3000'),
    title: {
      default: brandName,
      template: `%s | ${brandName}`
    },
    description,
    icons: {
      icon: [{ url: faviconUrl }],
      shortcut: [{ url: faviconUrl }],
      apple: [{ url: faviconUrl }],
    },
    openGraph: {
      title: brandName,
      description,
      siteName: brandName,
      locale: 'en_US',
      type: 'website',
      images: [{
        url: logoUrl,
        width: 800,
        height: 600,
        alt: `${brandName} Logo`,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: brandName,
      description,
      images: [logoUrl],
    },
    robots: {
      index: true,
      follow: true,
    }
  };
}

export default async function RootLayout({ children }) {
  let faviconUrl = '/favicon.ico';
  let brandName = 'EShop';
  let logoUrl = '/logo.png';

  try {
    const Theme = await getEcomTheme();
    const theme = await Theme.findOne({ id: 'global' }).lean();
    const settings = await GlobalSetting.findOne().lean();

    if (theme?.favicon && theme.favicon !== '/favicon.ico') {
      faviconUrl = theme.favicon;
    } else if (settings?.favicon) {
      faviconUrl = settings.favicon;
    }

    if (theme?.brandName) brandName = theme.brandName;
    else if (settings?.adminTitle) brandName = settings.adminTitle;

    if (theme?.logo && theme.logo !== '/logo.png') logoUrl = theme.logo;
    else if (settings?.logoImage) logoUrl = settings.logoImage;
  } catch (e) {}

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: brandName,
    url: 'http://localhost:3000',
    logo: logoUrl,
    description: 'Your one-stop destination for premium online shopping, gifts, and lifestyle products.'
  };

  return (
    <html
      lang="en"
      className={`h-full antialiased ${poppins.className}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href={faviconUrl} sizes="any" />
        <link rel="shortcut icon" href={faviconUrl} />
      </head>
      <body className="min-h-full flex flex-col">
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NavigationProgress />
        <ClientTracker />
        {children}
        <ToastContainer position="bottom-right" autoClose={3000} />
      </body>
    </html>
  );
}
