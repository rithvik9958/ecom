import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/config';
import DeliverySlot from '@/app/models/DeliverySlot';

export async function GET(req) {
  try {
    await connectDB();
    const deliverySlots = await DeliverySlot.find({}).sort({ createdAt: 1 });
    return NextResponse.json({ success: true, deliverySlots });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const newSlot = await DeliverySlot.create(body);
    return NextResponse.json({ success: true, deliverySlot: newSlot });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Delivery type already exists.' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;
    const updatedSlot = await DeliverySlot.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, deliverySlot: updatedSlot });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await DeliverySlot.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Delivery slot deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
