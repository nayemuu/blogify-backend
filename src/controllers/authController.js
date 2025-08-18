import { createUser } from "../services/authService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const register2 = async (req, res, next) => {
  try {
    const { name, email, picture, password } = req.body || {};
    const newUser = await createUser({
      name,
      email,
      picture,
      password,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = catchAsync(async (req, res, next) => {
  const { name, email, picture, password } = req.body || {};
  const newUser = await createUser({
    name,
    email,
    picture,
    password,
  });

  res.status(201).json({
    status: "success",
    data: {
      user: newUser,
    },
  });
});
