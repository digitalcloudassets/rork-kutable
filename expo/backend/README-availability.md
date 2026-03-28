# Availability Seeds + Sanity Tests

This directory contains seeds and tests for the availability system to ensure the booking logic works correctly with blocked times and existing bookings.

## Files

- `seeds/availability.ts` - Seeds availability blocks and sample bookings
- `tests/openSlots.spec.ts` - Sanity tests for open slots logic
- `test-availability.sh` - Script to run seeds and tests
- `sql/availability_blocks.sql` - Database schema for availability blocks

## Quick Start

1. **Set environment variables:**
   ```bash
   export SUPABASE_URL='https://wktxbpmwbyddmwmfymlh.supabase.co'
   export SUPABASE_SERVICE_ROLE='your-service-role-key'
   ```

2. **Run the test script:**
   ```bash
   chmod +x backend/test-availability.sh
   ./backend/test-availability.sh
   ```

## What Gets Seeded

### Availability Blocks
- **Lunch blocks**: 12:00-12:30 PM every weekday for next 7 days
- **Personal blocks**: Random 60-minute blocks in afternoons (2-5 PM)
- Applied to first 2 barbers in the system

### Sample Bookings
- One test booking for tomorrow at 10:00 AM
- Uses first available service from the database

## Tests Performed

### Test 1: Lunch Block Avoidance
- ✅ Verifies 30-minute services skip over lunch blocks
- ✅ Ensures no slots conflict with 12:00-12:30 PM lunch time

### Test 2: End-of-Day Fitting
- ✅ Confirms 45-minute services don't extend past 6 PM
- ✅ Validates latest possible start times

### Test 3: Booking Conflicts
- ✅ Tests that existing bookings reduce available slots
- ✅ Verifies slot count decreases when bookings are added

### Test 4: Multiple Block Compounding
- ✅ Ensures multiple availability blocks work together
- ✅ Validates total slot count stays within expected range

## Expected Results

After running successfully, you should see:
- Predictable lunch blocks created for weekdays
- Random personal blocks in afternoons
- Open slots that properly avoid blocked times
- Booking conflicts that reduce available slots

## Troubleshooting

### Common Issues

1. **"No service found" errors**
   - Ensure you have services seeded in your database
   - Check that services are marked as `active: true`

2. **Environment variable warnings**
   - Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE`
   - Or create a `backend/.env` file with these values

3. **Database connection errors**
   - Verify your Supabase credentials are correct
   - Check that the `availability_blocks` table exists

### Manual Testing

You can also test individual components:

```bash
# Run just the seeds
cd backend
npx tsx seeds/availability.ts

# Run just the tests
npx tsx tests/openSlots.spec.ts

# Test a specific endpoint
curl "http://localhost:3000/api/availability/open-slots?barberId=barber-1&serviceId=s1&date=2024-01-20"
```

## Integration with App

Once seeds and tests pass:

1. **Test booking flow** - Try booking appointments in your app
2. **Verify calendar** - Check that blocks appear in the dashboard calendar
3. **Test slot updates** - Add/remove blocks and see slots change
4. **Validate conflicts** - Ensure bookings properly block future slots

The seeded data provides a realistic testing environment with:
- Consistent lunch breaks
- Varied personal time blocks  
- Sample bookings to test conflicts
- Multiple barbers for comparison