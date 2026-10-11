import mongoose from "mongoose";

// All dashboard modules with their allowed actions
export const MODULES = {
  home:            ['read', 'update'],
  inner_pages:     ['create', 'read', 'update', 'delete'],
  categories:      ['create', 'read', 'update', 'delete'],
  products:        ['create', 'read', 'update', 'delete'],
  blogs:           ['create', 'read', 'update', 'delete'],
  enquiries:       ['read', 'update', 'delete'],
  contact_cms:     ['read', 'update'],
  gallery:         ['create', 'read', 'update', 'delete'],
  team:            ['create', 'read', 'update', 'delete'],
  certifications:  ['create', 'read', 'update', 'delete'],
  global_settings: ['read', 'update'],
  users:           ['create', 'read', 'update', 'delete'],
};

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ['super_admin', 'admin'], default: 'admin' },
    isActive: { type: Boolean, default: true },
    avatar:   { type: String, default: null },
    // permissions: { blogs: ['create','read','update','delete'], products: ['read'], ... }
    permissions: {
      type: Map,
      of: [String],
      default: {},
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

// Helper: check if user has a specific permission
userSchema.methods.hasPermission = function (module, action) {
  if (this.role === 'super_admin') return true;
  const actions = this.permissions?.get(module) || [];
  return actions.includes(action);
};

// Serialize permissions Map → plain object for JWT
userSchema.methods.getPermissionsObject = function () {
  const obj = {};
  if (this.permissions) {
    for (const [key, value] of this.permissions.entries()) {
      obj[key] = value;
    }
  }
  return obj;
};

export default mongoose.models.User || mongoose.model("User", userSchema);
