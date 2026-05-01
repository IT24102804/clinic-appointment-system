const express = require("express");

const appointmentController = require("../controllers/appointmentController");
const {
  requireAppointmentReadAccess,
  requireAppointmentWriteAccess,
} = require("../middleware/appointmentAccess");
const validateRequest = require("../middleware/validateRequest");
const {
  appointmentIdParamValidator,
  appointmentQueryValidator,
  availableSlotsQueryValidator,
  createAppointmentValidator,
  updateAppointmentValidator,
} = require("../validators/appointmentValidators");

const router = express.Router();

// GET /api/appointments/available-slots?doctorId=xxx&date=yyyy-mm-dd
// Must be defined BEFORE the /:id route to avoid treating "available-slots" as an id.
router.get(
  "/available-slots",
  requireAppointmentReadAccess,
  availableSlotsQueryValidator,
  validateRequest,
  appointmentController.getAvailableSlots
);

router
  .route("/")
  .get(
    requireAppointmentReadAccess,
    appointmentQueryValidator,
    validateRequest,
    appointmentController.listAppointments
  )
  .post(
    requireAppointmentWriteAccess,
    createAppointmentValidator,
    validateRequest,
    appointmentController.createAppointment
  );

router
  .route("/:id")
  .get(
    requireAppointmentReadAccess,
    appointmentIdParamValidator,
    validateRequest,
    appointmentController.getAppointment
  )
  .put(
    requireAppointmentWriteAccess,
    appointmentIdParamValidator,
    updateAppointmentValidator,
    validateRequest,
    appointmentController.updateAppointment
  )
  .delete(
    requireAppointmentWriteAccess,
    appointmentIdParamValidator,
    validateRequest,
    appointmentController.deleteAppointment
  );

router.patch(
  "/:id/cancel",
  requireAppointmentWriteAccess,
  appointmentIdParamValidator,
  validateRequest,
  appointmentController.cancelAppointment
);

module.exports = router;
