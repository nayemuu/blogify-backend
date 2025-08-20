import { createUser, authenticateUser } from "../services/authService.js";
import { catchAsync } from "../utils/catchAsync.js";
import { getNewTokens } from "../utils/getNewTokens.js";

export const register = catchAsync(async (req, res, next) => {
  const { name, email, picture, password } = req.body || {};
  const newUser = await createUser({
    name,
    email,
    picture,
    password,
  });

  const { accessToken, refreshToken } = getNewTokens(newUser);

  res.status(201).json({
    status: "success",
    data: {
      user: newUser,
      tokens: { access: accessToken, refresh: refreshToken },
    },
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new AppError("Please provide email and password.", 400);
  }

  const user = await authenticateUser(email, password);
  console.log("user ", user);

  const { accessToken, refreshToken } = getNewTokens(user);

  res.status(200).json({
    status: "success",
    data: {
      user: user,
      tokens: { access: accessToken, refresh: refreshToken },
    },
  });
});
