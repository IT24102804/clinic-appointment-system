function requireAppointmentReadAccess(req, res, next) {
  // Placeholder for future auth integration.
  // Swap this with patient/staff role checks once the auth module exists.
  next();
}

function requireAppointmentWriteAccess(req, res, next) {
  // Placeholder for future auth integration.
  // Swap this with doctor/admin role checks once the auth module exists.
  next();
}

module.exports = {
  requireAppointmentReadAccess,
  requireAppointmentWriteAccess,
};
