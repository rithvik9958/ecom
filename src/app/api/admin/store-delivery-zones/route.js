import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/config';
import { getEcomDeliveryZone } from '@/app/models/EcomDeliveryZone';

export async function GET() {
  try {
    await connectDB();
    const Zone = await getEcomDeliveryZone();
    const zones = await Zone.find().sort({ createdAt: -1 });
    return NextResponse.json({ zones });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const Zone = await getEcomDeliveryZone();
    const newZone = await Zone.create(body);
    return NextResponse.json({ zone: newZone });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
