import { MongoClient } from 'mongodb';
import fs from 'fs';

async function check() {
  const envFile = fs.readFileSync('.env', 'utf-8');
  let uri = '';
  envFile.split('\n').forEach(line => {
    line = line.trim();
    if (line.startsWith('MONGO_URI=')) {
      uri = line.substring(line.indexOf('=') + 1).trim().replace(/^"|"$/g, '');
    }
  });

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  const cartItem = await db.collection('ecomcartitems').findOne({});
  console.log("Sample Cart Item:", cartItem);
  
  await client.close();
}

check().catch(console.error);
