/**
 * Generates a 6-digit One-Time Password (OTP).
 *
 * @function generateOtp
 * @returns {number} A randomly generated 6-digit OTP (between 100000 and 999999).
 *
 * @description
 * Steps:
 * 1. `Math.random()` generates a decimal number between 0 (inclusive) and 1 (exclusive).
 *    Example: 0.348726429
 *
 * 2. Multiplying by 900000 scales the number to a range of [0, 899999.999...].
 *    Example: 0.348726429 * 900000 ≈ 313853.7861
 *
 * 3. Adding 100000 shifts the range to [100000, 999999.999...].
 *    This ensures the OTP is always at least 6 digits long.
 *    Example: 313853.7861 + 100000 ≈ 413853.7861
 *
 * 4. `Math.floor()` removes the decimal part, producing a whole number (integer).
 *    Example: 413853.7861 → 413853
 *
 * ✅ Final Result: A 6-digit OTP in the range 100000–999999.
 */
export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000);
};
