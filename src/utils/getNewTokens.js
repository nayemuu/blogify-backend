import jwt from "jsonwebtoken";

/**
 * Generates new access and refresh tokens for a user.
 * @param {Object} user - The user object.
 * @param {string} user.id - The user ID.
 * @returns {Object} - An object containing the generated token and refresh token.
 */
export const getNewTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, type: "access" },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, type: "refresh" },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_JWT_EXPIRES_IN,
    }
  );

  return { accessToken, refreshToken };
};
