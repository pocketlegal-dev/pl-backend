# Bookings Module

This module handles all booking-related functionality for the Pocket Legal application, including creation, management, and status updates of legal service appointments.

## Features

- Create bookings from cart checkout or directly
- View bookings as a customer or lawyer
- Update booking status (confirm, complete, cancel, reject)
- Reschedule bookings
- Document management for bookings
- Support for online meetings

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | /api/bookings/checkout | Create bookings from cart | Yes |
| POST | /api/bookings | Create single booking | Yes |
| GET | /api/bookings | Get user's bookings with filtering | Yes |
| GET | /api/bookings/lawyer | Get lawyer's bookings with filtering | Yes (Lawyers only) |
| GET | /api/bookings/:id | Get booking by ID | Yes |
| PUT | /api/bookings/:id/status | Update booking status | Yes |
| POST | /api/bookings/:id/reschedule | Reschedule booking | Yes |

## Booking Status Flow

1. `pending`: Initial status after booking creation
2. `confirmed`: Booking confirmed by lawyer
3. `completed`: Service has been provided
4. `cancelled`: Booking cancelled by customer
5. `rejected`: Booking rejected by lawyer

## Booking Features

- Date and time management
- Support for rescheduling
- Document requirements and uploads
- Online meeting links
- Notes for both customers and lawyers
- Payment status tracking

## Usage Examples

```javascript
// Import the module
const bookingsModule = require('../bookings');

// Create a booking
const booking = await bookingsModule.bookingController.createBooking({
  lawyerId,
  serviceId,
  bookingDate: '2023-12-01',
  startTime: '2023-12-01T10:00:00',
  endTime: '2023-12-01T11:00:00'
});

// Update booking status
await bookingsModule.bookingController.updateBookingStatus(bookingId, 'confirmed');

// Get user bookings
const bookings = await bookingsModule.bookingController.getUserBookings({
  status: 'confirmed',
  startDate: '2023-12-01',
  endDate: '2023-12-31'
});
``` 