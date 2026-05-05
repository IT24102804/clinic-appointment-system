import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    password: String,
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient"
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    refreshToken: String,
    refreshTokenExpiry: Date,
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient"
    }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
