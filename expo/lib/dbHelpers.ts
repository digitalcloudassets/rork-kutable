import { supabase } from '@/lib/supabaseClient';

// Helper to get current barber ID with error handling
export async function getCurrentBarberId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const barberId = session?.user?.id;
  if (!barberId) {
    throw new Error('Not signed in');
  }
  return barberId;
}

// Service operations with proper barber_id handling
export async function saveService(input: {
  name: string;
  price_cents: number;
  duration_min: number;
  description?: string;
  active?: boolean;
}) {
  try {
    const barberId = await getCurrentBarberId();

    const { error } = await supabase.from('services').insert({
      barber_id: barberId,
      name: input.name.trim(),
      price_cents: input.price_cents,
      duration_minutes: input.duration_min,
      description: input.description?.trim() || null,
      active: input.active ?? true,
    });

    if (error) {
      console.error('Error saving service:', error);
      throw new Error(`Failed to save service: ${error.message}`);
    }
  } catch (error) {
    console.error('Service save error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to save service');
  }
}

// Update service with ownership check
export async function updateService(
  serviceId: string,
  updates: {
    name?: string;
    price_cents?: number;
    duration_min?: number;
    description?: string;
    active?: boolean;
  }
) {
  try {
    const barberId = await getCurrentBarberId();

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name.trim();
    if (updates.price_cents !== undefined) updateData.price_cents = updates.price_cents;
    if (updates.duration_min !== undefined) updateData.duration_minutes = updates.duration_min;
    if (updates.description !== undefined) updateData.description = updates.description?.trim() || null;
    if (updates.active !== undefined) updateData.active = updates.active;
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', serviceId)
      .eq('barber_id', barberId); // Ensure ownership

    if (error) {
      console.error('Error updating service:', error);
      throw new Error(`Failed to update service: ${error.message}`);
    }
  } catch (error) {
    console.error('Service update error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update service');
  }
}

// Delete service with ownership check
export async function deleteService(serviceId: string) {
  try {
    const barberId = await getCurrentBarberId();

    // Check for existing bookings first
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('service_id', serviceId)
      .eq('status', 'confirmed')
      .limit(1);

    if (bookingError) {
      console.error('Error checking bookings:', bookingError);
      throw new Error('Failed to check service bookings');
    }

    if (bookings && bookings.length > 0) {
      throw new Error('Cannot delete service with confirmed bookings. Please deactivate it instead.');
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)
      .eq('barber_id', barberId); // Ensure ownership

    if (error) {
      console.error('Error deleting service:', error);
      throw new Error(`Failed to delete service: ${error.message}`);
    }
  } catch (error) {
    console.error('Service delete error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete service');
  }
}

// Block time with proper barber_id handling
export async function blockTime(
  start_iso: string,
  end_iso: string,
  note?: string
) {
  try {
    const barberId = await getCurrentBarberId();

    // Check for overlapping blocks
    const { data: existingBlocks, error: blockError } = await supabase
      .from('availability_blocks')
      .select('id')
      .eq('barber_id', barberId)
      .lt('start_utc', end_iso)
      .gt('end_utc', start_iso)
      .limit(1);

    if (blockError) {
      console.error('Error checking existing blocks:', blockError);
      throw new Error('Failed to check existing availability blocks');
    }

    if (existingBlocks && existingBlocks.length > 0) {
      throw new Error('This time slot overlaps with an existing blocked period');
    }

    // Check for overlapping bookings
    const { data: existingBookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('barber_id', barberId)
      .not('status', 'in', '("cancelled","refunded")')
      .lt('start_utc', end_iso)
      .gt('end_utc', start_iso)
      .limit(1);

    if (bookingError) {
      console.error('Error checking existing bookings:', bookingError);
      throw new Error('Failed to check existing bookings');
    }

    if (existingBookings && existingBookings.length > 0) {
      throw new Error('This time slot overlaps with an existing booking');
    }

    const { error } = await supabase.from('availability_blocks').insert({
      barber_id: barberId,
      start_utc: start_iso,
      end_utc: end_iso,
      reason: note ?? null,
    });

    if (error) {
      console.error('Error blocking time:', error);
      throw new Error(`Failed to block time: ${error.message}`);
    }
  } catch (error) {
    console.error('Block time error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to block time');
  }
}

// Unblock time with ownership check
export async function unblockTime(blockId: string) {
  try {
    const barberId = await getCurrentBarberId();

    const { error } = await supabase
      .from('availability_blocks')
      .delete()
      .eq('id', blockId)
      .eq('barber_id', barberId); // Ensure ownership

    if (error) {
      console.error('Error unblocking time:', error);
      throw new Error(`Failed to unblock time: ${error.message}`);
    }
  } catch (error) {
    console.error('Unblock time error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to unblock time');
  }
}

// Gallery operations with proper barber_id handling
export async function uploadGalleryItem(imageUrl: string, description?: string) {
  try {
    const barberId = await getCurrentBarberId();

    const { error } = await supabase.from('gallery_items').insert({
      barber_id: barberId,
      image_url: imageUrl,
      description: description?.trim() || null,
    });

    if (error) {
      console.error('Error uploading gallery item:', error);
      throw new Error(`Failed to upload gallery item: ${error.message}`);
    }
  } catch (error) {
    console.error('Gallery upload error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload gallery item');
  }
}

// Delete gallery item with ownership check
export async function deleteGalleryItem(itemId: string) {
  try {
    const barberId = await getCurrentBarberId();

    const { error } = await supabase
      .from('gallery_items')
      .delete()
      .eq('id', itemId)
      .eq('barber_id', barberId); // Ensure ownership

    if (error) {
      console.error('Error deleting gallery item:', error);
      throw new Error(`Failed to delete gallery item: ${error.message}`);
    }
  } catch (error) {
    console.error('Gallery delete error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete gallery item');
  }
}

// Error handling wrapper for UI components
export function handleDatabaseError(error: unknown, defaultMessage: string): string {
  console.error('Database error:', error);
  
  if (error instanceof Error) {
    // Return user-friendly error messages
    if (error.message.includes('Not signed in')) {
      return 'Please sign in to continue';
    }
    if (error.message.includes('overlaps')) {
      return error.message;
    }
    if (error.message.includes('confirmed bookings')) {
      return error.message;
    }
    if (error.message.includes('Failed to')) {
      return error.message;
    }
    return `${defaultMessage}: ${error.message}`;
  }
  
  return defaultMessage;
}

// React hook for database operations with error handling
export function useDatabaseOperation() {
  const handleOperation = async <T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const friendlyError = handleDatabaseError(error, errorMessage);
      return { success: false, error: friendlyError };
    }
  };

  return { handleOperation };
}