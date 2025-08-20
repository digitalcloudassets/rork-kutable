/**
 * Converts a phone number to E.164 format
 * This is a simple implementation - in production you'd want to use a library like libphonenumber
 */
export function formatToE164(phone: string, defaultCountryCode: string = '+1'): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  if (!digits) return null;
  
  // If it starts with country code, use as is
  if (digits.length === 11 && digits.startsWith('1')) {
    return '+' + digits;
  }
  
  // If it's 10 digits, assume US number
  if (digits.length === 10) {
    return defaultCountryCode + digits;
  }
  
  // If it's already formatted with +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Default: prepend country code
  return defaultCountryCode + digits;
}

/**
 * Validates if a phone number looks reasonable
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  const digits = phone.replace(/\D/g, '');
  
  // Should have at least 10 digits for most countries
  return digits.length >= 10 && digits.length <= 15;
}