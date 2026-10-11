import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/config';
import { getEcomShippingRule } from '@/app/models/EcomShippingRule';
import { getEcomDeliveryZone } from '@/app/models/EcomDeliveryZone';
import { getEcomDeliveryMethod } from '@/app/models/EcomDeliveryMethod';

export async function GET() {
  try {
    await connectDB();
    const Rule = await getEcomShippingRule();
    await getEcomDeliveryZone(); // register
    await getEcomDeliveryMethod(); // register
    
    const rules = await Rule.find()
      .populate('zone', 'name')
      .populate('method', 'name type')
      .sort({ createdAt: -1 });
      
    return NextResponse.json({ rules });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const Rule = await getEcomShippingRule();
    const newRule = await Rule.create(body);
    
    // Populate for return
    await getEcomDeliveryZone();
    await getEcomDeliveryMethod();
    const populated = await Rule.findById(newRule._id)
      .populate('zone', 'name')
      .populate('method', 'name type');
      
    return NextResponse.json({ rule: populated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
