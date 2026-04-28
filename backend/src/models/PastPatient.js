const mongoose = require("mongoose");

const pastPatientSchema = new mongoose.Schema(
  {
    originalUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // copied from users
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: null,
    },

    // copied from patients
    NIC: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },

    // deletion info
    deletedAt: {
      type: Date,
      default: Date.now,
    },
    deletedBy: {
      type: String,
      enum: ["patient", "admin"],
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("PastPatient", pastPatientSchema);