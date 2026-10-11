import Link from "next/link";

// BreadcrumbList JSON-LD schema for rich search result breadcrumbs
function BreadcrumbSchema({ breadcrumb }) {
  const items = breadcrumb.filter((item) => item.href);
  if (items.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.href.startsWith("http")
        ? item.href
        : `https://www.jindalmetals.com${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function PageHeader({
  title,
  bgImage,
  breadcrumb = [],
}) {
  return (
    <>
      {/* BreadcrumbList structured data for Google sitelinks */}
      <BreadcrumbSchema breadcrumb={breadcrumb} />

      <section
        className="page-header"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
      >
        <div className="container">
          <div className="page-header-content">
            {/* The banner title is the document's primary heading (H1). */}
            <h1 dangerouslySetInnerHTML={{ __html: title }}></h1>

            <ul className="breadcrumb-list">
              {breadcrumb.map((item, index) => (
                <li key={index} className="text-white/80">
                  {item.href ? (
                    <Link href={item.href} className="text-white/80 hover:text-white transition-colors">{item.name}</Link>
                  ) : (
                    <span className="text-white font-medium">{item.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}