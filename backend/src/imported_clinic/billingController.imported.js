const Billing = require("../models/billing.model");

// CREATE
const createBilling = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      consultationFee,
      otherCharges = 0,
    } = req.body;

    const totalAmount = consultationFee + otherCharges;

    const bill = await Billing.create({
      patientId,
      appointmentId,
      consultationFee,
      otherCharges,
      totalAmount,
    });

    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// READ ALL
const getAllBillings = async (req, res) => {
  try {
    const bills = await Billing.find()
      .populate("patientId", "name email")
      .populate("appointmentId");

    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// READ ONE
const getBillingById = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate("patientId", "name email")
      .populate("appointmentId");

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
const updateBilling = async (req, res) => {
  try {
    const {
      consultationFee,
      otherCharges,
      paymentStatus,
    } = req.body;

    const bill = await Billing.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    bill.consultationFee = consultationFee ?? bill.consultationFee;
    bill.otherCharges = otherCharges ?? bill.otherCharges;
    bill.totalAmount =
      (bill.consultationFee || 0) + (bill.otherCharges || 0);

    if (paymentStatus) bill.paymentStatus = paymentStatus;

    const updated = await bill.save();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE
const deleteBilling = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    await bill.deleteOne();
    res.json({ message: "Bill deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBilling,
  getAllBillings,
  getBillingById,
  updateBilling,
  deleteBilling,
};