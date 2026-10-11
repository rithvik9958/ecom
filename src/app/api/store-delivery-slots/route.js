import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/config';
import DeliverySlot from '@/app/models/DeliverySlot';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const selectedDateStr = searchParams.get('date'); // e.g., '2026-08-18'

    if (!selectedDateStr) {
      return NextResponse.json({ success: false, message: 'Date is required' }, { status: 400 });
    }

    const selectedDate = new Date(selectedDateStr);
    const today = new Date();
    
    // Normalize to dates without time for accurate comparison
    const isToday = 
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();

    // Get current time in HH:MM format (24-hour)
    const currentHour = today.getHours().toString().padStart(2, '0');
    const currentMinute = today.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;

    const activeDeliveryTypes = await DeliverySlot.find({ isActive: true });

    // Filter slots based on cutoff time if it's today
    const availableDeliveryTypes = activeDeliveryTypes.map(typeDoc => {
      const type = typeDoc.toObject();
      
      type.slots = type.slots.filter(slot => {
        if (!slot.isActive) return false;
        
        // Automation Logic: If it's today, check the cutoff time
        if (isToday) {
          if (currentTimeStr > slot.cutoffTime) {
            return false; // Cutoff time has passed
          }
        }
        
        // TODO: In a fully scaled system, we would also check `maxCapacity` against the database here.
        // For now, if maxCapacity > 0, we could query the Order collection to count how many orders 
        // exist for this specific date and slot, and filter it out if >= maxCapacity.
        
        return true;
      });

      return type;
    }).filter(type => type.slots.length > 0); // Only return delivery types that actually have slots available

    return NextResponse.json({ success: true, deliveryTypes: availableDeliveryTypes });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
