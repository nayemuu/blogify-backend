import mongoose, { Schema } from "mongoose";
import User from "./userModel.js";

const otpSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    otpCode: {
      type: Number,
      required: [true, "OTP code is required"],
      min: [100000, "OTP must be 6 digits"],
      max: [999999, "OTP must be 6 digits"],
    },

    otpType: {
      type: String,
      required: [true, "OTP type is required"],
      //   enum: ["email_verification", "password_reset", "login"], // optional validation
    },

    issuedAt: {
      type: Date,
      required: true,
      default: Date.now, // explicitly tracks when OTP was sent
    },

    expiresAt: {
      type: Date,
      required: [true, "Expiration time is required"],
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
    },
  },
  { timestamps: true }
);

export const OTP = mongoose.models.OTP ?? mongoose.model("OTP", otpSchema);
