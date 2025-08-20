import { getAdminClient } from '../lib/supabase';

/**
 * Lightweight sanity tests for open slots functionality
 * Tests various scenarios to ensure availability logic works correctly
 */

interface TestCase {
  name: string;
  barberId: string;
  serviceId: string;
  date: string;
  expectedBehavior: string;
}

/**
 * Test Case 1: 30-minute service should skip over lunch block
 */
async function testLunchBlockAvoidance() {
  console.log('\n🧪 Test 1: 30-minute service skips lunch block');
  
  const supabase = getAdminClient();
  
  // Get a 30-minute service
  const { data: service } = await supabase
    .from('services')
    .select('id, barber_id, duration_minutes, name')
    .eq('duration_minutes', 30)
    .eq('active', true)
    .single();
  
  if (!service) {
    console.log('❌ No 30-minute service found');
    return false;
  }
  
  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  
  // Fetch open slots
  const response = await fetch(`http://localhost:3000/api/availability/open-slots?barberId=${service.barber_id}&serviceId=${service.id}&date=${dateStr}`);
  const { slots } = await response.json();
  
  // Check if slots avoid lunch time (12:00-12:30)
  const lunchStart = new Date(`${dateStr}T12:00:00.000Z`);
  const lunchEnd = new Date(`${dateStr}T12:30:00.000Z`);
  
  const slotsInLunchTime = slots.filter((slot: string) => {
    const slotStart = new Date(slot);
    const slotEnd = new Date(slotStart.getTime() + service.duration_minutes * 60 * 1000);
    return slotStart < lunchEnd && slotEnd > lunchStart;
  });
  
  const passed = slotsInLunchTime.length === 0;
  console.log(`  Service: ${service.name} (${service.duration_minutes}min)`);
  console.log(`  Total slots: ${slots.length}`);
  console.log(`  Slots conflicting with lunch: ${slotsInLunchTime.length}`);
  console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'} - Lunch block properly avoided`);
  
  return passed;
}

/**
 * Test Case 2: 45-minute service near end of day should fit only with enough runway
 */
async function testEndOfDayFit() {
  console.log('\n🧪 Test 2: 45-minute service end-of-day fitting');
  
  const supabase = getAdminClient();
  
  // Get a 45-minute service
  const { data: service } = await supabase
    .from('services')
    .select('id, barber_id, duration_minutes, name')
    .eq('duration_minutes', 45)
    .eq('active', true)
    .single();
  
  if (!service) {
    console.log('❌ No 45-minute service found');
    return false;
  }
  
  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  
  // Fetch open slots
  const response = await fetch(`http://localhost:3000/api/availability/open-slots?barberId=${service.barber_id}&serviceId=${service.id}&date=${dateStr}`);
  const { slots } = await response.json();
  
  // Check latest possible slot (should be 5:15 PM or earlier for 45min service ending by 6 PM)
  const workEnd = new Date(`${dateStr}T18:00:00.000Z`); // 6 PM
  const latestStart = new Date(workEnd.getTime() - service.duration_minutes * 60 * 1000);
  
  const validSlots = slots.filter((slot: string) => {
    const slotStart = new Date(slot);
    return slotStart <= latestStart;
  });
  
  const invalidSlots = slots.filter((slot: string) => {
    const slotStart = new Date(slot);
    return slotStart > latestStart;
  });
  
  const passed = invalidSlots.length === 0;
  console.log(`  Service: ${service.name} (${service.duration_minutes}min)`);
  console.log(`  Total slots: ${slots.length}`);
  console.log(`  Latest valid start: ${latestStart.toLocaleTimeString()}`);
  console.log(`  Invalid late slots: ${invalidSlots.length}`);
  console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'} - No slots extend past work hours`);
  
  return passed;
}

/**
 * Test Case 3: Existing booking should reduce available slots
 */
