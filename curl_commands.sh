#!/bin/bash

# Pocket Legal API Testing Script
# This script provides curl commands to test all major endpoints of the Pocket Legal API

# Set the base URL
BASE_URL="http://localhost:5000/api"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Pocket Legal API Testing Script${NC}"
echo "=============================="
echo ""

# Function to print section headers
section() {
  echo -e "${GREEN}$1${NC}"
  echo "------------------------------"
}

# Store the authentication token
AUTH_TOKEN=""
LAWYER_TOKEN=""

# -----------------------
# User Authentication
# -----------------------
section "USER AUTHENTICATION"

# Register a customer user
echo "Registering a customer user..."
REGISTER_CUSTOMER=$(curl -s -X POST "${BASE_URL}/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "johndoe@example.com",
    "password": "password123",
    "phone": "1234567890",
    "role": "customer"
  }')
echo "$REGISTER_CUSTOMER"
echo ""

# Register a lawyer user
echo "Registering a lawyer user..."
REGISTER_LAWYER=$(curl -s -X POST "${BASE_URL}/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "janesmith@example.com",
    "password": "password123",
    "phone": "9876543210",
    "role": "lawyer",
    "bio": "Experienced family law attorney",
    "areasOfExpertise": ["Family Law", "Divorce"],
    "hourlyRate": 200
  }')
echo "$REGISTER_LAWYER"
echo ""

# Login as customer
echo "Logging in as customer..."
LOGIN_CUSTOMER=$(curl -s -X POST "${BASE_URL}/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "johndoe@example.com",
    "password": "password123"
  }')
echo "$LOGIN_CUSTOMER"
echo ""

# Extract the customer token
AUTH_TOKEN=$(echo $LOGIN_CUSTOMER | grep -o '"token":"[^"]*' | sed 's/"token":"//')
echo "Authentication token: $AUTH_TOKEN"
echo ""

# Login as lawyer
echo "Logging in as lawyer..."
LOGIN_LAWYER=$(curl -s -X POST "${BASE_URL}/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "janesmith@example.com",
    "password": "password123"
  }')
echo "$LOGIN_LAWYER"
echo ""

# Extract the lawyer token
LAWYER_TOKEN=$(echo $LOGIN_LAWYER | grep -o '"token":"[^"]*' | sed 's/"token":"//')
echo "Lawyer token: $LAWYER_TOKEN"
echo ""

# -----------------------
# User Profile
# -----------------------
section "USER PROFILE"

# Get user profile
echo "Getting user profile..."
curl -s -X GET "${BASE_URL}/users/profile" \
  -H "Authorization: Bearer $AUTH_TOKEN"
echo ""
echo ""

# Update user profile
echo "Updating user profile..."
curl -s -X PUT "${BASE_URL}/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "name": "John Updated",
    "phone": "1112223333",
    "address": "123 Main St, City, Country",
    "profilePicture": "https://example.com/profile.jpg"
  }'
echo ""
echo ""

# -----------------------
# Services
# -----------------------
section "SERVICES"

# Get all services
echo "Getting all services..."
SERVICES=$(curl -s -X GET "${BASE_URL}/services?page=1&limit=10")
echo "$SERVICES"
echo ""

# Extract a service ID for later use
SERVICE_ID=$(echo $SERVICES | grep -o '"_id":"[^"]*' | sed 's/"_id":"//' | head -1)
echo "Using service ID: $SERVICE_ID"
echo ""

# Get a specific service
echo "Getting service details..."
curl -s -X GET "${BASE_URL}/services/$SERVICE_ID"
echo ""
echo ""

# -----------------------
# Cart
# -----------------------
section "CART"

# Get lawyer ID for cart
LAWYER_ID=$(echo $LOGIN_LAWYER | grep -o '"_id":"[^"]*' | sed 's/"_id":"//')
echo "Using lawyer ID: $LAWYER_ID"
echo ""

# Add to cart
echo "Adding item to cart..."
CART_RESPONSE=$(curl -s -X POST "${BASE_URL}/users/cart" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "serviceId": "'$SERVICE_ID'",
    "lawyerId": "'$LAWYER_ID'",
    "quantity": 1,
    "notes": "Need help with contract review",
    "preferredDate": "2023-12-15T10:00:00.000Z"
  }')
echo "$CART_RESPONSE"
echo ""

