const User = require("../models/User");
const Patient = require("../models/Patient");
const PastPatient = require("../models/PastPatient");
const { validateUpdateAccount } = require("../validators/userValidators");
const { uploadToCloudinary, deleteFromCloudinary } = require("../middleware/uploadMiddleware");

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.profileImage) {
      await deleteFromCloudinary(user.profileImage);
    }

    const imageUrl = await uploadToCloudinary(req.file.path, "profile_pictures");
    user.profileImage = imageUrl;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      data: {
        profileImage: user.profileImage,
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

const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.profileImage) {
      await deleteFromCloudinary(user.profileImage);
    }

    user.profileImage = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully",
      data: {
        profileImage: null,
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

const updateAccount = async (req, res) => {
  try {
    const errors = await validateUpdateAccount(req.body, req.user._id);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { firstName, lastName, email } = req.body;

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account updated successfully",
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
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

const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const patient = await Patient.findOne({ userId: req.user._id });

    if (patient) {
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

      await Patient.deleteOne({ userId: req.user._id });
    }

    if (user.profileImage) {
      await deleteFromCloudinary(user.profileImage);
    }

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
  uploadProfilePicture,
  deleteProfilePicture,
  updateAccount,
  deleteAccount,
};
