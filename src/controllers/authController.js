import { createUser, authenticateUser } from "../services/authService.js";
import { catchAsync } from "../utils/catchAsync.js";
import { generateToken } from "../utils/tokenUtils.js";

export const register = catchAsync(async (req, res, next) => {
  const { name, email, picture, password } = req.body || {};
  const user = await createUser({
    name,
    email,
    picture,
    password,
  });

  const access = generateToken(
    { id: user._id, email: user.email, type: "access" },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  const refresh = generateToken(
    { id: user._id, email: user.email, type: "refresh" },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_JWT_EXPIRES_IN,
    }
  );

  res.status(201).json({
    status: "success",
    data: {
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
      tokens: { access, refresh },
    },
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new AppError("Please provide email and password.", 400);
  }

  const user = await authenticateUser(email, password);

  const access = generateToken(
    { id: user._id, email: user.email, type: "access" },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  const refresh = generateToken(
    { id: user._id, email: user.email, type: "refresh" },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_JWT_EXPIRES_IN,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      user: { name: user.name },
      tokens: { access, refresh },
    },
  });
});
