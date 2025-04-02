import { format, toZonedTime } from 'date-fns-tz';

const isValidDate = (date: Date) => !isNaN(date.getTime());

// Add this helper first
const parseDateSafely = (dateString: string): Date => {
  try {
    const date = new Date(dateString);
    return isValidDate(date) ? date : new Date();
  } catch {
    return new Date();
  }
};

// Convert UTC datetime to EAT time string (e.g., "2:00 PM")
export const formatTimeForDisplay = (utcString: string) => {
  const date = parseDateSafely(utcString);
  const eatTime = toZonedTime(date, 'Africa/Nairobi');
  return format(eatTime, 'hh:mm a', { timeZone: 'Africa/Nairobi' });
};

// Convert UTC datetime to EAT date string (e.g., "Monday, May 20, 2024")
export const formatDateForDisplay = (utcString: string) => {
  const date = parseDateSafely(utcString);
  const eatTime = toZonedTime(date, 'Africa/Nairobi');
  return format(eatTime, 'EEEE, MMMM do yyyy', { timeZone: 'Africa/Nairobi' });
};

// Validate if the appointment time is between 8 AM and 5 PM EAT
export const validateAppointmentTime = (utcString: string) => {
  const date = parseDateSafely(utcString);
  const eatTime = toZonedTime(date, 'Africa/Nairobi');
  const hours = eatTime.getHours();
  return hours >= 8 && hours < 17;
};

// Convert UTC datetime to a full EAT datetime string (e.g., "20 March 2024, 2:00 PM EAT")
export const convertToEAT = (utcString: string) => {
  const date = parseDateSafely(utcString);
  const eatTime = toZonedTime(date, 'Africa/Nairobi');
  return format(eatTime, 'dd MMM yyyy hh:mm a XXX', {
    timeZone: 'Africa/Nairobi'
  });
};