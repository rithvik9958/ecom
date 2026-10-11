import 'dotenv/config';
import mongoose from 'mongoose';
import { getEcomCategory } from './src/app/models/EcomCategory.js';

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

const dummyMegaMenu = {
  columns: [
    {
      title: "Must Haves",
      links: [
        { label: "Cakes", url: "/category/cakes" },
        { label: "Flowers", url: "/category/flowers" },
        { label: "Chocolates", url: "/category/chocolates" }
      ]
    },
    {
      title: "Prime Picks",
      links: [
        { label: "Bestsellers", url: "/products?tag=bestsellers" },
        { label: "New Arrivals", url: "/products?tag=new", badge: "New" }
      ]
    },
    {
      title: "Gifts For",
      links: [
        { label: "Her", url: "/category/gifts-for-her" },
        { label: "Him", url: "/category/gifts-for-him" }
      ]
    }
  ],
  promo: {
    image: "https://images.unsplash.com/photo-1591886960571-74d43a9d4166?auto=format&fit=crop&q=80&w=300",
    url: "/products",
    buttonText: "Shop Now"
  }
};

async function seedMegaMenu() {
  if (!uri) throw new Error("No MONGO_URI in .env");
  await mongoose.connect(uri);
  const Category = await getEcomCategory();
  
  const cats = await Category.find();
  for (let c of cats) {
    c.megaMenu = dummyMegaMenu;
    await c.save();
    console.log(`Updated mega menu for ${c.title}`);
  }
  
  console.log("Mega Menu seeding complete!");
  process.exit(0);
}

seedMegaMenu().catch(console.error);
