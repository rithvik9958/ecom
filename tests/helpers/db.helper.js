import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Force Google DNS so MongoDB Atlas SRV lookups work reliably on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

let isConnected = false;

export async function connectTestDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing in .env');
  }
  await mongoose.connect(uri, { bufferCommands: false });
  isConnected = true;
  return mongoose.connection;
}

export async function closeTestDB() {
  // Keep connection open during test run; closed at global teardown if needed
}

export async function getDbCollection(name) {
  await connectTestDB();
  return mongoose.connection.collection(name);
}

// Entity query helpers
export async function findProduct(filter) {
  const col = await getDbCollection('ecomproducts');
  return col.findOne(filter);
}

export async function findCategory(filter) {
  const col = await getDbCollection('ecomcategories');
  return col.findOne(filter);
}

export async function findCustomPage(filter) {
  const col = await getDbCollection('custompages');
  return col.findOne(filter);
}

export async function findBlog(filter) {
  const col = await getDbCollection('blogs');
  return col.findOne(filter);
}

export async function findFaq(filter) {
  const col = await getDbCollection('ecomfaqs');
  return col.findOne(filter);
}

export async function findTestimonial(filter) {
  const col = await getDbCollection('testimonials');
  return col.findOne(filter);
}

export async function findOrder(filter) {
  const col = await getDbCollection('ecomorders');
  return col.findOne(filter);
}

/**
 * Safe cleanup of all entities prefixed with TEST_E2E_
 */
export async function cleanupTestRecords() {
  await connectTestDB();
  const pattern = /^TEST_E2E_/;

  const collections = [
    { name: 'ecomproducts', field: 'title' },
    { name: 'ecomcategories', field: 'title' },
    { name: 'custompages', field: 'title' },
    { name: 'blogs', field: 'title' },
    { name: 'ecomfaqs', field: 'question' },
    { name: 'testimonials', field: 'name' },
  ];

  for (const { name, field } of collections) {
    try {
      const col = mongoose.connection.collection(name);
      await col.deleteMany({ [field]: { $regex: pattern } });
    } catch (err) {
      console.warn(`[Cleanup Warning] Failed to clean ${name}:`, err.message);
    }
  }
}
