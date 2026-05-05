import Billing from "../models/billing.model.js";
import Doctor from "../models/doctor.model.js";
import Payment from "../models/payment.model.js";
import "../models/patient.model.js";
import "../models/user.model.js";

const clinicBankDetails = {
  bankName: "Commercial Bank",
  accountName: "Clinic Appointment System",
  accountNumber: "1234567890",
  branch: "Colombo"
};

const getDoctorFee = (doctor) => Number(doctor.consultationFee ?? doctor.doctorFee ?? doctor.fee ?? 0) || 0;
const getUploadPath = (file) => file?.filename ? `uploads/${file.filename}` : file?.path?.replace(/\\/g, "/");
const getPatientName = (patient, fallback) => {
  const firstName = patient?.userId?.firstName || "";
  const lastName = patient?.userId?.lastName || "";
  return `${firstName} ${lastName}`.trim() || fallback || "Unknown Patient";
};

const patientPopulate = {
  path: "patientId",
  select: "userId NIC phone",
  populate: { path: "userId", select: "firstName lastName email" }
};

export const generateBilling = async (req, res) => {
  try {
    const { appointmentId, patientId, patientName = "Patient", doctorId, amount } = req.body;

    // ❌ Prevent duplicate billing
    const existing = await Billing.findOne({ appointmentId });
    if (existing) {
      return res.status(400).json({ message: "Billing already exists" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const requestedAmount = Number(amount);
    const fee = Number.isFinite(requestedAmount) && requestedAmount > 0
      ? requestedAmount
      : getDoctorFee(doctor) || 100;

    const billing = await Billing.create({
      appointmentId,
      patientId,
      patientName,
      doctorId,
      doctorFee: fee,
      totalAmount: fee,
      bankDetails: clinicBankDetails,
      status: "pending"
    });

    res.status(201).json(billing);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submitPatientBill = async (req, res) => {
  try {
    const { appointmentId, patientId, patientName, doctorId, method = "Bank Transfer", reference } = req.body;

    if (!appointmentId || !patientId || !patientName || !doctorId) {
      return res.status(400).json({ message: "Appointment, patient, and doctor details are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Payment proof image is required" });
    }

    const existing = await Billing.findOne({ appointmentId, patientId });
    if (existing) {
      return res.status(400).json({ message: "Billing already exists for this appointment" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const fee = getDoctorFee(doctor);
    const billing = await Billing.create({
      appointmentId,
      patientId,
      patientName,
      doctorId,
      doctorFee: fee,
      totalAmount: fee,
      bankDetails: clinicBankDetails,
      status: "pending"
    });

    const payment = await Payment.create({
      billingId: billing._id,
      amount: fee,
      method,
      reference,
      proofImage: getUploadPath(req.file),
      status: "pending_verification"
    });

    res.status(201).json({
      ...billing.toObject(),
      paymentId: payment._id,
      paymentStatus: payment.status,
      proofImage: payment.proofImage
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllBills = async (req, res) => {
  try {
    const bills = await Billing.find()
      .populate(patientPopulate)
      .populate("doctorId", "name")
      .lean();

    const payments = await Payment.find();

    const result = bills.map(bill => {
      const payment = payments.find(
        p => p.billingId.toString() === bill._id.toString()
      );

      return {
        ...bill,
        patientDisplayName: getPatientName(bill.patientId, bill.patientName),
        paymentId: payment?._id || null,
        paymentStatus: payment?.status || "pending",
        paymentDate: payment?.createdAt || null,
        proofImage: payment?.proofImage || null
      };
    }).filter(bill => bill.paymentId);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getBillById = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate(patientPopulate)
      .populate("doctorId", "name consultationFee")
      .lean();

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const payment = await Payment.findOne({ billingId: bill._id }).lean();

    res.json({
      ...bill,
      patientDisplayName: getPatientName(bill.patientId, bill.patientName),
      paymentId: payment?._id || null,
      paymentStatus: payment?.status || "pending",
      paymentDate: payment?.createdAt || null,
      proofImage: payment?.proofImage || null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBillsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const bills = await Billing.find({ patientId })
      .populate(patientPopulate)
      .populate("doctorId", "name")
      .lean();

    const payments = await Payment.find();

    const result = bills.map(bill => {
      const payment = payments.find(
        p => p.billingId.toString() === bill._id.toString()
      );

      return {
        ...bill,
        patientDisplayName: getPatientName(bill.patientId, bill.patientName),
        paymentId: payment?._id || null,
        paymentStatus: payment?.status || "pending",
        paymentDate: payment?.createdAt || null,
        proofImage: payment?.proofImage || null
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePatientBill = async (req, res) => {
  try {
    const { id, patientId } = req.params;
    const bill = await Billing.findById(id);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (bill.patientId.toString() !== patientId) {
      return res.status(403).json({ message: "You can only delete your own bills" });
    }

    const submittedPayment = await Payment.findOne({ billingId: id });
    if (submittedPayment && submittedPayment.status !== "pending_verification") {
      return res.status(400).json({ message: "Cannot delete after admin accepts or rejects the bill" });
    }

    await Billing.findByIdAndDelete(id);
    await Payment.deleteMany({ billingId: id });

    res.json({ message: "Bill deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
