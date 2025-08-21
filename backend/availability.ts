import { Hono } from 'hono';
import { getAdminClient } from './lib/supabase';
import { mapAvailabilityBlockRowToAvailabilityBlock, mapAvailabilityBlockToAvailabilityBlockRow } from './adapters';
import { AvailabilityBlockRow } from './types';

/**
 * POST /api/availability/list
 * Get availability blocks for a barber within a date range
 */
export async function listAvailabilityBlocks(request: Request): Promise<Response> {
  try {
    const { barberId, startISO, endISO } = await request.json();
    
    if (!barberId || !startISO || !endISO) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: barberId, startISO, endISO' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getAdminClient();
    
    if (!supabase) {
      return new Response(
        JSON.stringify({ error: 'Database connection not available' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { data: blocks, error } = await supabase
      .from('availability_blocks')
      .select('*')
      .eq('barber_id', barberId)
      .gte('start_utc', startISO)
      .lte('end_utc', endISO)
      .order('start_utc');

    if (error) {
      console.error('Error fetching availability blocks:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch availability blocks' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const mappedBlocks = blocks.map(mapAvailabilityBlockRowToAvailabilityBlock);
    
    return new Response(
      JSON.stringify({ blocks: mappedBlocks }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in listAvailabilityBlocks:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/availability/block
 * Create a new availability block for a barber
 */
export async function blockAvailability(request: Request): Promise<Response> {
  try {
    const { barberId, startISO, endISO, reason } = await request.json();
    
    if (!barberId || !startISO || !endISO) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: barberId, startISO, endISO' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate time range
    const start = new Date(startISO);
    const end = new Date(endISO);
    
    if (start >= end) {
      return new Response(
        JSON.stringify({ error: 'Start time must be before end time' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check max 24 hours
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diffHours > 24) {
      return new Response(
        JSON.stringify({ error: 'Block duration cannot exceed 24 hours' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getAdminClient();
    
    if (!supabase) {
      return new Response(
        JSON.stringify({ error: 'Database connection not available' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for overlapping bookings (exclude cancelled/refunded)
    const { data: bookingOverlaps, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('barber_id', barberId)
      .not('status', 'in', '("cancelled","refunded")')
      .lt('start_iso', endISO)
      .gt('end_iso', startISO);

    if (bookingError) {
      console.error('Error checking booking overlaps:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate booking conflicts' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (bookingOverlaps && bookingOverlaps.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Overlaps with an existing booking' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for overlapping blocks
    const { data: overlapping, error: overlapError } = await supabase
      .from('availability_blocks')
      .select('id')
      .eq('barber_id', barberId)
      .or(`and(start_utc.lt.${endISO},end_utc.gt.${startISO})`);

    if (overlapError) {
      console.error('Error checking overlapping blocks:', overlapError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate block timing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (overlapping && overlapping.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Overlaps with another blocked time' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert new block
    const blockData = mapAvailabilityBlockToAvailabilityBlockRow({
      barberId,
      startISO,
      endISO,
      reason
    });

    const { data: newBlock, error: insertError } = await supabase
      .from('availability_blocks')
      .insert([blockData])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating availability block:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create availability block' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const mappedBlock = mapAvailabilityBlockRowToAvailabilityBlock(newBlock as AvailabilityBlockRow);
    
    return new Response(
      JSON.stringify({ block: mappedBlock }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in blockAvailability:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/availability/unblock
 * Delete an availability block
 */
export async function unblockAvailability(request: Request): Promise<Response> {
  try {
    const { barberId, blockId } = await request.json();
    
    if (!barberId || !blockId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: barberId, blockId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getAdminClient();
    
    if (!supabase) {
      return new Response(
        JSON.stringify({ error: 'Database connection not available' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify the block belongs to the barber and delete it
    const { error } = await supabase
      .from('availability_blocks')
      .delete()
      .eq('id', blockId)
      .eq('barber_id', barberId);

    if (error) {
      console.error('Error deleting availability block:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to delete availability block' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in unblockAvailability:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /api/availability/block/:id
 * Delete an availability block by ID with barberId query param
 */
export async function deleteAvailabilityBlock(request: Request, blockId: string): Promise<Response> {
  try {
    const url = new URL(request.url);
    const barberId = url.searchParams.get('barberId');
    
    if (!barberId || !blockId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: barberId, blockId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getAdminClient();
    
    if (!supabase) {
      return new Response(
        JSON.stringify({ error: 'Database connection not available' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify the block exists and belongs to the barber
    const { data: block, error: fetchError } = await supabase
      .from('availability_blocks')
      .select('barber_id')
      .eq('id', blockId)
      .single();

    if (fetchError || !block) {
      return new Response(
        JSON.stringify({ error: 'Block not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (block.barber_id !== barberId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Delete the block
    const { error } = await supabase
      .from('availability_blocks')
      .delete()
      .eq('id', blockId);

    if (error) {
      console.error('Error deleting availability block:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to delete availability block' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in deleteAvailabilityBlock:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/availability/open-slots
 * Generate available time slots for a barber and service on a specific date
 */
export async function getOpenSlots(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const barberId = url.searchParams.get('barberId');
    const serviceId = url.searchParams.get('serviceId');
    const date = url.searchParams.get('date'); // YYYY-MM-DD
    const tz = url.searchParams.get('tz') || 'America/Los_Angeles';
    console.log('Timezone for slot generation:', tz);
    const step = parseInt(url.searchParams.get('step') || '15');
    
    if (!barberId || !serviceId || !date) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: barberId, serviceId, date' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getAdminClient();
    
    if (!supabase) {
      return new Response(
        JSON.stringify({ error: 'Database connection not available' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get service duration
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .eq('barber_id', barberId)
      .eq('active', true)
      .single();

    if (serviceError || !service) {
      return new Response(
        JSON.stringify({ error: 'Service not found or inactive' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const durationMinutes = service.duration_minutes;
    
    // Define working hours (9 AM to 6 PM in the specified timezone)
    const workStart = 9; // 9 AM
    const workEnd = 18; // 6 PM
    
    // Create date range for the day in UTC
    const startOfDay = new Date(`${date}T${workStart.toString().padStart(2, '0')}:00:00`);
    const endOfDay = new Date(`${date}T${workEnd.toString().padStart(2, '0')}:00:00`);
    
    // Convert to UTC ISO strings
    const dayStartISO = startOfDay.toISOString();
    const dayEndISO = endOfDay.toISOString();
    
    // Get existing bookings for the day
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('start_iso, end_iso')
      .eq('barber_id', barberId)
      .gte('start_iso', dayStartISO)
      .lt('start_iso', dayEndISO)
      .in('status', ['pending', 'confirmed']);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch existing bookings' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get availability blocks for the day
    const { data: blocks, error: blocksError } = await supabase
      .from('availability_blocks')
      .select('start_utc, end_utc')
      .eq('barber_id', barberId)
      .gte('start_utc', dayStartISO)
      .lt('start_utc', dayEndISO);

    if (blocksError) {
      console.error('Error fetching availability blocks:', blocksError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch availability blocks' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate time slots
    const slots: string[] = [];
    const currentTime = new Date(dayStartISO);
    const endTime = new Date(dayEndISO);
    
    while (currentTime < endTime) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);
      
      // Check if slot end is within working hours
      if (slotEnd > endTime) {
        break;
      }
      
      // Check if slot conflicts with existing bookings
      const hasBookingConflict = bookings?.some(booking => {
        const bookingStart = new Date(booking.start_iso);
        const bookingEnd = new Date(booking.end_iso);
        return slotStart < bookingEnd && slotEnd > bookingStart;
      });
      
      // Check if slot conflicts with availability blocks
      const hasBlockConflict = blocks?.some(block => {
        const blockStart = new Date(block.start_utc);
        const blockEnd = new Date(block.end_utc);
        return slotStart < blockEnd && slotEnd > blockStart;
      });
      
      // If no conflicts, add the slot
      if (!hasBookingConflict && !hasBlockConflict) {
        slots.push(slotStart.toISOString());
      }
      
      // Move to next slot
      currentTime.setMinutes(currentTime.getMinutes() + step);
    }
    
    return new Response(
      JSON.stringify({ slots }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in getOpenSlots:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Hono app for availability endpoints
const app = new Hono();

app.post('/api/availability/list', async (c) => {
  return await listAvailabilityBlocks(c.req.raw);
});

app.post('/api/availability/block', async (c) => {
  return await blockAvailability(c.req.raw);
});

app.post('/api/availability/unblock', async (c) => {
  return await unblockAvailability(c.req.raw);
});

app.get('/api/availability/open-slots', async (c) => {
  return await getOpenSlots(c.req.raw);
});

app.delete('/api/availability/block/:id', async (c) => {
  const blockId = c.req.param('id');
  return await deleteAvailabilityBlock(c.req.raw, blockId);
});

export default app;