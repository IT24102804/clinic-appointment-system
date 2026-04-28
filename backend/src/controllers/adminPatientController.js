const User = require("../models/User");
const Patient = require("../models/Patient");
const PastPatient = require("../models/PastPatient");
const { validateUpdateProfile } = require("../validators/patientValidators");

// GET /api/patients/admin/all
const getAllPatients = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { NIC: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    const patients = await Patient.find(query)
      .populate("userId", "firstName lastName email profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Patients retrieved successfully",
      data: patients,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET /api/patients/admin/past
const getPastPatients = async (req, res) => {
  try {
    const pastPatients = await PastPatient.find().sort({ deletedAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Past patients retrieved successfully",
      data: pastPatients,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET /api/patients/admin/:id
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("userId", "firstName lastName email profileImage");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient retrieved successfully",
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

// PUT /api/patients/admin/:id
const adminUpdatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
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

    const user = await User.findById(patient.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { firstName, lastName, email } = req.body;

    if (email !== undefined && email !== user.email) {
      const emailExists = await User.findOne({
        email,
        _id: { $ne: user._id },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: ["Email already in use"],
        });
      }
    }

    const { phone, dateOfBirth, gender, addressLine1, addressLine2, city } = req.body;

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;

    if (phone) patient.phone = phone;
    if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
    if (gender) patient.gender = gender;
    if (addressLine1) patient.address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) patient.address.addressLine2 = addressLine2;
    if (city) patient.address.city = city;

    await user.save();
    await patient.save();

    return res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      data: {
        user,
        patient,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// DELETE /api/patients/admin/:id
const adminDeletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const user = await User.findById(patient.userId);

    // copy to past_patients first
    await PastPatient.create({
      originalUserId: patient.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImage: user.profileImage,
      NIC: patient.NIC,
      phone: patient.phone,
      deletedBy: "admin",
    });

    // delete patient profile
    await Patient.deleteOne({ _id: req.params.id });

    // delete user account
    await User.deleteOne({ _id: patient.userId });

    return res.status(200).json({
      success: true,
      message: "Patient deleted successfully",
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
  getAllPatients,
  getPastPatients,
  getPatientById,
  adminUpdatePatient,
  adminDeletePatient,
};