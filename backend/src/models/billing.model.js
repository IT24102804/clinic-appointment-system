import mongoose from "mongoose";

const billingSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  patientName: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },

  doctorFee: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  bankDetails: {
    bankName: { type: String },
    accountName: { type: String },
    accountNumber: { type: String },
    branch: { type: String }
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "paid"],
    default: "pending"
  }

}, { timestamps: true });

export default mongoose.model("Billing", billingSchema);
