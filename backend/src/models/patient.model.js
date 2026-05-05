import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    NIC: { type: String, trim: true },
    phone: { type: String, trim: true },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"]
    },
    address: { type: String, trim: true },
    additionalAddresses: [
      {
        label: {
          type: String,
          enum: ["home", "work", "other"],
          default: "other"
        },
        line: { type: String, trim: true }
      }
    ],
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  { timestamps: true }
);

export default mongoose.models.Patient || mongoose.model("Patient", patientSchema);
