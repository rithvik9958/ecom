import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., 'Admin edited blog', 'User changed password'
  module: { type: String, required: true }, // e.g., 'Blogs', 'Users', 'Settings', 'Files'
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String }, // Stored to avoid always joining
  details: { type: String }, // Any extra information, e.g. "Changed title from A to B"
  ipAddress: { type: String },
}, { timestamps: true });

export default mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);
