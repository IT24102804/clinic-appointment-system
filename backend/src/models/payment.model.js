import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    billingId: { type: mongoose.Schema.Types.ObjectId, ref: "Billing", required: true },

    amount: { type: Number, required: true },
    method: { type: String },
    reference: { type: String },

    proofImage: { type: String, required: true },

    status: {
        type: String,
        enum: ["pending_verification", "verified", "rejected"], // ✅ FIXED
        default: "pending_verification"
    }

}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);