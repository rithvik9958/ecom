import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/upload';

export async function POST(request) {
  try {
    const formData = await request.formData();
    let file = formData.get('upload') || formData.get('file') || formData.get('image');

    if (!file) {
      for (const value of formData.values()) {
        if (value && typeof value === 'object' && typeof value.name === 'string') {
          file = value;
          break;
        }
      }
    }

    if (!file) {
      return NextResponse.json({ success: false, error: { message: "No file provided" }, message: "No file provided" }, { status: 400 });
    }

    const url = await uploadFile(file, 'editor');

    return NextResponse.json({
      success: true,
      url: url
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({
      success: false,
      error: { message: error.message || "Upload failed" },
      message: error.message || "Upload failed"
    }, { status: 500 });
  }
}
