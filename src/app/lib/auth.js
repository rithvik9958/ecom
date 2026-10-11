import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verify and decode the JWT from Authorization header or httpOnly cookie.
 * Returns the decoded payload or null.
 */
export async function verifyToken(request) {
  try {
    let token = null;

    // 1. Try Authorization header (Bearer token)
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    // 2. Fall back to httpOnly cookie
    if (!token || token === "null" || token === "undefined") {
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Require a valid authenticated user.
 * Returns the decoded token payload or sends 401.
 */
export async function requireAuth(request) {
  const user = await verifyToken(request);
  if (!user) {
    return { error: Response.json({ success: false, message: "Unauthorized: Please log in." }, { status: 401 }) };
  }
  return { user };
}

/**
 * Require the user to be a super_admin.
 * Returns the decoded token payload or sends 403.
 */
export async function requireSuperAdmin(request) {
  const { user, error } = await requireAuth(request);
  if (error) return { error };
  if (user.role !== "super_admin") {
    return {
      error: Response.json({ success: false, message: "Forbidden: Super Admin access required." }, { status: 403 }),
    };
  }
  return { user };
}

/**
 * Require the user to have a specific module permission.
 * Super admins bypass all permission checks.
 * @param {Request} request
 * @param {string} module  - e.g. 'blogs'
 * @param {string} action  - e.g. 'create', 'read', 'update', 'delete'
 */
export async function requirePermission(request, module, action) {
  const { user, error } = await requireAuth(request);
  if (error) return { error };

  // Super admins have all permissions
  if (user.role === "super_admin") return { user };

  const permissions = user.permissions || {};
  const allowed = permissions[module] || [];

  if (!allowed.includes(action)) {
    return {
      error: Response.json(
        { success: false, message: `Forbidden: You do not have '${action}' permission on '${module}'.` },
        { status: 403 }
      ),
    };
  }

  return { user };
}
