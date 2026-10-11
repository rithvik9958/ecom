import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/config';
import { getEcomDeliveryMethod } from '@/app/models/EcomDeliveryMethod';

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const Method = await getEcomDeliveryMethod();
    const updated = await Method.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json({ method: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const Method = await getEcomDeliveryMethod();
    await Method.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
