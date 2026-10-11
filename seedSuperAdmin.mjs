import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Inline minimal User schema to avoid import complexity
const userSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ["super_admin", "admin"], default: "admin" },
  isActive:    { type: Boolean, default: true },
  permissions: { type: Map, of: [String], default: {} },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

userSchema.methods.getPermissionsObject = function () {
  const obj = {};
  if (this.permissions) {
    for (const [key, value] of this.permissions.entries()) obj[key] = value;
  }
  return obj;
};

const User = mongoose.models?.User || mongoose.model("User", userSchema);

const SUPER_ADMIN = {
  name:     process.env.SUPER_ADMIN_NAME     || "Super Admin",
  email:    process.env.SUPER_ADMIN_EMAIL    || "superadmin@jindalmetal.com",
  password: process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@123",
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const existing = await User.findOne({ role: "super_admin" });
    if (existing) {
      console.log(`ℹ️  Super Admin already exists: ${existing.email}`);
      console.log("   To reset, manually delete this user from the database.");
    } else {
      const hashed = await bcrypt.hash(SUPER_ADMIN.password, 12);
      await User.create({
        name:        SUPER_ADMIN.name,
        email:       SUPER_ADMIN.email,
        password:    hashed,
        role:        "super_admin",
        isActive:    true,
        permissions: new Map(),
      });
      console.log("🎉 Super Admin created successfully!");
      console.log(`   Email:    ${SUPER_ADMIN.email}`);
      console.log(`   Password: ${SUPER_ADMIN.password}`);
      console.log("\n⚠️  IMPORTANT: Change the password after first login!");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seed();
