import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import User from "@/app/models/User";
import { requireSuperAdmin } from "@/app/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/user — List all admin and staff users (super_admin only)
export async function GET(request) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  await connectDB();
  // Filter out storefront customers — only show dashboard staff & admins
  const users = await User.find({ role: { $ne: "customer" } })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  // Convert permissions Map to plain object
  const serialized = users.map((u) => ({
    ...u,
    _id: u._id.toString(),
    permissions: u.permissions ? (u.permissions instanceof Map ? Object.fromEntries(u.permissions.entries()) : u.permissions) : {},
  }));

  return Response.json({ success: true, data: serialized });
}

// POST /api/user — Create new admin user (super_admin only)
export async function POST(request) {
  const { user: requester, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    await connectDB();
    const body = await request.json();
    const { name, email, password, role = 'admin', permissions = {} } = body;

    if (!name || !email || !password) {
      return Response.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return Response.json(
        { success: false, message: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role === 'super_admin' ? 'super_admin' : 'admin',
      permissions: new Map(Object.entries(permissions)),
      createdBy: requester.id,
    });

    
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json(
      {
        success: true,
        message: "Admin user created successfully",
        data: {
          _id:         newUser._id.toString(),
          name:        newUser.name,
          email:       newUser.email,
          role:        newUser.role,
          isActive:    newUser.isActive,
          permissions: permissions,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/user]", err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}