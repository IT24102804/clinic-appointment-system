const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safePopulate(query) {
  const registeredModels = Object.keys(mongoose.models);

  if (registeredModels.includes("Patient")) {
    query = query.populate("patientId");
  }

  if (registeredModels.includes("Doctor")) {
    query = query.populate("doctorId");
  }

  return query;
}

function normalizeAppointmentPayload(body) {
  const payload = {
    patientId: body.patientId,
    doctorId: body.doctorId,
    appointmentDate: body.appointmentDate
      ? new Date(body.appointmentDate)
      : body.appointmentDate,
    status: body.status,
    reason: typeof body.reason === "string" ? body.reason.trim() : body.reason,
    notes: typeof body.notes === "string" ? body.notes.trim() : body.notes,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
}

/**
 * Generate 30-minute time slots between `from` and `to` (HH:MM strings).
 * Returns an array of HH:MM strings representing the start of each slot.
 */
function generateSlots(from, to) {
  const slots = [];
  const [fromH, fromM] = from.split(":").map(Number);
  const [toH, toM] = to.split(":").map(Number);
  let current = fromH * 60 + fromM;
  const end = toH * 60 + toM;

  while (current + 30 <= end) {
    const h = String(Math.floor(current / 60)).padStart(2, "0");
    const m = String(current % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += 30;
  }

  return slots;
}

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

/**
 * GET /api/appointments
 * List appointments with optional filters (patientId, doctorId, status, dateFrom, dateTo).
 */
async function listAppointments(req, res) {
  const filters = {};
  const { patientId, doctorId, status, dateFrom, dateTo } = req.query;

  if (patientId) {
    filters.patientId = patientId;
  }

  if (doctorId) {
    filters.doctorId = doctorId;
  }

  if (status) {
    filters.status = status;
  }

  if (dateFrom || dateTo) {
    filters.appointmentDate = {};

    if (dateFrom) {
      filters.appointmentDate.$gte = new Date(dateFrom);
    }

    if (dateTo) {
      filters.appointmentDate.$lte = new Date(dateTo);
    }
  }

  const query = Appointment.find(filters)
    .sort({ appointmentDate: -1 });

  const appointments = await safePopulate(query).lean();

  return res.status(200).json({
    success: true,
    message: "Appointments retrieved successfully.",
    data: appointments,
  });
}

/**
 * GET /api/appointments/:id
 * Retrieve a single appointment by ID with populated references.
 */
async function getAppointment(req, res) {
  const query = Appointment.findById(req.params.id);
  const appointment = await safePopulate(query).lean();

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: "Appointment not found.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Appointment retrieved successfully.",
    data: appointment,
  });
}

/**
 * POST /api/appointments
 * Book a new appointment. Prevents double-booking by checking existing active
 * appointments for the same doctor at the same time.
 */
async function createAppointment(req, res) {
  const payload = normalizeAppointmentPayload(req.body);

  // Prevent double-booking: check for conflicting appointment
  const conflict = await Appointment.findOne({
    doctorId: payload.doctorId,
    appointmentDate: payload.appointmentDate,
    status: { $in: ["pending", "confirmed"] },
  });

  if (conflict) {
    return res.status(409).json({
      success: false,
      message: "This time slot is already booked for the selected doctor.",
    });
  }

  const appointment = await Appointment.create(payload);

  return res.status(201).json({
    success: true,
    message: "Appointment booked successfully.",
    data: appointment,
  });
}

/**
 * PUT /api/appointments/:id
 * Update / reschedule an appointment. If appointmentDate changes the status
 * is automatically reset to "pending".
 */
async function updateAppointment(req, res) {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: "Appointment not found.",
    });
  }

  const payload = normalizeAppointmentPayload(req.body);

  // If the date is changing, check for conflicts and reset status
  if (
    payload.appointmentDate &&
    payload.appointmentDate.getTime() !== appointment.appointmentDate.getTime()
  ) {
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctorId: payload.doctorId || appointment.doctorId,
      appointmentDate: payload.appointmentDate,
      status: { $in: ["pending", "confirmed"] },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "This time slot is already booked for the selected doctor.",
      });
    }

    // Reset status to pending when rescheduling
    payload.status = "pending";
  }

  Object.assign(appointment, payload);
  await appointment.save();

  return res.status(200).json({
    success: true,
    message: "Appointment updated successfully.",
    data: appointment,
  });
}

