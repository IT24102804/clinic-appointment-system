const mongoose = require("mongoose");

const availabilitySlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    required: true,
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    experience: { type: Number, default: 0 },
    fee: { type: Number, default: 0 },
    photo: { type: String, default: null },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    availability: [availabilitySlotSchema],
    emergencyContact: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);