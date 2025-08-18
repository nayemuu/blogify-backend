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
    },

    isSuperUser: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🔸 When is userSchema.pre("save") called?
// The `userSchema.pre("save", async function(next) { ... })` middleware
// is automatically called by Mongoose *before* a document is saved to the database.

// ✅ This runs when:
// - A new document is created and saved using `.save()` or `Model.create()`
// - An existing document is modified and `.save()` is called again

// ❌ This will NOT run when using methods like:
// - `User.updateOne()`, `User.updateMany()`
// - `User.findByIdAndUpdate()`, `User.findOneAndUpdate()`
// Those methods skip Mongoose's `.save()` and won't trigger pre-save middleware.

// Example:
// const user = new User({ name: "Alice", email: "alice@example.com", password: "secret123" });
// await user.save(); // <-- pre("save") middleware runs here

userSchema.pre("save", async function (next) {
  // 🔍 Only hash the password if it has been modified or is new
  if (!this.isModified("password")) {
    return next();
    //if we don't called next() method, then next middleware won't run
    //request will stuck after uploading this data on MongoDB
  }

  // 🔐 Hash the password with a salt round of 10
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/*
 * If a User model already exists (due to hot reloading in dev), use it.
 * Otherwise, create a new model.
 */
export const User = mongoose.models.User ?? mongoose.model("User", userSchema);

export default User;
