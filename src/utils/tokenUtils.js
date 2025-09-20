import jwt from "jsonwebtoken";

export const generateToken = (payload, expiresIn, secret) => {
  return jwt.sign(payload, expiresIn, secret);
};

/**
 * @function getUserIdFromToken
 * @description Safely extracts the user ID from a JWT access token.
 * @param {string} token - The JWT access token (without "Bearer " prefix).
 * @returns {string|null} - User ID if valid, otherwise null.
 */
export const getUserIdFromToken = (token) => {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return decoded?.id || null;
  } catch (err) {
    // Token is invalid, expired, or malformed
    return null;
  }
};
