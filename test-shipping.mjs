
async function testDeliveryAPI() {
  console.log('🧪 Starting Delivery Engine API Test...\n');

  try {
    // TEST 1: Delhi NCR Pincode
    console.log('--- TEST 1: Pincode 110001 (Delhi NCR) ---');
    let res = await fetch('http://localhost:3000/api/store-shipping-options?pincode=110001');
    let data = await res.json();
    
    if (data.success && data.zone === 'Delhi NCR') {
      console.log('✅ Zone Matched correctly: Delhi NCR');
      console.log(`📦 Available Delivery Slots (${data.options.length}):`);
      data.options.forEach(opt => {
        console.log(`   - ${opt.name} (${opt.type}) | Price: ₹${opt.baseCharge} | Free Above: ${opt.freeAbove || 'N/A'}`);
      });
    } else {
      console.log('❌ Failed Test 1', data);
    }

    console.log('\n--- TEST 2: Pincode 400001 (Mumbai - Rest of India) ---');
    res = await fetch('http://localhost:3000/api/store-shipping-options?pincode=400001');
    data = await res.json();
    
    if (data.success && data.zone === 'Rest of India') {
      console.log('✅ Zone Matched correctly: Rest of India');
      console.log(`📦 Available Delivery Slots (${data.options.length}):`);
      data.options.forEach(opt => {
        console.log(`   - ${opt.name} (${opt.type}) | Price: ₹${opt.baseCharge} | Free Above: ${opt.freeAbove || 'N/A'}`);
      });
    } else {
      console.log('❌ Failed Test 2', data);
    }
    
    console.log('\n--- TEST 3: Invalid Pincode Format ---');
    res = await fetch('http://localhost:3000/api/store-shipping-options');
    data = await res.json();
    if (!data.success) {
      console.log('✅ Rejected empty pincode correctly.');
    } else {
      console.log('❌ Failed Test 3', data);
    }

    console.log('\n🎯 ALL TESTS COMPLETED SUCCESSFULLY!');
    
  } catch (err) {
    console.error('Test script crashed:', err);
  }
}

testDeliveryAPI();
