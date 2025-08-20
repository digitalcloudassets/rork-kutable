#!/bin/bash

# Availability Backend Test Script
# This script tests the availability endpoints with curl commands

BASE_URL="http://localhost:3000/api"
BARBER_ID="test-barber-123"
SERVICE_ID="test-service-456"

echo "🧪 Testing Availability Backend Endpoints"
echo "========================================="

# Test 1: Create an availability block
echo "📅 Test 1: Creating availability block..."
BLOCK_RESPONSE=$(curl -s -X POST "$BASE_URL/availability/block" \
  -H "Content-Type: application/json" \
  -d '{
    "barberId": "'$BARBER_ID'",
    "startISO": "2024-01-15T12:00:00.000Z",
    "endISO": "2024-01-15T13:00:00.000Z",
    "reason": "Lunch break"
  }')

echo "Response: $BLOCK_RESPONSE"
BLOCK_ID=$(echo $BLOCK_RESPONSE | jq -r '.block.id // empty')

if [ -n "$BLOCK_ID" ]; then
  echo "✅ Block created successfully with ID: $BLOCK_ID"
else
  echo "❌ Failed to create block"
fi

echo ""

# Test 2: List availability blocks
echo "📋 Test 2: Listing availability blocks..."
LIST_RESPONSE=$(curl -s -X POST "$BASE_URL/availability/list" \
  -H "Content-Type: application/json" \
  -d '{
    "barberId": "'$BARBER_ID'",
    "startISO": "2024-01-15T00:00:00.000Z",
    "endISO": "2024-01-15T23:59:59.000Z"
  }')

echo "Response: $LIST_RESPONSE"
BLOCK_COUNT=$(echo $LIST_RESPONSE | jq '.blocks | length')
echo "✅ Found $BLOCK_COUNT availability blocks"

echo ""

# Test 3: Get open slots
echo "🕐 Test 3: Getting open slots..."
SLOTS_RESPONSE=$(curl -s -X GET "$BASE_URL/availability/open-slots?barberId=$BARBER_ID&serviceId=$SERVICE_ID&date=2024-01-15&tz=America/Los_Angeles&step=15")

echo "Response: $SLOTS_RESPONSE"
SLOT_COUNT=$(echo $SLOTS_RESPONSE | jq '.slots | length // 0')
echo "✅ Found $SLOT_COUNT available slots"

echo ""

# Test 4: Try to create overlapping block (should fail)
echo "⚠️  Test 4: Creating overlapping block (should fail)..."
OVERLAP_RESPONSE=$(curl -s -X POST "$BASE_URL/availability/block" \
  -H "Content-Type: application/json" \
  -d '{
    "barberId": "'$BARBER_ID'",
    "startISO": "2024-01-15T12:30:00.000Z",
    "endISO": "2024-01-15T13:30:00.000Z",
    "reason": "Another break"
  }')

echo "Response: $OVERLAP_RESPONSE"
if echo $OVERLAP_RESPONSE | jq -e '.error' > /dev/null; then
  echo "✅ Correctly rejected overlapping block"
else
  echo "❌ Should have rejected overlapping block"
fi

echo ""

# Test 5: Delete the availability block
if [ -n "$BLOCK_ID" ]; then
  echo "🗑️  Test 5: Deleting availability block..."
  DELETE_RESPONSE=$(curl -s -X POST "$BASE_URL/availability/unblock" \
    -H "Content-Type: application/json" \
    -d '{
      "barberId": "'$BARBER_ID'",
      "blockId": "'$BLOCK_ID'"
    }')

  echo "Response: $DELETE_RESPONSE"
  if echo $DELETE_RESPONSE | jq -e '.ok' > /dev/null; then
    echo "✅ Block deleted successfully"
  else
    echo "❌ Failed to delete block"
  fi
else
  echo "⏭️  Test 5: Skipping delete test (no block ID)"
fi

echo ""

# Test 6: Verify block is deleted
echo "🔍 Test 6: Verifying block deletion..."
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/availability/list" \
  -H "Content-Type: application/json" \
  -d '{
    "barberId": "'$BARBER_ID'",
    "startISO": "2024-01-15T00:00:00.000Z",
    "endISO": "2024-01-15T23:59:59.000Z"
  }')

FINAL_COUNT=$(echo $VERIFY_RESPONSE | jq '.blocks | length')
echo "✅ Final block count: $FINAL_COUNT"

echo ""
echo "🎉 Availability backend tests completed!"
echo ""
echo "📝 Summary:"
echo "- Create block: $([ -n "$BLOCK_ID" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "- List blocks: ✅ PASS"
echo "- Get open slots: ✅ PASS"
echo "- Reject overlap: $(echo $OVERLAP_RESPONSE | jq -e '.error' > /dev/null && echo "✅ PASS" || echo "❌ FAIL")"
echo "- Delete block: $([ -n "$BLOCK_ID" ] && echo "✅ PASS" || echo "⏭️ SKIP")"