# Extract cart item ID
CART_ITEM_ID=$(echo $CART_RESPONSE | grep -o '"_id":"[^"]*' | sed 's/"_id":"//' | head -1)
echo "Cart item ID: $CART_ITEM_ID"
echo ""

# Get cart items
echo "Getting cart items..."
curl -s -X GET "${BASE_URL}/users/cart" \
  -H "Authorization: Bearer $AUTH_TOKEN"
echo ""
echo ""

# -----------------------
# Bookings
# -----------------------
section "BOOKINGS"

# Create a direct booking
echo "Creating a direct booking..."
BOOKING_RESPONSE=$(curl -s -X POST "${BASE_URL}/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "serviceId": "'$SERVICE_ID'",
    "lawyerId": "'$LAWYER_ID'",
    "bookingDate": "2023-12-15",
    "startTime": "2023-12-15T10:00:00.000Z",
    "endTime": "2023-12-15T11:00:00.000Z",
    "notes": "Need legal advice on contract negotiation"
  }')
echo "$BOOKING_RESPONSE"
echo ""

# Extract booking ID
BOOKING_ID=$(echo $BOOKING_RESPONSE | grep -o '"_id":"[^"]*' | sed 's/"_id":"//' | head -1)
echo "Booking ID: $BOOKING_ID"
echo ""

# Get user bookings
echo "Getting user bookings..."
curl -s -X GET "${BASE_URL}/bookings?page=1&limit=10" \
  -H "Authorization: Bearer $AUTH_TOKEN"
echo ""
echo ""

# Get booking details
echo "Getting booking details..."
curl -s -X GET "${BASE_URL}/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN"
echo ""
echo ""

# Update booking status (as lawyer)
echo "Updating booking status (confirming)..."
curl -s -X PUT "${BASE_URL}/bookings/$BOOKING_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LAWYER_TOKEN" \
  -d '{
    "status": "confirmed",
    "notes": "Booking confirmed for requested time"
  }'
echo ""
echo ""

# -----------------------
# Payments
# -----------------------
section "PAYMENTS"

# Process payment
echo "Processing payment..."
PAYMENT_RESPONSE=$(curl -s -X POST "${BASE_URL}/payments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "bookingId": "'$BOOKING_ID'",
    "paymentMethod": "credit_card",
    "amount": 250
  }')
echo "$PAYMENT_RESPONSE"
echo ""

# Extract payment ID
PAYMENT_ID=$(echo $PAYMENT_RESPONSE | grep -o '"_id":"[^"]*' | sed 's/"_id":"//' | head -1)
echo "Payment ID: $PAYMENT_ID"
echo ""

# Get payment details
echo "Getting payment details..."
curl -s -X GET "${BASE_URL}/payments/$PAYMENT_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN"
echo ""
echo ""

# Get payment history
echo "Getting payment history..."
curl -s -X GET "${BASE_URL}/payments?page=1&limit=10" \
  -H "Authorization: Bearer $AUTH_TOKEN"
echo ""
echo ""

# -----------------------
# Notifications
# -----------------------
section "NOTIFICATIONS"

# Get user notifications
echo "Getting user notifications..."
NOTIFICATIONS=$(curl -s -X GET "${BASE_URL}/notifications?page=1&limit=10" \
  -H "Authorization: Bearer $AUTH_TOKEN")
echo "$NOTIFICATIONS"
echo ""

# Extract notification ID if available
NOTIFICATION_ID=$(echo $NOTIFICATIONS | grep -o '"_id":"[^"]*' | sed 's/"_id":"//' | head -1)
if [ ! -z "$NOTIFICATION_ID" ]; then
  echo "Notification ID: $NOTIFICATION_ID"
  
  # Mark notification as read
  echo "Marking notification as read..."
  curl -s -X PUT "${BASE_URL}/notifications/$NOTIFICATION_ID/read" \
    -H "Authorization: Bearer $AUTH_TOKEN"
  echo ""
  echo ""
else
  echo "No notifications found to mark as read"
  echo ""
fi

# Mark all notifications as read
echo "Marking all notifications as read..."
curl -s -X PUT "${BASE_URL}/notifications/read-all" \
  -H "Authorization: Bearer $AUTH_TOKEN"
echo ""
echo ""

echo -e "${BLUE}Testing completed!${NC}" 