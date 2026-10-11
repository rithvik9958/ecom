import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/config';
import { getEcomDeliveryMethod } from '@/app/models/EcomDeliveryMethod';

export async function GET() {
  try {
    await connectDB();
    const Method = await getEcomDeliveryMethod();
    const methods = await Method.find().sort({ createdAt: -1 });
    return NextResponse.json({ methods });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const Method = await getEcomDeliveryMethod();
    const newMethod = await Method.create(body);
    return NextResponse.json({ method: newMethod });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
