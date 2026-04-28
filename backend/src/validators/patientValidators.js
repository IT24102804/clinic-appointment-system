const Patient = require("../models/Patient");

const validateCreateProfile = async (data) => {
  const errors = [];

  // firstName check
  if (!data.firstName || data.firstName.trim() === "") {
    errors.push("First name is required");
  }

  // lastName check
  if (!data.lastName || data.lastName.trim() === "") {
    errors.push("Last name is required");
  }

  // NIC check
  if (!data.NIC || data.NIC.trim() === "") {
    errors.push("NIC is required");
  } else if (
    !/^[0-9]{9}[VXvx]$/.test(data.NIC) &&
    !/^[0-9]{12}$/.test(data.NIC)
  ) {
    errors.push("NIC must be old format (123456789V) or new format (123456789012)");
  } else {
    const nicExists = await Patient.findOne({ NIC: data.NIC });
    if (nicExists) errors.push("NIC already registered");
  }

  // phone check
  if (!data.phone || data.phone.trim() === "") {
    errors.push("Phone is required");
  } else if (!/^07[0-9]{8}$/.test(data.phone)) {
    errors.push("Phone must be a valid Sri Lankan mobile number");
  } else {
    const phoneExists = await Patient.findOne({ phone: data.phone });
    if (phoneExists) errors.push("Phone already in use");
  }

  // dateOfBirth check
  if (!data.dateOfBirth) {
    errors.push("Date of birth is required");
  } else {
    const dob = new Date(data.dateOfBirth);
    const today = new Date();

    if (isNaN(dob)) {
      errors.push("Date of birth is invalid");
    } else if (dob > today) {
      errors.push("Date of birth cannot be in the future");
    } else {
      const maxAge = 110;
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - maxAge);
      if (dob < minDate) {
        errors.push("Invalid date of birth");
      }
    }
  }

  // gender check
  const allowedGenders = ["Male", "Female", "Other"];
  if (!data.gender) {
    errors.push("Gender is required");
  } else if (!allowedGenders.includes(data.gender)) {
    errors.push("Gender must be Male, Female, or Other");
  }

  // address check
  if (!data.addressLine1 || data.addressLine1.trim() === "") {
    errors.push("Address line 1 is required");
  }

  if (!data.city || data.city.trim() === "") {
    errors.push("City is required");
  }

  return errors;
};

const validateUpdateProfile = async (data, patientId) => {
  const errors = [];

  // phone check - only if provided
  if (data.phone) {
    if (!/^07[0-9]{8}$/.test(data.phone)) {
      errors.push("Phone must be a valid Sri Lankan mobile number");
    } else {
      const phoneExists = await Patient.findOne({
        phone: data.phone,
        _id: { $ne: patientId },
      });
      if (phoneExists) errors.push("Phone already in use");
    }
  }

  // gender check - only if provided
  if (data.gender) {
    const allowedGenders = ["Male", "Female", "Other"];
    if (!allowedGenders.includes(data.gender)) {
      errors.push("Gender must be Male, Female, or Other");
    }
  }

  // dateOfBirth check - only if provided
  if (data.dateOfBirth) {
    const dob = new Date(data.dateOfBirth);
    const today = new Date();

    if (isNaN(dob)) {
      errors.push("Date of birth is invalid");
    } else if (dob > today) {
      errors.push("Date of birth cannot be in the future");
    }
  }

  return errors;
};

module.exports = { validateCreateProfile, validateUpdateProfile };