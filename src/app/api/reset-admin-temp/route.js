/**
 * TEMPORARY one-time admin password reset endpoint.
 * Visit: http://localhost:3000/api/reset-admin-temp
 * DELETE THIS FILE after use!
 */
export const dynamic = 'force-dynamic';
import { connectDB } from '@/app/lib/config';
import User from '@/app/models/User';
import bcrypt from 'bcryptjs';

const NEW_PASSWORD = 'Admin@1234';

export async function GET() {
  try {
    await connectDB();

    const users = await User.find({}).select('email role isActive').lean();

    if (!users.length) {
      return Response.json({ error: 'No users found in database' }, { status: 404 });
    }

    const admin = users.find(u => u.role === 'super_admin') || users[0];

    const hashed = await bcrypt.hash(NEW_PASSWORD, 12);

    await User.updateOne(
      { _id: admin._id },
      {
        $set: {
          password: hashed,
          failedLoginAttempts: 0,
          isLocked: false,
          lockUntil: null,
          isActive: true,
        },
      }
    );

    return Response.json({
      success: true,
      message: '✅ Password reset successfully!',
      credentials: {
        email: admin.email,
        password: NEW_PASSWORD,
        role: admin.role,
        loginUrl: 'http://localhost:3000/login',
      },
      warning: '⚠️ DELETE the file src/app/api/reset-admin-temp/route.js after logging in!',
      allUsers: users.map(u => ({ email: u.email, role: u.role })),
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
