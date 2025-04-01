# Notifications Module

This module handles all notification-related functionality for the Pocket Legal application.

## Features

- Create notifications for various events (bookings, payments, reviews, etc.)
- Get user notifications with pagination and filtering
- Mark notifications as read (single or all)
- Delete notifications (single or all)
- Service functions to send notifications for specific events

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | /api/notifications | Get user notifications | Yes |
| PUT | /api/notifications/:id/read | Mark notification as read | Yes |
| PUT | /api/notifications/read-all | Mark all notifications as read | Yes |
| DELETE | /api/notifications/:id | Delete notification | Yes |
| DELETE | /api/notifications | Clear all notifications | Yes |

## Notification Types

- `booking`: Booking-related notifications
- `payment`: Payment-related notifications
- `system`: System notifications
- `chat`: Chat message notifications
- `review`: Review-related notifications
- `other`: Miscellaneous notifications

## Priority Levels

- `low`: Low priority notifications
- `medium`: Medium priority notifications (default)
- `high`: High priority notifications

## Implementation Details

The module uses MongoDB for storing notifications and implements efficient queries with indexes. It supports pagination, filtering by type, priority, and read status, and provides useful statistics like unread counts.

## Usage Examples

### Services

The notification service provides methods to send notifications for different events:

```javascript
// Import the service
const notificationService = require('../notifications/services/notificationService');

// Send booking notification
await notificationService.sendBookingNotification(booking, 'confirmed');

// Send payment notification
await notificationService.sendPaymentNotification(payment, booking, 'success');

// Send review notification
await notificationService.sendReviewNotification(review);
``` 