import { revalidatePath } from "next/cache";
import { NextResponse } from 'next/server';
import { connectDB } from 'src/app/lib/config';
import ErrorLog from 'src/app/models/ErrorLog';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      ErrorLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ErrorLog.countDocuments()
    ]);
    return NextResponse.json({ success: true, data: logs, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { path, referrer, userAgent, ip, statusCode } = body;
    if (!path) return NextResponse.json({ success: false, error: 'path required' }, { status: 400 });
    // Avoid duplicate recent logs for the same path (within 1 minute)
    const recent = await ErrorLog.findOne({ path, createdAt: { $gte: new Date(Date.now() - 60_000) } });
    if (recent) return NextResponse.json({ success: true, duplicate: true });
    const log = await ErrorLog.create({ path, referrer: referrer || '', userAgent: userAgent || '', ip: ip || '', statusCode: statusCode || 404 });
    
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, data: log });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const { id, resolved } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    const updated = await ErrorLog.findByIdAndUpdate(id, { resolved }, { new: true });
    
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    if (body?.id) {
      await ErrorLog.findByIdAndDelete(body.id);
    } else {
      await ErrorLog.deleteMany({});
    }
    
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
