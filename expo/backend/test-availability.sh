#!/bin/bash

# Test script for availability system
# Run this to test the availability endpoints

API_BASE="https://kutable.rork.app"
BARBER_ID="test-barber-123"
SERVICE_ID="test-service-456"
DATE="2024-01-15"

echo "Testing Availability System..."
echo "================================"

# Test 1: List availability blocks
echo "1. Testing list availability blocks..."
curl -X POST "${API_BASE}/api/availability/list" \
  -H "Content-Type: application/json" \
  -d "{\"barberId\": \"${BARBER_ID}\"}" \
  -w "\nStatus: %{http_code}\n\n"

# Test 2: Create availability block
echo "2. Testing create availability block..."
curl -X POST "${API_BASE}/api/availability/block" \
  -H "Content-Type: application/json" \
  -d "{
    \"barberId\": \"${BARBER_ID}\",
    \"startISO\": \"2024-01-15T14:00:00.000Z\",
    \"endISO\": \"2024-01-15T15:00:00.000Z\",
    \"reason\": \"Lunch break\"
  }" \
  -w "\nStatus: %{http_code}\n\n"

# Test 3: Get open slots
echo "3. Testing get open slots..."
curl -X GET "${API_BASE}/api/availability/open-slots?barberId=${BARBER_ID}&serviceId=${SERVICE_ID}&date=${DATE}" \
  -w "\nStatus: %{http_code}\n\n"

# Test 4: Health check
echo "4. Testing health endpoint..."
curl -X GET "${API_BASE}/api/health/ping" \
  -w "\nStatus: %{http_code}\n\n"

echo "Testing complete!"