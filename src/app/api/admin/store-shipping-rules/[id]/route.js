import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/config';
import { getEcomShippingRule } from '@/app/models/EcomShippingRule';
import { getEcomDeliveryZone } from '@/app/models/EcomDeliveryZone';
import { getEcomDeliveryMethod } from '@/app/models/EcomDeliveryMethod';

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const Rule = await getEcomShippingRule();
    const updated = await Rule.findByIdAndUpdate(id, body, { new: true });
    
    await getEcomDeliveryZone();
    await getEcomDeliveryMethod();
    const populated = await Rule.findById(updated._id)
      .populate('zone', 'name')
      .populate('method', 'name type');
      
    return NextResponse.json({ rule: populated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const Rule = await getEcomShippingRule();
    await Rule.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
