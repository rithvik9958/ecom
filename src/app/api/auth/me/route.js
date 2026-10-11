export const dynamic = 'force-dynamic';
import { verifyToken } from "@/app/lib/auth";
import { connectDB } from "@/app/lib/config";
import User from "@/app/models/User";

// GET /api/auth/me — Validate token and return current user info (with fresh DB data)
export async function GET(request) {
  const decoded = await verifyToken(request);
  if (!decoded) {
    return Response.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  try {
    await connectDB();
    const dbUser = await User.findById(decoded.id).select("-password").lean();
    if (!dbUser) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      user: {
        id:          dbUser._id.toString(),
        name:        dbUser.name,
        email:       dbUser.email,
        role:        dbUser.role,
        avatar:      dbUser.avatar || null,
        permissions: dbUser.permissions ? Object.fromEntries(Object.entries(dbUser.permissions)) : {},
      },
    });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
