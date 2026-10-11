import { revalidatePath } from "next/cache";
import { NextResponse } from 'next/server';
import { connectDB } from 'src/app/lib/config';
import Redirect from 'src/app/models/Redirect';

export async function GET() {
  try {
    await connectDB();
    const redirects = await Redirect.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: redirects });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { from, to, type } = body;
    if (!from || !to) return NextResponse.json({ success: false, error: 'from and to are required' }, { status: 400 });
    const redirect = await Redirect.create({ from, to, type: type || 301, isActive: true });
    
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, data: redirect });
  } catch (e) {
    if (e.code === 11000) return NextResponse.json({ success: false, error: 'A redirect from this path already exists.' }, { status: 409 });
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const { id, from, to, type, isActive } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    const updated = await Redirect.findByIdAndUpdate(id, { from, to, type, isActive }, { new: true });
    
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
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    await Redirect.findByIdAndDelete(id);
    
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
