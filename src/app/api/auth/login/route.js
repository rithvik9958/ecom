import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import User from "@/app/models/User";
import SecuritySettings from "@/app/models/SecuritySettings";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logActivity } from "@/lib/logger";

export async function POST(request) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('remote-addr') || 'Unknown';

    // 1. Enforce IP Blacklist from SecuritySettings
    try {
      const secSettings = await SecuritySettings.findOne().lean();
      if (secSettings?.blockedIps && Array.isArray(secSettings.blockedIps)) {
        if (secSettings.blockedIps.includes(ipAddress)) {
          return Response.json(
            { success: false, message: "Access denied from this IP address." },
            { status: 403 }
          );
        }
      }
    } catch (secErr) {
      // Continue if security settings check fails
    }

    const user = await User.findOne({ email });

    if (!user) {
      return Response.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    if (!user.isActive) {
      return Response.json({ success: false, message: "Account is disabled" }, { status: 401 });
    }

    // Check if account is locked
    if (user.isLocked && user.lockUntil && user.lockUntil > new Date()) {
      return Response.json(
        { success: false, message: `Account locked. Try again after ${Math.ceil((user.lockUntil - new Date()) / 60000)} minutes.` },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;
      let message = "Invalid credentials";

      let maxAttempts = 5;
      let lockoutMins = 15;
      try {
        const sec = await SecuritySettings.findOne().lean();
        if (sec?.maxLoginAttempts) maxAttempts = sec.maxLoginAttempts;
        if (sec?.lockoutDurationMinutes) lockoutMins = sec.lockoutDurationMinutes;
      } catch (e) {}
      
      if (user.failedLoginAttempts >= maxAttempts) {
        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + lockoutMins * 60 * 1000);
        message = `Account locked due to too many failed attempts. Try again in ${lockoutMins} minutes.`;
        await logActivity('Account Locked', 'Security', `User locked out after ${maxAttempts} failed attempts.`, user, ipAddress);
      } else {
        await logActivity('Failed Login', 'Security', `Failed login attempt (${user.failedLoginAttempts}/${maxAttempts}).`, user, ipAddress);
      }
      
      await user.save();
      return Response.json({ success: false, message }, { status: 401 });
    }

    // Reset failed attempts on success
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = null;
    await user.save();

    await logActivity('Successful Login', 'Security', 'User logged into dashboard.', user, ipAddress);

    // Build permissions object from the Map
    const permissionsObj = user.getPermissionsObject();

    // Sign JWT with role and permissions embedded for stateless auth
    const token = jwt.sign(
      {
        id:          user._id,
        email:       user.email,
        name:        user.name,
        role:        user.role,
        permissions: permissionsObj,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const response = Response.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id:          user._id,
        name:        user.name,
        email:       user.email,
        role:        user.role,
        permissions: permissionsObj,
      },
    });

    // Set httpOnly cookie for SSR-safe auth
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieFlags = `HttpOnly; Path=/; Max-Age=86400; SameSite=Lax${isProduction ? '; Secure' : ''}`;
    response.headers.set('Set-Cookie', `admin_token=${token}; ${cookieFlags}`);

    return response;
  } catch (error) {
    console.error("[auth/login] Error:", error);
    return Response.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
