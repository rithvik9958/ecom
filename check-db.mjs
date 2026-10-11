import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

async function check() {
  const envFile = fs.readFileSync('.env', 'utf-8');
  let uri = '';
  envFile.split('\n').forEach(line => {
    line = line.trim();
    if (line.startsWith('MONGO_URI=')) {
      uri = line.substring(line.indexOf('=') + 1).trim().replace(/^"|"$/g, '');
    }
  });

  if (!uri) {
    console.error('No MONGO_URI found');
    return;
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  const products = await db.collection('ecomproducts').find({
    title: { $in: ["Air Purifying Snake Plant", "Bouquet of 12 Red Roses"] }
  }).toArray();

  console.log("Found products:");
  products.forEach(p => {
    console.log(`Title: ${p.title} | ID: ${p.id} | isActive: ${p.isActive} | stock: ${p.stock} | status: ${p.availabilityStatus}`);
  });
  
  await client.close();
}

check().catch(console.error);
