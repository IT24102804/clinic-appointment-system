import Payment from "../models/payment.model.js";
import Billing from "../models/billing.model.js";

const getUploadPath = (file) => file?.filename ? `uploads/${file.filename}` : file?.path?.replace(/\\/g, "/");

export const uploadPayment = async (req, res) => {
    try {
        const { billingId, amount, method, reference } = req.body;

        // ✅ Validate billing exists
        const billing = await Billing.findById(billingId);
        if (!billing) {
            return res.status(404).json({ message: "Billing not found" });
        }

        // ❌ Prevent multiple payments
        const existingPayment = await Payment.findOne({ billingId });
        if (existingPayment) {
            if (existingPayment.status !== "rejected") {
                return res.status(400).json({ message: "Payment already submitted" });
            }

            await Payment.findByIdAndDelete(existingPayment._id);
        }

        // ❌ Validate amount
        if (amount != billing.totalAmount) {
            return res.status(400).json({ message: "Incorrect payment amount" });
        }

        // ❌ Validate image
        if (!req.file) {
            return res.status(400).json({ message: "Payment proof required" });
        }

        const payment = await Payment.create({
            billingId,
            amount,
            method,
            reference,
            proofImage: getUploadPath(req.file),
            status: "pending_verification" // ✅ FIXED
        });

        res.status(201).json(payment);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { paymentId, status } = req.body;

        if (!["verified", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        payment.status = status;
        await payment.save();

        // ✅ If approved → mark billing paid
        if (status === "verified") {
            await Billing.findByIdAndUpdate(payment.billingId, {
                status: "accepted"
            });
        } else {
            await Billing.findByIdAndUpdate(payment.billingId, {
                status: "rejected"
            });
        }

        res.json(payment);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
