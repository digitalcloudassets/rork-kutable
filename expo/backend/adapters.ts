import {
  Barber,
  Service,
  AvailabilityBlock,
  Booking,
  User,
  BarberRow,
  ServiceRow,
  AvailabilityBlockRow,
  BookingRow,
  UserRow
} from './types';

/**
 * Convert database row to Barber type
 */
export function mapBarberRowToBarber(row: BarberRow): Barber {
  return {
    id: row.id,
    name: row.name,
    photoUrl: row.photo_url,
    bio: row.bio,
    shopName: row.shop_name,
    shopAddress: row.shop_address,
    phone: row.phone,
    connectedAccountId: row.connected_account_id,
    rating: row.rating,
    reviewCount: row.review_count
  };
}

/**
 * Convert Barber type to database row (for inserts/updates)
 */
export function mapBarberToBarberRow(barber: Partial<Barber>): Partial<BarberRow> {
  return {
    id: barber.id,
    name: barber.name,
    photo_url: barber.photoUrl,
    bio: barber.bio,
    shop_name: barber.shopName,
    shop_address: barber.shopAddress,
    phone: barber.phone,
    connected_account_id: barber.connectedAccountId,
    rating: barber.rating,
    review_count: barber.reviewCount
  };
}

/**
 * Convert database row to Service type
 */
export function mapServiceRowToService(row: ServiceRow): Service {
  return {
    id: row.id,
    barberId: row.barber_id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    description: row.description,
    active: row.active
  };
}

/**
 * Convert Service type to database row (for inserts/updates)
 */
export function mapServiceToServiceRow(service: Partial<Service>): Partial<ServiceRow> {
  return {
    id: service.id,
    barber_id: service.barberId,
    name: service.name,
    duration_minutes: service.durationMinutes,
    price_cents: service.priceCents,
    description: service.description,
    active: service.active
  };
}

/**
 * Convert database row to AvailabilityBlock type
 */
export function mapAvailabilityBlockRowToAvailabilityBlock(row: AvailabilityBlockRow): AvailabilityBlock {
  return {
    id: row.id,
    barberId: row.barber_id,
    startISO: row.start_utc,
    endISO: row.end_utc,
    reason: row.reason
  };
}

/**
 * Convert AvailabilityBlock type to database row (for inserts/updates)
 */
export function mapAvailabilityBlockToAvailabilityBlockRow(block: Partial<AvailabilityBlock>): Partial<AvailabilityBlockRow> {
  return {
    id: block.id,
    barber_id: block.barberId,
    start_utc: block.startISO,
    end_utc: block.endISO,
    reason: block.reason
  };
}

/**
 * Convert database row to Booking type
 */
export function mapBookingRowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    barberId: row.barber_id,
    serviceId: row.service_id,
    startISO: row.start_iso,
    endISO: row.end_iso,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    note: row.note,
    status: row.status,
    paymentIntentId: row.payment_intent_id,
    createdAtISO: row.created_at
  };
}

/**
 * Convert Booking type to database row (for inserts/updates)
 */
export function mapBookingToBookingRow(booking: Partial<Booking>): Partial<BookingRow> {
  return {
    id: booking.id,
    barber_id: booking.barberId,
    service_id: booking.serviceId,
    start_iso: booking.startISO,
    end_iso: booking.endISO,
    client_name: booking.clientName,
    client_phone: booking.clientPhone,
    note: booking.note,
    status: booking.status,
    payment_intent_id: booking.paymentIntentId
  };
}

/**
 * Convert database row to User type
 */
export function mapUserRowToUser(row: UserRow): User {
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    phone: row.phone,
    email: row.email,
    photoUrl: row.photo_url
  };
}

/**
 * Convert User type to database row (for inserts/updates)
 */
export function mapUserToUserRow(user: Partial<User>): Partial<UserRow> {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    phone: user.phone,
    email: user.email,
    photo_url: user.photoUrl
  };
}

/**
 * Helper to convert array of rows to array of types
 */
export function mapRows<TRow, TType>(rows: TRow[], mapper: (row: TRow) => TType): TType[] {
  return rows.map(mapper);
}