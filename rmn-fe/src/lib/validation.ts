/**
 * Vietnamese Phone Number Validation Utility
 * Standard VN mobile prefixes: 03, 05, 07, 08, 09
 * Format: 10 digits starting with 0, or starting with +84/84
 */
export const VN_PHONE_REGEX = /^(0|84|\+84)(3|5|7|8|9)([0-9]{8})$/;

export const isValidVNPhone = (phone: string): boolean => {
  return VN_PHONE_REGEX.test(phone.replace(/\s/g, ""));
};
