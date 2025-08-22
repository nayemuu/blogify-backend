import jwt from "jsonwebtoken";

export const generateToken = (payload, expiresIn, secret) => {
  return jwt.sign(payload, expiresIn, secret);
};
