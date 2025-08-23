import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide your email address"],
      unique: [true, "This email address already exist"],
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email address"],
    },

    picture: {
      type: String,
      default: null,
    },

    password: {
      type: String,
      required: [true, "Please provide your password"],
      trim: true,
      minLength: [
        6,
        "Plase make sure your password is atleast 6 characters long",
      ],
      maxLength: [
        128,
        "Plase make sure your password is less than 128 characters long",
      ],
      select: false,
    },

    passwordChangedAt: Date,

    isSuper: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      required: [true, "status is required"],
      enum: ["active", "inactive", "suspended", "deleted"],
      // active → User can use everything.
      // inactive → User cannot log in or access anything.
      // suspended → User can only see their profile, but cannot post/engage; existing content hidden.
      // deleted → User is soft-deleted (kept in DB for record/audit, but not visible in app).
      default: "active",
    },
  },
  { timestamps: true }
);

/**
 * @middleware Mongoose Pre-Save Hook
 * @description
 * This `pre("save")` middleware is triggered by Mongoose *before* a user document is saved to the database.
 * It is primarily used to hash the password before storage.
 *
 * @triggers
 * ✅ Runs automatically when:
 * - A new document is created and saved using `.save()` or `Model.create()`
 * - An existing document is modified and saved using `.save()`
 *
 * ❌ Does NOT run when using update queries like:
 * - `User.updateOne()`
 * - `User.updateMany()`
 * - `User.findOneAndUpdate()` or `findByIdAndUpdate()`
 * These methods bypass middleware and do not call `.save()`.
 *
 *
 * @async_behavior
 * This middleware is declared as an `async` function. In **Mongoose**, async middleware
 * resolves automatically — Mongoose waits for the promise to resolve or reject.
 *
 * 🔸 Important Note:
 * - In **Mongoose**, you do NOT need to call `next()` manually inside `async` middleware.
 *   - Mongoose will proceed after the async function resolves.
 * - In contrast, **middleware in other frameworks (e.g., Express)** still requires calling `next()`
 *   to move to the next middleware.
 * - ✅ Best Practice: In Mongoose, avoid mixing `async` and `next()` unless you are:
 *   - Doing manual error handling
 *   - Needing clarity or consistency in larger codebases
 *
 * @example
 * const user = new User({ name: "Alice", email: "alice@example.com", password: "secret123" });
 * await user.save(); // --> pre("save") middleware runs here to hash password
 */

userSchema.pre("save", async function (next) {
  /**
   * Only hash the password if it has been modified (or is new).
   * Prevents unnecessary re-hashing during updates that don’t touch the password field.
   */
  if (!this.isModified("password")) {
    return next();
    //if we don't called next() method, then next middleware won't run
    //request will stuck after uploading this data on MongoDB
  }

  /**
   * 🔐Hash the password with bcrypt using a salt round of 10.
   * This ensures secure storage of user passwords in the database.
   */
  this.password = await bcrypt.hash(this.password, 10);

  // Continue to the next middleware
  next();
});

/**
 * Compares a plain text password with a hashed password to check for a match.
 *
 * @param {string} plainPassword - The password input provided by the user (e.g., from login form).
 * @param {string} hashedPassword - The password stored in the database.
 * @returns {Promise<boolean>} - Returns true if passwords match, otherwise false.
 *
 * ⚠️ Do NOT use arrow functions for Mongoose instance methods.
 * Arrow functions do not have their own `this` context, so `this` won't refer to the document instance.
 * Using a regular function ensures that `this` refers to the Mongoose document.
 */
userSchema.methods.isPasswordValid = async function (
  plainPassword,
  hashedPassword
) {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Check if the user's password was changed after a given JWT issued-at (iat) timestamp.
 *
 * @function isPasswordChanged
 * @memberof User
 * @param {number} jwtIat - The JWT "issued at" timestamp in **seconds** (from decoded token).
 * @returns {boolean} True if password was changed after the token was issued, false otherwise.
 *
 * @example
 * const isChanged = user.isPasswordChanged(decodedToken.iat);
 * if (isChanged) {
 *   throw new AppError("Password changed recently. Please log in again.", 401);
 * }
 */

userSchema.methods.isPasswordChanged = function (jwtIat) {
  if (this?.passwordChangedAt) {
    // Convert passwordChangedAt from Date (ms) → seconds
    const passwordChangedAtInSeconds = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );

    // console.log("passwordChangedAt (sec) =", passwordChangedAtInSeconds);
    // console.log("jwtIat (sec) =", jwtIat);

    // Compare in seconds
    return passwordChangedAtInSeconds > jwtIat;
  }

  return false;
};

/*
 * If a User model already exists (due to hot reloading in dev), use it.
 * Otherwise, create a new model.
 */

export const User = mongoose.models.User ?? mongoose.model("User", userSchema);

export default User;

// above comments style is - JSDoc-formatted comments
