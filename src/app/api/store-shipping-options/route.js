export const dynamic = 'force-dynamic';
import { connectDB } from '@/app/lib/config';
import { getEcomDeliveryZone } from '@/app/models/EcomDeliveryZone';
import { getEcomDeliveryMethod } from '@/app/models/EcomDeliveryMethod';
import { getEcomShippingRule } from '@/app/models/EcomShippingRule';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode');

    await connectDB();
    const DeliveryZone = await getEcomDeliveryZone();
    const DeliveryMethod = await getEcomDeliveryMethod(); // register model
    const ShippingRule = await getEcomShippingRule();

    let zone;
    if (pincode) {
      zone = await DeliveryZone.findOne({ pincodes: pincode, isActive: true });
    }

    if (!zone) {
      // Fallback to "Rest of India" (the zone with empty pincodes array or name 'Rest of India')
      zone = await DeliveryZone.findOne({ name: 'Rest of India', isActive: true });
    }

    if (!zone) {
      return Response.json({ success: false, message: 'No delivery zones configured.' }, { status: 404 });
    }

    // Find all shipping rules for this zone, populate the method
    const rules = await ShippingRule.find({ zone: zone._id, isActive: true })
      .populate({ path: 'method', model: 'EcomDeliveryMethod', match: { isActive: true } });

    // Filter out rules where method is inactive or missing
    const validRules = rules.filter(r => r.method != null);

    // Map to a cleaner structure for the frontend
    const options = validRules.map(rule => ({
      ruleId: rule._id,
      methodId: rule.method._id,
      name: rule.method.name,
      type: rule.method.type,
      baseCharge: rule.charge, // The overridden charge from the matrix
      freeAbove: rule.freeAbove,
      cutoffTime: rule.method.cutoffTime,
      startTime: rule.method.startTime,
      endTime: rule.method.endTime
    }));

    return Response.json({ 
      success: true, 
      zone: zone.name,
      options 
    });

  } catch (error) {
    console.error('Shipping Options Error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