async function testBookingConflict() {
  console.log('\n🧪 Test 3: Existing booking reduces available slots');
  
  const supabase = getAdminClient();
  
  // Get a service
  const { data: service } = await supabase
    .from('services')
    .select('id, barber_id, duration_minutes, name')
    .eq('active', true)
    .single();
  
  if (!service) {
    console.log('❌ No service found');
    return false;
  }
  
  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  
  // Fetch slots before adding booking
  const response1 = await fetch(`http://localhost:3000/api/availability/open-slots?barberId=${service.barber_id}&serviceId=${service.id}&date=${dateStr}`);
  const { slots: slotsBefore } = await response1.json();
  
  // Create a test booking at 2:00 PM
  const bookingStart = new Date(`${dateStr}T14:00:00.000Z`);
  const bookingEnd = new Date(bookingStart.getTime() + service.duration_minutes * 60 * 1000);
  
  const { data: booking } = await supabase
    .from('bookings')
    .insert({
      barber_id: service.barber_id,
      service_id: service.id,
      start_iso: bookingStart.toISOString(),
      end_iso: bookingEnd.toISOString(),
      client_name: 'Test Conflict Client',
      client_phone: '(555) 888-0000',
      status: 'confirmed' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  // Fetch slots after adding booking
  const response2 = await fetch(`http://localhost:3000/api/availability/open-slots?barberId=${service.barber_id}&serviceId=${service.id}&date=${dateStr}`);
  const { slots: slotsAfter } = await response2.json();
  
  // Clean up test booking
  if (booking) {
    await supabase
      .from('bookings')
      .delete()
      .eq('id', booking.id);
  }
  
  const slotReduction = slotsBefore.length - slotsAfter.length;
  const passed = slotReduction > 0;
  
  console.log(`  Service: ${service.name} (${service.duration_minutes}min)`);
  console.log(`  Slots before booking: ${slotsBefore.length}`);
  console.log(`  Slots after booking: ${slotsAfter.length}`);
  console.log(`  Slots reduced by: ${slotReduction}`);
  console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'} - Booking properly blocks slots`);
  
  return passed;
}

/**
 * Test Case 4: Multiple availability blocks should compound
 */
async function testMultipleBlocks() {
  console.log('\n🧪 Test 4: Multiple blocks compound correctly');
  
  const supabase = getAdminClient();
  
  // Get a service
  const { data: service } = await supabase
    .from('services')
    .select('id, barber_id, duration_minutes, name')
    .eq('active', true)
    .single();
  
  if (!service) {
    console.log('❌ No service found');
    return false;
  }
  
  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  
  // Count existing blocks for this barber on this date
  const { data: existingBlocks } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('barber_id', service.barber_id)
    .gte('start_utc', `${dateStr}T00:00:00.000Z`)
    .lt('start_utc', `${dateStr}T23:59:59.999Z`);
  
  // Fetch open slots
  const response = await fetch(`http://localhost:3000/api/availability/open-slots?barberId=${service.barber_id}&serviceId=${service.id}&date=${dateStr}`);
  const { slots } = await response.json();
  
  // Calculate total blocked time
  const totalBlockedMinutes = existingBlocks?.reduce((total, block) => {
    const start = new Date(block.start_utc);
    const end = new Date(block.end_utc);
    return total + (end.getTime() - start.getTime()) / (1000 * 60);
  }, 0) || 0;
  
  const workingMinutes = 9 * 60; // 9 hours (9 AM - 6 PM)
  const availableMinutes = workingMinutes - totalBlockedMinutes;
  const maxPossibleSlots = Math.floor(availableMinutes / 15); // 15-minute intervals
  
  const passed = slots.length <= maxPossibleSlots;
  
  console.log(`  Service: ${service.name}`);
  console.log(`  Existing blocks: ${existingBlocks?.length || 0}`);
  console.log(`  Total blocked minutes: ${totalBlockedMinutes}`);
  console.log(`  Available slots: ${slots.length}`);
  console.log(`  Max possible slots: ${maxPossibleSlots}`);
  console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'} - Slot count within expected range`);
  
  return passed;
}

/**
 * Run all sanity tests
 */
export async function runSanityTests() {
  console.log('🚀 Running Open Slots Sanity Tests\n');
  console.log('='.repeat(50));
  
  const results = [];
  
  try {
    results.push(await testLunchBlockAvoidance());
    results.push(await testEndOfDayFit());
    results.push(await testBookingConflict());
    results.push(await testMultipleBlocks());
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Open slots logic is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the availability logic.');
    }
    
    return passed === total;
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  runSanityTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}