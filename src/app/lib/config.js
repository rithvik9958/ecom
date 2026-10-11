import mongoose from "mongoose";
import dns from "dns";

// The local router DNS might struggle with SRV. Force Google DNS.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

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
