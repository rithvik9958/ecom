import mongoose from "mongoose";
import dns from "dns";

// The local router DNS might struggle with SRV in local dev. Force Google DNS only when not on Vercel/production.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  } catch (e) {}
}

if (!process.env.MONGO_URI) {
  throw new Error("Please define the MONGO_URI environment variable in .env");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
