const Doctor = require("../models/Doctor");
const path = require("path");
const fs = require("fs");

// GET /api/doctors
exports.listDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/doctors
exports.createDoctor = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.availability && typeof body.availability === "string") {
      body.availability = JSON.parse(body.availability);
    }
    if (req.file) body.photo = req.file.filename;
    const doctor = await Doctor.create(body);
    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/doctors/:id
exports.getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/doctors/:id
exports.updateDoctor = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.availability && typeof body.availability === "string") {
      body.availability = JSON.parse(body.availability);
    }
    if (req.file) {
      const old = await Doctor.findById(req.params.id);
      if (old && old.photo) {
        const oldPath = path.join(__dirname, "../../uploads", old.photo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      body.photo = req.file.filename;
    }
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/doctors/:id
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
    if (doctor.photo) {
      const photoPath = path.join(__dirname, "../../uploads", doctor.photo);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }
    res.json({ success: true, message: "Doctor deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};