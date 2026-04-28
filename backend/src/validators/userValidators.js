const User = require("../models/User");

const validateUpdateAccount = async (data, currentUserId) => {
  const errors = [];

  if (data.firstName !== undefined && String(data.firstName).trim() === "") {
    errors.push("First name cannot be empty");
  }

  if (data.lastName !== undefined && String(data.lastName).trim() === "") {
    errors.push("Last name cannot be empty");
  }

  if (data.email !== undefined) {
    if (!/^\S+@\S+\.\S+$/.test(String(data.email))) {
      errors.push("Email format is invalid");
    } else {
      const emailExists = await User.findOne({
        email: data.email,
        _id: { $ne: currentUserId },
      });
      if (emailExists) errors.push("Email already in use");
    }
  }

  return errors;
};

module.exports = { validateUpdateAccount };
