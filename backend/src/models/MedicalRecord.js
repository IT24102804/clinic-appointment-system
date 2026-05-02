const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true, trim: true },
    dosage:       { type: String, required: true, trim: true },
    frequency:    { type: String, required: true, trim: true },
    duration:     { type: String, required: true, trim: true },
  },
  { _id: false }
);

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient is required"],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    createdBy: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },

    diagnosis:    { type: String, required: [true, "Diagnosis is required"], trim: true },
    symptoms:     { type: [String], default: [] },
    treatment:    { type: String, default: "", trim: true },
    prescription: { type: [prescriptionSchema], default: [] },
    labResults:   { type: String, default: "", trim: true },
    notes:        { type: String, default: "", trim: true },

    vitals: {
      bloodPressure: { type: String,  default: "" },
      heartRate:     { type: Number,  default: null },
      temperature:   { type: Number,  default: null },
      weight:        { type: Number,  default: null },
      height:        { type: Number,  default: null },
    },

    attachmentUrl:      { type: String, default: null },
    attachmentPublicId: { type: String, default: null },
    attachmentType:     { type: String, enum: ["image", "pdf", "other", null], default: null },

    visitDate: { type: Date, required: [true, "Visit date is required"] },

    // ✅ Soft delete — records are NEVER permanently deleted (medical law)
    isDeleted:  { type: Boolean, default: false },
    deletedAt:  { type: Date,    default: null },
  },
  { timestamps: true }
);

medicalRecordSchema.index({ patientId: 1, visitDate: -1 });
medicalRecordSchema.index({ doctorId: 1 });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
