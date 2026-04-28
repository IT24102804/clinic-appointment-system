const User = require("../models/User");

const validateRegister = async (data) => {
  const errors = [];

  // firstName check
  if (!data.firstName || data.firstName.trim() === "") {
    errors.push("First name is required");
  }

  // lastName check
  if (!data.lastName || data.lastName.trim() === "") {
    errors.push("Last name is required");
  }

  // email check
  if (!data.email) {
    errors.push("Email is required");
  } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
    errors.push("Email format is invalid");
  } else {
    const emailExists = await User.findOne({ email: data.email });
    if (emailExists) errors.push("Email already in use");
  }

  // password check
  if (!data.password) {
    errors.push("Password is required");
  } else if (data.password.length < 8) {
    errors.push("Password must be at least 8 characters");
  } else if (!/[A-Z]/.test(data.password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (!/[0-9]/.test(data.password)) {
    errors.push("Password must contain at least one number");
  } else if (!/[!@#$%^&*]/.test(data.password)) {
    errors.push("Password must contain at least one special character");
  }

  // role check
  const allowedRoles = [
    "patient",
    "doctor",
    "admin",
    "receptionist",
    "pharmacist",
  ];
  if (!data.role) {
    errors.push("Role is required");
  } else if (!allowedRoles.includes(data.role)) {
    errors.push("Invalid role");
  }

  return errors;
};

const validateLogin = (data) => {
  const errors = [];
  if (!data.email) errors.push("Email is required");
  if (!data.password) errors.push("Password is required");
  return errors;
};

module.exports = { validateRegister, validateLogin };