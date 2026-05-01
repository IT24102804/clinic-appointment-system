const { body, param, query } = require("express-validator");

const STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rejected",
  "no-show",
];
const objectIdMessage = "Must be a valid MongoDB ObjectId.";

const appointmentIdParamValidator = [
  param("id").isMongoId().withMessage(objectIdMessage),
];

const appointmentQueryValidator = [
  query("patientId")
    .optional()
    .isMongoId()
    .withMessage("patientId must be a valid MongoDB ObjectId."),
  query("doctorId")
    .optional()
    .isMongoId()
    .withMessage("doctorId must be a valid MongoDB ObjectId."),
  query("status")
    .optional()
    .isIn(STATUSES)
    .withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
  query("dateFrom")
    .optional()
    .isISO8601()
    .withMessage("dateFrom must be a valid ISO date."),
  query("dateTo")
    .optional()
    .isISO8601()
    .withMessage("dateTo must be a valid ISO date."),
];

const createAppointmentValidator = [
  body("patientId")
    .isMongoId()
    .withMessage("patientId must be a valid MongoDB ObjectId."),
  body("doctorId")
    .isMongoId()
    .withMessage("doctorId must be a valid MongoDB ObjectId."),
  body("appointmentDate")
    .isISO8601()
    .withMessage("appointmentDate must be a valid ISO date."),
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("reason is required."),
  body("notes")
    .optional({ values: "null" })
    .isString()
    .withMessage("notes must be text."),
  body("status")
    .optional()
    .isIn(STATUSES)
    .withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

const updateAppointmentValidator = [
  body("patientId")
    .optional()
    .isMongoId()
    .withMessage("patientId must be a valid MongoDB ObjectId."),
  body("doctorId")
    .optional()
    .isMongoId()
    .withMessage("doctorId must be a valid MongoDB ObjectId."),
  body("appointmentDate")
    .optional()
    .isISO8601()
    .withMessage("appointmentDate must be a valid ISO date."),
  body("reason")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("reason cannot be empty when provided."),
  body("notes")
    .optional({ values: "null" })
    .isString()
    .withMessage("notes must be text."),
  body("status")
    .optional()
    .isIn(STATUSES)
    .withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

const availableSlotsQueryValidator = [
  query("doctorId")
    .isMongoId()
    .withMessage("doctorId must be a valid MongoDB ObjectId."),
  query("date")
    .isISO8601()
    .withMessage("date must be a valid ISO date (YYYY-MM-DD)."),
];

module.exports = {
  STATUSES,
  appointmentIdParamValidator,
  appointmentQueryValidator,
  availableSlotsQueryValidator,
  createAppointmentValidator,
  updateAppointmentValidator,
};
