import { Platform, Alert, Linking } from 'react-native';
import * as Calendar from 'expo-calendar';
import * as Sharing from 'expo-sharing';

export interface BookingDetails {
  barberName: string;
  serviceName: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  location: string;
  address: string;
  notes?: string;
}

export async function addToCalendar(booking: BookingDetails): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      // For web, create a Google Calendar link
      const startDate = new Date(booking.startTime);
      const endDate = new Date(booking.endTime);
      
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      const title = encodeURIComponent(`${booking.serviceName} with ${booking.barberName}`);
      const detailsText = `Appointment at ${booking.location}\n${booking.address}${booking.notes ? '\n\nNotes: ' + booking.notes : ''}`;
      const details = encodeURIComponent(detailsText);
      const location = encodeURIComponent(`${booking.location}, ${booking.address}`);
      
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${details}&location=${location}`;
      
      await Linking.openURL(googleCalendarUrl);
      return true;
    }

    // Request calendar permissions
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Calendar access is needed to add this appointment to your calendar.'
      );
      return false;
    }

    // Get default calendar
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCalendar = calendars.find(
      (cal) => cal.source?.name === 'Default' || cal.isPrimary
    ) || calendars[0];

    if (!defaultCalendar) {
      Alert.alert('Error', 'No calendar found to add the event.');
      return false;
    }

    // Create calendar event
    const notesText = `Appointment at ${booking.location}\n${booking.address}${booking.notes ? '\n\nNotes: ' + booking.notes : ''}`;
    const eventDetails = {
      title: `${booking.serviceName} with ${booking.barberName}`,
      startDate: new Date(booking.startTime),
      endDate: new Date(booking.endTime),
      location: `${booking.location}, ${booking.address}`,
      notes: notesText,
      alarms: [
        { relativeOffset: -60 * 24 }, // 24 hours before
        { relativeOffset: -60 }, // 1 hour before
      ],
    };

    await Calendar.createEventAsync(defaultCalendar.id, eventDetails);
    
    Alert.alert(
      'Success',
      'Appointment added to your calendar with reminders set for 24 hours and 1 hour before.'
    );
    
    return true;
  } catch (error) {
    console.error('Error adding to calendar:', error);
    Alert.alert(
      'Error',
      'Failed to add appointment to calendar. Please try again.'
    );
    return false;
  }
}

export async function shareBooking(booking: BookingDetails): Promise<boolean> {
  try {
    const startTime = new Date(booking.startTime);
    const formattedDate = startTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const shareText = `📅 Appointment Confirmed\n\n` +
      `💇‍♂️ Service: ${booking.serviceName}\n` +
      `👨‍💼 Barber: ${booking.barberName}\n` +
      `📅 Date: ${formattedDate}\n` +
      `🕐 Time: ${formattedTime}\n` +
      `📍 Location: ${booking.location}\n` +
      `${booking.address}${booking.notes ? '\n\n📝 Notes: ' + booking.notes : ''}`;

    if (Platform.OS === 'web') {
      // For web, use Web Share API if available, otherwise copy to clipboard
      if (navigator.share) {
        await navigator.share({
          title: 'Appointment Details',
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        Alert.alert('Copied', 'Appointment details copied to clipboard!');
      }
      return true;
    }

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        'Sharing Not Available',
        'Sharing is not available on this device.'
      );
      return false;
    }

    // Share the booking details
    await Sharing.shareAsync('data:text/plain;base64,' + btoa(shareText), {
      mimeType: 'text/plain',
      dialogTitle: 'Share Appointment Details',
    });
    
    return true;
  } catch (error) {
    console.error('Error sharing booking:', error);
    Alert.alert(
      'Error',
      'Failed to share appointment details. Please try again.'
    );
    return false;
  }
}