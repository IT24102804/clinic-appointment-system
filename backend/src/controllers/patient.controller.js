import Patient from "../models/patient.model.js";
import User from "../models/user.model.js";

const patientName = (patient) => {
  const firstName = patient.userId?.firstName || "";
  const lastName = patient.userId?.lastName || "";
  return `${firstName} ${lastName}`.trim() || "Unknown Patient";
};

export const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate("userId", "firstName lastName email status")
      .sort({ createdAt: -1 })
      .lean();

    res.json(
      patients.map((patient) => ({
        _id: patient._id,
        userId: patient.userId?._id,
        name: patientName(patient),
        firstName: patient.userId?.firstName || "",
        lastName: patient.userId?.lastName || "",
        email: patient.userId?.email || "",
        status: patient.userId?.status || "",
        NIC: patient.NIC,
        phone: patient.phone,
        gender: patient.gender,
        address: patient.address
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("userId", "firstName lastName email status")
      .lean();

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    res.json({ success: true, data: formatPatient(patient) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const formatPatient = (patient) => ({
  _id: patient._id,
  userId: patient.userId?._id,
  name: patientName(patient),
  firstName: patient.userId?.firstName || "",
  lastName: patient.userId?.lastName || "",
  email: patient.userId?.email || "",
  status: patient.userId?.status || "",
  NIC: patient.NIC,
  phone: patient.phone,
  gender: patient.gender,
  address: patient.address,
  dateOfBirth: patient.dateOfBirth,
  additionalAddresses: patient.additionalAddresses || [],
  emergencyContact: patient.emergencyContact || null
});

export const getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id })
      .populate("userId", "firstName lastName email status")
      .lean();

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    res.json({
      success: true,
      data: formatPatient(patient)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const patientPatch = (body) => {
  const patch = {};
  for (const key of ["phone", "gender", "address", "additionalAddresses", "emergencyContact"]) {
    if (body[key] !== undefined) patch[key] = body[key];
  }
  return patch;
};

const userPatch = (body) => {
  const patch = {};
  for (const key of ["firstName", "lastName", "email", "status"]) {
    if (body[key] !== undefined) patch[key] = body[key];
  }
  return patch;
};

export const updateMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { userId: req.user.id },
      patientPatch(req.body),
      { new: true, runValidators: true }
    ).populate("userId", "firstName lastName email status");

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    res.json({ success: true, data: formatPatient(patient.toObject()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ userId: req.user.id });
    await User.findByIdAndDelete(req.user.id);

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    res.json({ success: true, message: "Patient account deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePatientById = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      patientPatch(req.body),
      { new: true, runValidators: true }
    ).populate("userId", "firstName lastName email status");

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const patch = userPatch(req.body);
    if (Object.keys(patch).length > 0) {
      await User.findByIdAndUpdate(patient.userId._id, patch, { runValidators: true });
    }

    const updated = await Patient.findById(req.params.id).populate("userId", "firstName lastName email status").lean();
    res.json({ success: true, data: formatPatient(updated) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deletePatientById = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    await User.findByIdAndDelete(patient.userId);
    res.json({ success: true, message: "Patient deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
