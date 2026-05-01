const { body, param } = require("express-validator");

// ID check
const idParamValidator = [
  param("id").isMongoId().withMessage("Invalid doctor ID"),
];

// CREATE
const createDoctorValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  body("specialization").notEmpty().withMessage("Specialization is required"),
  body("phone").notEmpty().withMessage("Phone is required"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),
  // fee and experience come as strings from FormData — use isNumeric which accepts "10", "10.5"
  body("fee")
    .optional()
    .isNumeric()
    .withMessage("Fee must be a number"),
  body("experience")
    .optional()
    .isNumeric()
    .withMessage("Experience must be a number"),
];

// UPDATE
const updateDoctorValidator = [
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("specialization").optional().notEmpty().withMessage("Specialization cannot be empty"),
  body("phone").optional().notEmpty().withMessage("Phone cannot be empty"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),
  body("fee")
    .optional()
    .isNumeric()
    .withMessage("Fee must be a number"),
  body("experience")
    .optional()
    .isNumeric()
    .withMessage("Experience must be a number"),
];

module.exports = { idParamValidator, createDoctorValidator, updateDoctorValidator };