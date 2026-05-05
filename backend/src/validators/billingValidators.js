const validateBilling = (req, res, next) => {
  const { patientId, appointmentId, consultationFee } = req.body;

  if (!patientId || !appointmentId || !consultationFee) {
    return res.status(400).json({
      message: "Required fields missing",
    });
  }

  if (consultationFee < 0) {
    return res.status(400).json({
      message: "Invalid consultation fee",
    });
  }

  next();
};

module.exports = { validateBilling };