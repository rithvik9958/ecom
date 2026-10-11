import { NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import { logActivity } from '@/lib/logger';
import { connectDB } from '@/app/lib/config';
import GlobalSetting from '@/app/models/GlobalSetting';
import { revalidatePath } from 'next/cache';

export async function GET(request) {
  try {
    const user = await verifyToken(request);
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const settings = await GlobalSetting.findOne().lean();
    
    return NextResponse.json({
      success: true,
      maintenance: {
        isMaintenanceMode: settings?.isMaintenanceMode || false,
        maintenanceMessage: settings?.maintenanceMessage || '',
        emergencyShutdown: settings?.emergencyShutdown || false,
      }
    });
  } catch (error) {
    console.error('Fetch Maintenance Settings Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await verifyToken(request);
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { isMaintenanceMode, maintenanceMessage, emergencyShutdown } = await request.json();

    await connectDB();
    
    let settings = await GlobalSetting.findOne();
    if (!settings) {
      settings = new GlobalSetting();
    }

    const changes = [];
    if (settings.isMaintenanceMode !== isMaintenanceMode) changes.push(`Maintenance Mode: ${isMaintenanceMode ? 'ON' : 'OFF'}`);
    if (settings.emergencyShutdown !== emergencyShutdown) changes.push(`Emergency Shutdown: ${emergencyShutdown ? 'ON' : 'OFF'}`);
    
    settings.isMaintenanceMode = isMaintenanceMode;
    settings.maintenanceMessage = maintenanceMessage;
    settings.emergencyShutdown = emergencyShutdown;

    await settings.save();

    // Revalidate frontend layout so the new settings take effect immediately
    revalidatePath('/', 'layout');

    if (changes.length > 0) {
      await logActivity(
        user.id,
        'UPDATE',
        'System Settings',
        'Updated Maintenance State',
        { details: changes.join(', ') },
        request
      );
    }

    return NextResponse.json({ success: true, message: 'Maintenance settings updated successfully' });
  } catch (error) {
    console.error('Update Maintenance Settings Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}
