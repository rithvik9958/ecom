import Header from "src/components/layout/Header";
import Footer from "src/components/layout/Footer";
import MaintenanceScreen from "src/components/core/MaintenanceScreen";
import Script from "next/script";
import FloatingContactButtons from "src/components/layout/FloatingContactButtons";
import GlobalQuoteModal from "src/components/core/GlobalQuoteModal";
import SmoothScroller from "src/components/animations/SmoothScroller";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'swiper/css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'boxicons/css/boxicons.min.css';
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import "@/css/style.css";

import { connectDB } from "src/app/lib/config";
import About from "src/app/models/About";
import Category from "src/app/models/Category";
import Product from "src/app/models/Product";
import Section from "src/app/models/Section";
import GlobalSetting from "src/app/models/GlobalSetting";
import CustomPage from "src/app/models/CustomPage";

export const revalidate = 300; // Rebuild nav data every 5 minutes (ISR)
// Removed: force-dynamic — nav categories/sections don't change per-request.
// Call revalidatePath('/') from the dashboard after saving categories/sections.

export async function generateMetadata() {
  try {
    await connectDB();
    const settings = await GlobalSetting.findOne().lean();
    const verificationKey = settings?.googleSearchConsoleKey || '';
    if (!verificationKey) return {};
    // Strip the full <meta> tag if user accidentally pasted it — extract content value only
    const match = verificationKey.match(/content=["']([^"']+)["']/i);
    const contentValue = match ? match[1] : verificationKey;
    return {
      verification: {
        google: contentValue,
      },
    };
  } catch {
    return {};
  }
}


const initialMenuData = [
  // { id: 1, title: "Home", slug: "/", children: [] }, // Hidden as requested
  { id: 3, title: "Our Products", slug: "#", children: [] },
  { id: 8, title: "Contact", slug: "/contact", children: [] },
];

export default async function PublicLayout({ children }) {
  let navData = [...initialMenuData];
  let globalSettings = null;

  try {
    await connectDB();
    const [aboutPages, categories, products, sections, settings, customPagesData] = await Promise.all([
      About.find({ isActive: true }).sort({ sort: 1 }).lean(),
      Category.find({ isActive: true }).sort({ sort: 1 }).lean(),
      Product.find({ isActive: true }).lean(),
      Section.find({ isActive: true }).lean(),
      GlobalSetting.findOne().lean(),
      CustomPage.find({ isActive: true }).sort({ sort: 1, createdAt: 1 }).lean()
    ]);

    if (settings) {
      globalSettings = JSON.parse(JSON.stringify(settings));
    }

    const cats = JSON.parse(JSON.stringify(categories));
    const prods = JSON.parse(JSON.stringify(products));
    const allPages = JSON.parse(JSON.stringify(aboutPages));
    const secs = JSON.parse(JSON.stringify(sections));

    const productsItem = navData.find(item => item.title === "Our Products");
    if (productsItem && cats.length > 0) {
      productsItem.children = cats.map(cat => ({
        id: cat._id.toString(),
        title: cat.name,
        slug: `/${cat.slug}`,
        children: prods.filter(p => (p.category?._id?.toString() === cat._id.toString() || p.category?.toString() === cat._id.toString())).map(prod => ({
          id: prod._id.toString(),
          title: prod.name,
          slug: `/${cat.slug}/${prod.slug}`
        }))
      }));
    }

    const sectionMenus = secs.map(sec => {
      const sectionPages = allPages.filter(p => p.section === sec.slug || p.section?.toString() === sec._id.toString());
      return {
        id: sec._id.toString(),
        title: sec.name,
        slug: sectionPages.length > 0 ? `/${sec.slug}/${sectionPages[0].slug}` : `/${sec.slug}`,
        children: sectionPages.map(page => ({
          id: page._id ? page._id.toString() : page.slug,
          title: page.title,
          slug: `/${sec.slug}/${page.slug}`
        }))
      };
    });

    const customMenus = customPagesData.map(cp => ({
      id: cp._id.toString(),
      title: cp.title,
      slug: `/${cp.slug}`,
      children: []
    }));

    // Add Section menus before the Contact Us menu
    navData.splice(navData.length - 1, 0, ...sectionMenus);
    
    // Add Custom Pages at the very beginning of the menu
    navData.unshift(...customMenus);

    // Add Certifications into Quality menu
    // const qualityMenu = navData.find(item => item.title.toLowerCase() === "quality");
    // if (qualityMenu) {
    //   qualityMenu.children.push({
    //     id: 9,
    //     title: "Certifications",
    //     slug: "/certifications",
    //     children: []
    //   });
    // } else {
    //   // Fallback: put it before Contact Us
    //   navData.splice(navData.length - 1, 0, { id: 9, title: "Certifications", slug: "/certifications", children: [] });
    // }

    // Enforce requested specific menu order
    const desiredOrder = [
      "about us",
      "our products",
      "infrastructure",
      "quality",
      "corporate information",
      "human resource",
      "contact"
    ];

    navData.sort((a, b) => {
      const titleA = a.title.toLowerCase().trim();
      const titleB = b.title.toLowerCase().trim();
      
      const indexA = desiredOrder.indexOf(titleA);
      const indexB = desiredOrder.indexOf(titleB);
      
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    // Move Home menu to the start if it exists
    const homeIndex = navData.findIndex(item => item.title.toLowerCase() === "home");
    if (homeIndex !== -1) {
      const homeMenu = navData.splice(homeIndex, 1)[0];
      navData.unshift(homeMenu);
    }
  } catch (error) {
    console.error("Failed to fetch nav data:", error);
  }
  if (globalSettings?.emergencyShutdown || globalSettings?.isMaintenanceMode) {
    return (
      <>
        <MaintenanceScreen 
          isEmergency={globalSettings?.emergencyShutdown} 
          message={globalSettings?.maintenanceMessage} 
        />
      </>
    );
  }

  return (
    <SmoothScroller>
      <Header initialNavData={navData} initialGlobalSettings={globalSettings} />
      {children}
      <Footer />
      {/* Google Search Console verification is injected via generateMetadata() into <head> */}
      {globalSettings?.googleAnalyticsId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${globalSettings.googleAnalyticsId}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${globalSettings.googleAnalyticsId}');
            `}
          </Script>
        </>
      )}
      {globalSettings?.googleTagManagerId && (
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${globalSettings.googleTagManagerId}');
          `}
        </Script>
      )}
      {globalSettings?.customHeadCode && (
        <div
          id="custom-head-code"
          dangerouslySetInnerHTML={{ __html: globalSettings.customHeadCode }}
        />
      )}
      {globalSettings?.customBodyCode && (
        <div
          id="custom-body-code"
          dangerouslySetInnerHTML={{ __html: globalSettings.customBodyCode }}
        />
      )}
      <GlobalQuoteModal />
      <FloatingContactButtons 
        phoneNumber={globalSettings?.primaryPhone || "+919323582341"} 
        socialLinks={globalSettings?.socialLinks || []} 
      />
    </SmoothScroller>
  );
}