/**
 * PATCH /api/appointments/:id/cancel
 * Soft-cancel an appointment by setting status to "cancelled".
 */
async function cancelAppointment(req, res) {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: "Appointment not found.",
    });
  }

  if (appointment.status === "cancelled") {
    return res.status(400).json({
      success: false,
      message: "Appointment is already cancelled.",
    });
  }

  appointment.status = "cancelled";
  await appointment.save();

  return res.status(200).json({
    success: true,
    message: "Appointment cancelled successfully.",
    data: appointment,
  });
}

/**
 * DELETE /api/appointments/:id
 * Permanently remove an appointment record.
 */
async function deleteAppointment(req, res) {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: "Appointment not found.",
    });
  }

  await appointment.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Appointment deleted successfully.",
    data: { id: req.params.id },
  });
}

/**
 * GET /api/appointments/available-slots?doctorId=xxx&date=yyyy-mm-dd
 *
 * 1. Fetch the doctor (from Member 2's Doctor model in MongoDB).
 * 2. Find the day-of-week from the requested date (abbreviated: Mon, Tue, etc.).
 * 3. Find matching availability slot from doctor.availability array.
 * 4. Generate 30-minute slots from startTime to endTime.
 * 5. Remove slots that are already booked (status pending/confirmed).
 * 6. Return remaining available slots.
 */
async function getAvailableSlots(req, res) {
  const { doctorId, date } = req.query;

  if (!doctorId || !date) {
    return res.status(400).json({
      success: false,
      message: "doctorId and date query parameters are required.",
    });
  }

  // Attempt to load the Doctor model (provided by Member 2)
  const Doctor = mongoose.models.Doctor;

  if (!Doctor) {
    return res.status(503).json({
      success: false,
      message:
        "Doctor module is not available. Please ensure the Doctor model is registered.",
    });
  }

  const doctor = await Doctor.findById(doctorId).lean();

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Doctor not found.",
    });
  }

  // Determine abbreviated day of week (matches Member 2's format: Mon, Tue, Wed, etc.)
  const requestedDate = new Date(date);
  const dayAbbreviations = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = dayAbbreviations[requestedDate.getDay()];

  // Find availability for this day from the array
  // Member 2's format: availability = [{ day: "Mon", startTime: "08:00", endTime: "14:00" }, ...]
  const dayAvailability = Array.isArray(doctor.availability)
    ? doctor.availability.find((slot) => slot.day === dayName)
    : null;

  if (!dayAvailability || !dayAvailability.startTime || !dayAvailability.endTime) {
    return res.status(200).json({
      success: true,
      message: `Doctor is not available on ${dayName}.`,
      data: {
        doctorId,
        date,
        dayName,
        availableSlots: [],
      },
    });
  }

  // Generate all possible 30-minute slots
  const allSlots = generateSlots(dayAvailability.startTime, dayAvailability.endTime);

  // Find existing bookings for this doctor on this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await Appointment.find({
    doctorId,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ["pending", "confirmed"] },
  }).lean();

  // Extract booked time strings (HH:MM)
  const bookedSlots = new Set(
    existingAppointments.map((appt) => {
      const d = new Date(appt.appointmentDate);
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    })
  );

  // Filter out booked slots
  const availableSlots = allSlots.filter((slot) => !bookedSlots.has(slot));

  return res.status(200).json({
    success: true,
    message: "Available slots retrieved successfully.",
    data: {
      doctorId,
      date,
      dayName,
      totalSlots: allSlots.length,
      bookedSlots: bookedSlots.size,
      availableSlots,
    },
  });
}

module.exports = {
  cancelAppointment,
  createAppointment,
  deleteAppointment,
  getAppointment,
  getAvailableSlots,
  listAppointments,
  updateAppointment,
};
