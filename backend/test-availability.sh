#!/bin/bash

# Availability Seeds + Sanity Tests Runner
# This script seeds availability data and runs sanity tests

echo "🚀 Starting Availability Seeds + Sanity Tests"
echo "==============================================" 

# Check if we're in the right directory
if [ ! -f "backend/seeds/availability.ts" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Check if environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE" ]; then
    echo "⚠️  Warning: SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables should be set"
    echo "   You can set them in backend/.env or export them:"
    echo "   export SUPABASE_URL='https://wktxbpmwbyddmwmfymlh.supabase.co'"
    echo "   export SUPABASE_SERVICE_ROLE='your-service-role-key'"
    echo ""
fi

echo "📦 Installing dependencies..."
cd backend
npm install @supabase/supabase-js 2>/dev/null || echo "Dependencies already installed"

echo ""
echo "🌱 Running availability seeds..."
npx tsx seeds/availability.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "🧪 Running sanity tests..."
    npx tsx tests/openSlots.spec.ts
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 All seeds and tests completed successfully!"
        echo ""
        echo "📋 What was tested:"
        echo "  ✅ Lunch blocks properly block time slots"
        echo "  ✅ Services don't extend past working hours"
        echo "  ✅ Existing bookings reduce available slots"
        echo "  ✅ Multiple blocks compound correctly"
        echo ""
        echo "🔧 Next steps:"
        echo "  1. Test the booking flow in your app"
        echo "  2. Verify slots update when you add/remove blocks"
        echo "  3. Check that bookings properly conflict with slots"
    else
        echo ""
        echo "❌ Some tests failed. Check the output above for details."
        exit 1
    fi
else
    echo ""
    echo "❌ Seeding failed. Check your database connection and environment variables."
    exit 1
fi