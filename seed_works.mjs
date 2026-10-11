import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const WorkSchema = new mongoose.Schema(
  {
    logo: { type: String, required: true },
    title: { type: String, required: true },
    status: { type: String, default: "active" },
    category: { type: String, default: "Industry" },
    sort: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Work = mongoose.models.Work || mongoose.model("Work", WorkSchema);

const industries = [
  "AUTOMOTIVE", "DEFENSE & AEROSPACE", "MEDICAL & SURGICAL EQUIPMENTS", 
  "ELECTRICALS & ELECTRONICS", "KITCHENWARE & FOOD PROCESSING", "IOT", 
  "SOLAR & RENEWABLE ENERGY", "ENERGY STORAGE & EV"
];

const applications = [
  "Engine Gaskets/Spiral Wound Gaskets", "Heat Shields", "Felxi hoses/Metallic Bellows",
  "Sensor Diaphgrams", "Honeycombs", "EMI/RF Shielding", "Industria Heat Exchangers",
  "Thermal Insulations", "Hose Clamps", "Hypodermic Needles"
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Clear old works to avoid duplicates
    await Work.deleteMany({});
    
    const works = [];
    
    industries.forEach((title, i) => {
      works.push({
        title,
        logo: '/images/eng.png',
        status: 'active',
        category: 'Industry',
        sort: i
      });
    });

    applications.forEach((title, i) => {
      works.push({
        title,
        logo: '/images/eng.png',
        status: 'active',
        category: 'Application',
        sort: i
      });
    });

    await Work.insertMany(works);
    console.log("Successfully seeded Works!");
  } catch (error) {
    console.error("Error seeding works:", error);
  } finally {
    mongoose.disconnect();
  }
}

seed();
