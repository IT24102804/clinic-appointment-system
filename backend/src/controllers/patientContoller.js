const User = require("../models/User");
const Patient = require("../models/Patient");
const PastPatient = require("../models/PastPatient");
const { validateCreateProfile, validateUpdateProfile } = require("../validators/patientValidators");

// POST /api/patients/profile
const createProfile = async (req, res) => {
  try {
    const existing = await Patient.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Profile already exists",
      });
    }

    const errors = await validateCreateProfile(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const { NIC, phone, dateOfBirth, gender, addressLine1, addressLine2, city } = req.body;

    const patient = await Patient.create({
      userId: req.user._id,
      NIC,
      phone,
      dateOfBirth,
      gender,
      address: {
        addressLine1,
        addressLine2,
        city,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET /api/patients/profile
const getProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id })
      .populate("userId", "firstName lastName email profileImage");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// PUT /api/patients/profile
const updateProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const errors = await validateUpdateProfile(req.body, patient._id);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const { phone, dateOfBirth, gender, addressLine1, addressLine2, city } = req.body;

    let hasChanges = false;

    const currentDobIso = patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString() : null;
    const incomingDobIso = dateOfBirth ? new Date(dateOfBirth).toISOString() : null;

    // only update fields that are provided
    if (phone && phone !== patient.phone) {
      patient.phone = phone;
      hasChanges = true;
    }

    if (dateOfBirth && incomingDobIso !== currentDobIso) {
      patient.dateOfBirth = dateOfBirth;
      hasChanges = true;
    }

    if (gender && gender !== patient.gender) {
      patient.gender = gender;
      hasChanges = true;
    }

    if (addressLine1 && addressLine1 !== patient.address.addressLine1) {
      patient.address.addressLine1 = addressLine1;
      hasChanges = true;
    }

    if (addressLine2 !== undefined && addressLine2 !== patient.address.addressLine2) {
      patient.address.addressLine2 = addressLine2;
      hasChanges = true;
    }

    if (city && city !== patient.address.city) {
      patient.address.city = city;
      hasChanges = true;
    }

    if (!hasChanges) {
      return res.status(200).json({
        success: true,
        message: "No changes detected, profile is already up to date",
        data: patient,
      });
    }

    await patient.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// DELETE /api/patients/profile
const deleteProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const patient = await Patient.findOne({ userId: req.user._id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // copy to past_patients first
    await PastPatient.create({
      originalUserId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImage: user.profileImage,
      NIC: patient.NIC,
      phone: patient.phone,
      deletedBy: "patient",
    });

    // delete patient profile
    await Patient.deleteOne({ userId: req.user._id });

    // delete user account
    await User.deleteOne({ _id: req.user._id });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
};