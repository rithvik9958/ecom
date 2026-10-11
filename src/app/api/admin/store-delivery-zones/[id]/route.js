import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/config';
import { getEcomDeliveryZone } from '@/app/models/EcomDeliveryZone';

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const Zone = await getEcomDeliveryZone();
    const updated = await Zone.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json({ zone: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const Zone = await getEcomDeliveryZone();
    await Zone.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
