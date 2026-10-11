import { uploadFile } from '@/lib/upload';
import { requirePermission } from '@/app/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { error } = await requirePermission(request, 'settings');
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const url = await uploadFile(file, 'badges', 'badge');
    return NextResponse.json({ success: true, url });
  } catch (e) {
    console.error('Store media upload error:', e);
    return NextResponse.json({ success: false, message: e.message || 'Upload failed' }, { status: 500 });
  }
}
