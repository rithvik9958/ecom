import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { verifyToken } from "@/app/lib/auth";
import { connectDB } from "@/app/lib/config";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import { uploadFile, isUploadFile } from "@/lib/upload";

// GET /api/auth/profile — Return current user profile
export async function GET(request) {
  const decoded = await verifyToken(request);
  if (!decoded) {
    return Response.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(decoded.id).select("-password").lean();
  if (!user) {
    return Response.json({ success: false, message: "User not found" }, { status: 404 });
  }

  return Response.json({
    success: true,
    user: {
      id:     user._id.toString(),
      name:   user.name,
      email:  user.email,
      role:   user.role,
      avatar: user.avatar || null,
    },
  });
}

// PUT /api/auth/profile — Update name and/or avatar
export async function PUT(request) {
  const decoded = await verifyToken(request);
  if (!decoded) {
    return Response.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  try {
    await connectDB();
    const currentUser = await User.findById(decoded.id).lean();
    if (!currentUser) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const name     = formData.get("name");
    const email    = formData.get("email");
    const password = formData.get("password");
    const avatar   = formData.get("avatar"); // File object or null

    const updateData = {};
    if (name) updateData.name = name.trim();

    // Only super_admin can update email and password
    if (currentUser.role === 'super_admin') {
      if (email && email.trim() !== currentUser.email) {
        const existing = await User.findOne({ email: email.trim(), _id: { $ne: currentUser._id } }).lean();
        if (existing) {
          return Response.json({ success: false, message: "Email already in use" }, { status: 400 });
        }
        updateData.email = email.trim();
      }
      
      if (password && password.trim().length > 0) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password.trim(), salt);
      }
    }

    if (isUploadFile(avatar)) {
      updateData.avatar = await uploadFile(avatar, "avatars", "avatar");
    }

    const updated = await User.findByIdAndUpdate(
      decoded.id,
      { $set: updateData },
      { new: true, select: "-password" }
    ).lean();

    
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id:     updated._id.toString(),
        name:   updated.name,
        email:  updated.email,
        role:   updated.role,
        avatar: updated.avatar || null,
      },
    });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
