# Payments Module

This module handles all payment-related functionality for the Pocket Legal application, including processing payments, managing refunds, and tracking payment history.

## Features

- Process payments for bookings
- View payment history and details
- Process refunds
- Manage payment status changes
- Track transaction details

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | /api/payments/process | Process payment for booking | Yes |
| GET | /api/payments | Get user's payment history | Yes |
| GET | /api/payments/:id | Get payment details by ID | Yes |
| POST | /api/payments/refund | Process refund for a payment | Yes (Admin/Lawyer) |

## Payment Status Options

- `pending`: Payment initiated but not completed
- `success`: Payment successfully processed
- `failed`: Payment processing failed
- `refunded`: Payment fully refunded
- `partial_refund`: Payment partially refunded

## Payment Methods Supported

- Credit Card
- Debit Card
- PayPal
- Bank Transfer
- Other methods

## Payment Features

- Transaction IDs for tracking
- Receipt URL generation
- Payment details storage (card info, etc.)
- Gateway response tracking
- Refund reason and amount tracking

## Usage Examples

```javascript
// Import the module
const paymentsModule = require('../payments');

// Process payment
const payment = await paymentsModule.paymentController.processPayment({
  bookingId,
  paymentMethod: 'credit_card'
});

// Get payment history
const payments = await paymentsModule.paymentController.getUserPayments({
  status: 'success'
});

// Process refund
await paymentsModule.paymentController.processRefund({
  paymentId,
  refundReason: 'Service not provided as expected',
  refundAmount: 50 // Partial refund
});
```

## Integration with Booking Module

The payments module is closely integrated with the bookings module:

- When a payment is processed, the booking's payment status is updated
- When a refund is processed, the booking's payment status is updated accordingly
- Payment IDs are stored in the booking records for easy reference 