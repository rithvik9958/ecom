/**
 * Test Data Factory: Generates unique, isolated test records
 * All entity titles/names are prefixed with TEST_E2E_ for 100% safe cleanup.
 */

export function uniqueId() {
  return `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export function createProductData(overrides = {}) {
  const uid = uniqueId();
  return {
    title: `TEST_E2E_Product_${uid}`,
    price: '499',
    mrp: '699',
    stock: '50',
    description: `Automated test product description for ${uid}`,
    category: '', // Will be assigned or selected
    courierDays: '2-3',
    isActive: true,
    ...overrides,
  };
}

export function createCategoryData(overrides = {}) {
  const uid = uniqueId();
  return {
    title: `TEST_E2E_Category_${uid}`,
    description: `Automated category description for ${uid}`,
    isActive: true,
    ...overrides,
  };
}

export function createCustomPageData(overrides = {}) {
  const uid = uniqueId();
  return {
    title: `TEST_E2E_Page_${uid}`,
    slug: `test-e2e-page-${uid}`,
    content: `<p>This is automated test content for page ${uid}</p>`,
    metaDescription: `SEO description for ${uid}`,
    isActive: true,
    ...overrides,
  };
}

export function createBlogData(overrides = {}) {
  const uid = uniqueId();
  return {
    title: `TEST_E2E_Article_${uid}`,
    slug: `test-e2e-article-${uid}`,
    category: 'Floral Guides',
    excerpt: `Automated article excerpt ${uid}`,
    content: `<p>Automated article body content ${uid}</p>`,
    author: 'Test Bot',
    isPublished: true,
    ...overrides,
  };
}

export function createFaqData(overrides = {}) {
  const uid = uniqueId();
  return {
    question: `TEST_E2E_Question_${uid}?`,
    answer: `This is the automated test answer for question ${uid}.`,
    category: 'ordering',
    isActive: true,
    ...overrides,
  };
}

export function createTestimonialData(overrides = {}) {
  const uid = uniqueId();
  return {
    name: `TEST_E2E_Customer_${uid}`,
    role: 'Verified Buyer',
    rating: 5,
    comment: `Outstanding automated experience! Test ID: ${uid}`,
    location: 'Mumbai, India',
    isActive: true,
    ...overrides,
  };
}
