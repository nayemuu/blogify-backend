import validator from "validator";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { replaceMongoIdInObject } from "../utils/mongoDB-Utils.js";
import User from "../models/userModel.js";

export const createUser = async (userData) => {
  const { name, email, picture, status, password } = userData;

  //check if fields are empty
  if (!name || !email || !password) {
    throw new AppError("Please fill all fields.", 400);
  }

  //check name length
  if (
    !validator.isLength(name, {
      min: 2,
      max: 30,
    })
  ) {
    throw new AppError(
      "Plase make sure your name is between 2 and 30 characters.",
      400
    );
  }

  //check if email address is valid
  if (!validator.isEmail(email)) {
    throw new AppError(
      "Please make sure to provide a valid email address.",
      400
    );
  }

  //check if user already exist
  const isUserExists = await User.findOne({ email });
  if (isUserExists) {
    throw new AppError(
      "Please try again with a different email address, this email already exist.",
      409
    );
  }

  //check password length
  if (
    !validator.isLength(password, {
      min: 6,
      max: 128,
    })
  ) {
    throw new AppError(
      "Please make sure your password is between 6 and 128 characters.",
      400
    );
  }

  const newUser = await User.create({
    name,
    email,
    password,
  });

  const newObj = newUser._doc;
  delete newObj.password;

  // console.log("newObj = ", newObj);
  return replaceMongoIdInObject(newObj);
};
