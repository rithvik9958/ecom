import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

async function checkModels() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");
    
    // Using a raw collection fetch to avoid needing the exact schema
    const settings = await mongoose.connection.collection('globalsettings').findOne({});
    const apiKey = settings?.geminiApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.log("No API key found in DB or ENV.");
      process.exit(1);
    }
    
    console.log("Found API Key starting with:", apiKey.substring(0, 10));
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
  }
}

checkModels();
