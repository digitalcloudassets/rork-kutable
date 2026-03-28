import { env } from '@/config/env';

interface NotificationData {
  type: 'booking_confirmed' | 'booking_reminder' | 'booking_cancelled' | 'payment_received' | 'new_booking';
  bookingId?: string;
  barberId?: string;
  clientId?: string;
  message: string;
}

interface SendNotificationParams {
  userId: string;
  title: string;
  body: string;
  data?: NotificationData;
}

interface SendBulkNotificationParams {
  userIds: string[];
  title: string;
  body: string;
  data?: NotificationData;
}

export class NotificationService {
  private static async sendRequest(endpoint: string, payload: any) {
    const apiUrl = env.API_URL || '';
    const response = await fetch(`${apiUrl}/api/notifications/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Notification failed: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  static async sendNotification({ userId, title, body, data }: SendNotificationParams) {
    return this.sendRequest('send', {
      userId,
      notification: { title, body, data },
    });
  }

  static async sendBulkNotification({ userIds, title, body, data }: SendBulkNotificationParams) {
    return this.sendRequest('bulk-send', {
      userIds,
      title,
      body,
      data,
    });
  }

  static async notifyBookingConfirmed(clientId: string, bookingDetails: { barberName: string; serviceName: string; dateTime: string; bookingId: string }) {
    return this.sendNotification({
      userId: clientId,
      title: 'Booking Confirmed!',
      body: `Your ${bookingDetails.serviceName} appointment with ${bookingDetails.barberName} is confirmed for ${bookingDetails.dateTime}`,
      data: {
        type: 'booking_confirmed',
        bookingId: bookingDetails.bookingId,
        message: 'Booking confirmed successfully',
      },
    });
  }

  static async notifyNewBooking(barberId: string, bookingDetails: { clientName: string; serviceName: string; dateTime: string; bookingId: string }) {
    return this.sendNotification({
      userId: barberId,
      title: 'New Booking!',
      body: `${bookingDetails.clientName} booked ${bookingDetails.serviceName} for ${bookingDetails.dateTime}`,
      data: {
        type: 'new_booking',
        bookingId: bookingDetails.bookingId,
        message: 'New booking received',
      },
    });
  }

  static async notifyBookingReminder(clientId: string, bookingDetails: { barberName: string; serviceName: string; dateTime: string; bookingId: string }) {
    return this.sendNotification({
      userId: clientId,
      title: 'Appointment Reminder',
      body: `Don't forget your ${bookingDetails.serviceName} appointment with ${bookingDetails.barberName} at ${bookingDetails.dateTime}`,
      data: {
        type: 'booking_reminder',
        bookingId: bookingDetails.bookingId,
        message: 'Appointment reminder',
      },
    });
  }

  static async notifyBookingCancelled(userId: string, bookingDetails: { serviceName: string; dateTime: string; bookingId: string; reason?: string }) {
    const reasonText = bookingDetails.reason ? ` Reason: ${bookingDetails.reason}` : '';
    return this.sendNotification({
      userId,
      title: 'Booking Cancelled',
      body: `Your ${bookingDetails.serviceName} appointment for ${bookingDetails.dateTime} has been cancelled.${reasonText}`,
      data: {
        type: 'booking_cancelled',
        bookingId: bookingDetails.bookingId,
        message: 'Booking cancelled',
      },
    });
  }

  static async notifyPaymentReceived(barberId: string, paymentDetails: { amount: string; clientName: string; serviceName: string }) {
    return this.sendNotification({
      userId: barberId,
      title: 'Payment Received!',
      body: `You received ${paymentDetails.amount} from ${paymentDetails.clientName} for ${paymentDetails.serviceName}`,
      data: {
        type: 'payment_received',
        message: 'Payment received successfully',
      },
    });
  }
}