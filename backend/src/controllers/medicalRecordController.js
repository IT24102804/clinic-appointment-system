const MedicalRecord = require("../models/MedicalRecord");
const Appointment   = require("../models/Appointment"); // <-- Added to register schema for populate
const cloudinary    = require("../multer/cloudinary");

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

const parseJsonField = (value, fallback) => {
  try {
    if (!value) return fallback;
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

// ── CREATE  POST /api/medical-records ─────────────────────────────────────
exports.createRecord = async (req, res) => {
  try {
    const {
      patientId, appointmentId, doctorId,
      diagnosis, symptoms, treatment,
      prescription, labResults, notes,
      vitals, visitDate,
    } = req.body;

    let attachmentUrl = null, attachmentPublicId = null, attachmentType = null;

    if (req.file) {
      attachmentUrl      = req.file.path;       // Cloudinary URL ✅
      attachmentPublicId = req.file.filename;   // Cloudinary public_id ✅
      const mime         = req.file.mimetype;
      attachmentType     = mime.startsWith("image/") ? "image"
                         : mime === "application/pdf" ? "pdf"
                         : "other";
    }

    const record = await MedicalRecord.create({
      patientId:     patientId || req.user.id,
      doctorId:      doctorId  || null,
      appointmentId: appointmentId || null,
      createdBy:     req.user.role,
      diagnosis,
      symptoms:      parseJsonField(symptoms, []),
      treatment,
      prescription:  parseJsonField(prescription, []),
      labResults,
      notes,
      vitals:        parseJsonField(vitals, {}),
      visitDate,
      attachmentUrl,
      attachmentPublicId,
      attachmentType,
    });

    res.status(201).json({
      success: true,
      message: "Medical record created successfully",
      data: record,
    });
  } catch (error) {
    console.error("createRecord error:", error);
    sendError(res, 500, error.message || "Failed to create medical record");
  }
};

// ── GET ALL BY PATIENT  GET /api/medical-records/patient/:patientId ────────
exports.getRecordsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    // ✅ Filter out soft-deleted records
    const filter = { patientId, isDeleted: false };

    const [records, total] = await Promise.all([
      MedicalRecord.find(filter)
        .populate("patientId",     "name email")
        .populate("doctorId",      "name email specialization")
        .populate("appointmentId", "appointmentDate timeSlot reason")
        .sort({ visitDate: -1 })
        .skip(skip)
        .limit(limit),
      MedicalRecord.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, data: records, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    sendError(res, 500, error.message || "Failed to fetch patient records");
  }
};

// ── GET ALL BY DOCTOR  GET /api/medical-records/doctor/:doctorId ──────────
exports.getRecordsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const filter = { doctorId, isDeleted: false };

    const [records, total] = await Promise.all([
      MedicalRecord.find(filter)
        .populate("patientId",     "name email")
        .populate("doctorId",      "name email specialization")
        .populate("appointmentId", "appointmentDate timeSlot reason")
        .sort({ visitDate: -1 })
        .skip(skip)
        .limit(limit),
      MedicalRecord.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, data: records, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    sendError(res, 500, "Failed to fetch doctor records");
  }
};

// ── GET SINGLE  GET /api/medical-records/:id ──────────────────────────────
exports.getRecordById = async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.id, isDeleted: false })
      .populate("patientId",     "name email dateOfBirth")
      .populate("doctorId",      "name email specialization")
      .populate("appointmentId", "appointmentDate timeSlot reason");

    if (!record) return sendError(res, 404, "Medical record not found");

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    sendError(res, 500, "Failed to fetch medical record");
  }
};

// ── UPDATE  PUT /api/medical-records/:id ──────────────────────────────────
exports.updateRecord = async (req, res) => {
  try {
    const existing = await MedicalRecord.findOne({ _id: req.params.id, isDeleted: false });
    if (!existing) return sendError(res, 404, "Medical record not found");

    const isOwner  = existing.patientId.toString() === req.user.id;
    const isDoctor = existing.doctorId?.toString() === req.user.id;
    const isAdmin  = req.user.role === "admin";

    if (!isOwner && !isDoctor && !isAdmin) {
      return sendError(res, 403, "Not allowed to update this record");
    }

    const updateData = {
      diagnosis:    req.body.diagnosis,
      symptoms:     parseJsonField(req.body.symptoms,     existing.symptoms),
      treatment:    req.body.treatment,
      prescription: parseJsonField(req.body.prescription, existing.prescription),
      labResults:   req.body.labResults,
      notes:        req.body.notes,
      vitals:       parseJsonField(req.body.vitals,       existing.vitals),
      visitDate:    req.body.visitDate,
    };

    if (req.file) {
      // Delete old file from Cloudinary before uploading new one
      if (existing.attachmentPublicId) {
        await cloudinary.uploader.destroy(existing.attachmentPublicId);
      }
      updateData.attachmentUrl      = req.file.path;
      updateData.attachmentPublicId = req.file.filename;
      const mime = req.file.mimetype;
      updateData.attachmentType = mime.startsWith("image/") ? "image"
                                : mime === "application/pdf" ? "pdf" : "other";
    }

    const updated = await MedicalRecord.findByIdAndUpdate(
      req.params.id, updateData, { new: true, runValidators: true }
    )
      .populate("patientId", "name email")
      .populate("doctorId",  "name email specialization");

    res.status(200).json({ success: true, message: "Medical record updated successfully", data: updated });
  } catch (error) {
    console.error("updateRecord error:", error);
    sendError(res, 500, "Failed to update medical record");
  }
};

// ── SOFT DELETE  DELETE /api/medical-records/:id ──────────────────────────
// ✅ Records are NEVER permanently deleted (medical law)
// We set isDeleted: true and record the time
exports.deleteRecord = async (req, res) => {
  try {
    const existing = await MedicalRecord.findOne({ _id: req.params.id, isDeleted: false });
    if (!existing) return sendError(res, 404, "Medical record not found");

    const isOwner = existing.patientId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return sendError(res, 403, "Not allowed to delete this record");
    }

    // ✅ SOFT DELETE — just hide it, do not erase from database
    await MedicalRecord.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    res.status(200).json({ success: true, message: "Medical record deleted successfully" });
  } catch (error) {
    console.error("deleteRecord error:", error);
    sendError(res, 500, "Failed to delete medical record");
  }
};
