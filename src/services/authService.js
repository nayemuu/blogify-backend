import validator from "validator";
import bcrypt from "bcrypt";
import { AppError } from "../utils/appError.js";
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

  // console.log("newUser = ", newUser);

  // Convert the Mongoose document into a plain JavaScript object
  const sanitizedUser = newUser.toObject();

  /**
   * @function toObject
   * @description Converts a Mongoose document into a plain JavaScript object.
   *
   * @why
   * Mongoose documents (e.g., `newUser`) are not plain objects — they are instances of
   * Mongoose's internal `Document` class and include:
   * - Built-in instance methods (`save()`, `populate()`, etc.)
   * - Virtual properties and getters/setters
   * - Internal metadata and symbols (e.g., `$__`, `_doc`)
   *
   * @benefits
   * Calling `.toObject()`:
   * - ✅ Converts the document to a plain JavaScript object
   * - ✅ Removes Mongoose-specific internals
   * - ✅ Allows safe manipulation (e.g., deleting sensitive fields like `password`)
   * - ✅ Prepares data for serialization or sending in API responses
   *
   * @usecase
   * Use `.toObject()` when you need to:
   * - Sanitize a user object before returning it to the frontend
   * - Clone a document without including internal methods or metadata
   * - Work with libraries expecting plain objects (e.g., `lodash`, `JSON.stringify`)
   *
   * @example
   * const userDoc = await User.findById(id);
   * const userObj = userDoc.toObject();
   * delete userObj.password;
   * return res.json(userObj);
   */

  delete sanitizedUser.password;
  delete sanitizedUser.isSuperUser;
  delete sanitizedUser.__v;

  // return replaceMongoIdInObject(sanitizedUser);
  return sanitizedUser;
};

export const authenticateUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password name email");

  if (!user) {
    throw new AppError("Invalid credentials.", 400);
  }

  const passwordMatches = await user.isPasswordValid(password, user.password);
  if (!passwordMatches) {
    throw new AppError("Invalid credentials.", 400);
  }

  // Convert Mongoose document to plain object
  const sanitizedUser = user.toObject(); // or user.toJSON()

  // Remove sensitive data
  delete sanitizedUser.password;

  return sanitizedUser;
};

/**
 * @whyUseLean
 * `.lean()` is used to return a plain JavaScript object instead of a full Mongoose document.
 *
 * @why
 * - You only need to read the data (e.g., for login)
 * - You don’t need Mongoose document features like `.save()` or `.populate()`
 * - It improves performance and uses less memory
 *
 * @benefits
 * - ✅ Faster and Better performance
 * - ✅ Lighter data (no extra Mongoose stuff)
 * - ✅ Easier to clean up/ sanitize (e.g., remove password before sending)
 *
 * @limitations
 * - ❌ You cannot call `.save()` or other Mongoose instance methods on the result
 * - ❌ You can't use Mongoose virtuals, getters, or setters
 * - ✅ You can still modify the object in memory, but changes won't be saved to the database
 *
 * @note
 * Use `.lean()` when you're only reading data and don’t need to update or save the result.
 */
