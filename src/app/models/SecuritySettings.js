import mongoose from "mongoose";

const securitySettingsSchema = new mongoose.Schema({
  blockedIps: [{ type: String }],
  maxLoginAttempts: { type: Number, default: 5 },
  lockoutDurationMinutes: { type: Number, default: 15 },
  rateLimitRequests: { type: Number, default: 100 }, // requests per window
  rateLimitWindowMs: { type: Number, default: 60000 }, // 1 minute
}, { timestamps: true });

export default mongoose.models.SecuritySettings || mongoose.model("SecuritySettings", securitySettingsSchema);
