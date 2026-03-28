import { getAdminClient } from '../lib/supabase';
import { AvailabilityBlockRow } from '../types';

/**
 * Seed availability blocks for demo purposes
 * Creates lunch blocks and personal blocks for the next 7 days
 */
export async function seedAvailabilityBlocks() {
  console.log('🌱 Seeding availability blocks...');
  
  const supabase = getAdminClient();
  
  // Sample barber IDs (should match your existing barbers)
  const barberIds = ['barber-1', 'barber-2'];
  
  const blocks: Omit<AvailabilityBlockRow, 'id' | 'created_at'>[] = [];
  
  // Generate blocks for next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    
    // Skip weekends for this demo
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    
    for (const barberId of barberIds) {
      // Lunch block: 12:00-12:30 every weekday
      const lunchStart = new Date(date);
      lunchStart.setHours(12, 0, 0, 0);
      const lunchEnd = new Date(date);
      lunchEnd.setHours(12, 30, 0, 0);
      
      blocks.push({
        barber_id: barberId,
        start_utc: lunchStart.toISOString(),
        end_utc: lunchEnd.toISOString(),
        reason: 'Lunch'
      });
      
      // Personal block: Random 60-minute block in afternoon (2-5 PM)
      const personalHour = 14 + Math.floor(Math.random() * 3); // 2-4 PM start
      const personalMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45 minutes
      
      const personalStart = new Date(date);
      personalStart.setHours(personalHour, personalMinute, 0, 0);
      const personalEnd = new Date(personalStart);
      personalEnd.setHours(personalStart.getHours() + 1); // 60 minutes
      
      blocks.push({
        barber_id: barberId,
        start_utc: personalStart.toISOString(),
        end_utc: personalEnd.toISOString(),
        reason: 'Personal'
      });
    }
  }
  
  // Clear existing blocks for these barbers (optional - remove if you want to keep existing)
  console.log('🧹 Clearing existing blocks...');
  await supabase
    .from('availability_blocks')
    .delete()
    .in('barber_id', barberIds);
  
  // Insert new blocks
  console.log(`📅 Inserting ${blocks.length} availability blocks...`);
  const { data, error } = await supabase
    .from('availability_blocks')
    .insert(blocks)
    .select();
  
  if (error) {
    console.error('❌ Error seeding availability blocks:', error);
    throw error;
  }
  
  console.log(`✅ Successfully seeded ${data?.length || 0} availability blocks`);
  
  // Log sample blocks for verification
  console.log('\n📋 Sample blocks created:');
  data?.slice(0, 4).forEach(block => {
    const start = new Date(block.start_utc);
    const end = new Date(block.end_utc);
    console.log(`  ${block.barber_id}: ${start.toLocaleString()} - ${end.toLocaleString()} (${block.reason})`);
  });
  
  return data;
}

/**
 * Seed some sample bookings to test slot conflicts
 */
export async function seedSampleBookings() {
  console.log('\n🌱 Seeding sample bookings...');
  
  const supabase = getAdminClient();
  
  // Get a service for testing
  const { data: services } = await supabase
    .from('services')
    .select('id, barber_id, duration_minutes')
    .eq('active', true)
    .limit(2);
  
  if (!services || services.length === 0) {
    console.log('⚠️  No services found, skipping booking seeds');
    return;
  }
  
  const bookings = [];
  
  // Create a booking for tomorrow at 10:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  const service = services[0];
  const bookingEnd = new Date(tomorrow);
  bookingEnd.setMinutes(bookingEnd.getMinutes() + service.duration_minutes);
  
  bookings.push({
    barber_id: service.barber_id,
    service_id: service.id,
    start_iso: tomorrow.toISOString(),
    end_iso: bookingEnd.toISOString(),
    client_name: 'Test Client',
    client_phone: '(555) 999-0000',
    status: 'confirmed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  // Clear existing test bookings
  await supabase
    .from('bookings')
    .delete()
    .eq('client_name', 'Test Client');
  
  // Insert new bookings
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookings)
    .select();
  
  if (error) {
    console.error('❌ Error seeding bookings:', error);
    throw error;
  }
  
  console.log(`✅ Successfully seeded ${data?.length || 0} sample bookings`);
  
  return data;
}

/**
 * Main seed function
 */
export async function seedAll() {
  try {
    await seedAvailabilityBlocks();
    await seedSampleBookings();
    console.log('\n🎉 All availability seeds completed successfully!');
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedAll();
}