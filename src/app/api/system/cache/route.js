import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { verifyToken } from '@/app/lib/auth';
import { logActivity } from '@/lib/logger';

export async function POST(request) {
  try {
    const user = await verifyToken(request);
    
    // Check if user is authenticated and is an admin
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
    }

    const body = await request.json();
    const { type, target } = body;

    if (!type) {
      return NextResponse.json({ success: false, error: 'Cache purge type is required' }, { status: 400 });
    }

    let actionDetails = '';

    switch (type) {
      case 'path':
        if (!target) return NextResponse.json({ success: false, error: 'Path is required' }, { status: 400 });
        revalidatePath(target);
        actionDetails = `Revalidated specific path: ${target}`;
        break;

      case 'tag':
        if (!target) return NextResponse.json({ success: false, error: 'Tag is required' }, { status: 400 });
        revalidateTag(target);
        actionDetails = `Revalidated specific cache tag: ${target}`;
        break;

      case 'all':
        // Next.js 'layout' type purges the entire tree downwards from the root
        revalidatePath('/', 'layout');
        actionDetails = 'Purged entire Next.js application cache globally';
        break;
        
      case 'redis':
      case 'cdn':
        return NextResponse.json({ success: false, error: 'Service not configured. Please configure Redis/CDN in your environment.' }, { status: 501 });

      default:
        return NextResponse.json({ success: false, error: 'Invalid cache purge type' }, { status: 400 });
    }

    // Log the action
    await logActivity(
      user.id,
      'UPDATE',
      'System Settings',
      'Cache Purged',
      { details: actionDetails },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Cache successfully purged',
      details: actionDetails
    });

  } catch (error) {
    console.error('Cache Revalidation Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to purge cache' }, { status: 500 });
  }
}
