export const dynamic = 'force-dynamic';
import { connectDB } from '@/app/lib/config';
import { getEcomDeliveryZone } from '@/app/models/EcomDeliveryZone';
import { getEcomDeliveryMethod } from '@/app/models/EcomDeliveryMethod';
import { getEcomShippingRule } from '@/app/models/EcomShippingRule';

export async function POST(request) {
  try {
    await connectDB();
    
    const DeliveryZone = await getEcomDeliveryZone();
    const DeliveryMethod = await getEcomDeliveryMethod();
    const ShippingRule = await getEcomShippingRule();

    // 1. Clear existing data
    await DeliveryZone.deleteMany({});
    await DeliveryMethod.deleteMany({});
    await ShippingRule.deleteMany({});

    // 2. Create Zones
    const delhiNcrPincodes = [
      '110001', '110002', '110003', '110004', '110005', '110006',
      '110094', '201301', '122001'
    ];
    
    const zoneNcr = await DeliveryZone.create({
      name: 'Delhi NCR',
      pincodes: delhiNcrPincodes,
      isActive: true
    });

    const zoneRoi = await DeliveryZone.create({
      name: 'Rest of India',
      pincodes: [], // Empty means default/fallback zone
      isActive: true
    });

    // 3. Create Delivery Methods
    const methodStandard = await DeliveryMethod.create({
      name: 'Standard Delivery',
      type: 'STANDARD',
      baseCharge: 0,
      isActive: true
    });

    const methodMidnight = await DeliveryMethod.create({
      name: 'Midnight Delivery',
      type: 'MIDNIGHT',
      baseCharge: 249,
      startTime: '23:30',
      endTime: '23:59',
      isActive: true
    });

    const methodSameDay = await DeliveryMethod.create({
      name: 'Same Day Delivery',
      type: 'SAME_DAY',
      baseCharge: 99,
      cutoffTime: '17:00', // 5 PM
      isActive: true
    });

    const methodFixedTime = await DeliveryMethod.create({
      name: 'Fixed Time Delivery',
      type: 'FIXED_TIME',
      baseCharge: 149,
      isActive: true
    });

    // 4. Create Shipping Rules (The Matrix)
    const rulesToCreate = [
      // Standard
      { zone: zoneNcr._id, method: methodStandard._id, charge: 0, freeAbove: null, isActive: true },
      { zone: zoneRoi._id, method: methodStandard._id, charge: 49, freeAbove: 999, isActive: true },
      
      // Midnight (Only available in NCR for this example)
      { zone: zoneNcr._id, method: methodMidnight._id, charge: 249, freeAbove: null, isActive: true },
      // Note: No rule for ROI = Not available in ROI
      
      // Same Day (Cheaper in NCR)
      { zone: zoneNcr._id, method: methodSameDay._id, charge: 99, freeAbove: 2000, isActive: true },
      { zone: zoneRoi._id, method: methodSameDay._id, charge: 199, freeAbove: null, isActive: true },

      // Fixed Time
      { zone: zoneNcr._id, method: methodFixedTime._id, charge: 149, freeAbove: null, isActive: true },
      { zone: zoneRoi._id, method: methodFixedTime._id, charge: 249, freeAbove: null, isActive: true },
    ];

    await ShippingRule.insertMany(rulesToCreate);

    return Response.json({ success: true, message: 'Seed data successfully generated!' });
  } catch (error) {
    console.error('Seed Error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
