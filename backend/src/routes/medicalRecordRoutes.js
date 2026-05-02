const express  = require("express");
const router   = express.Router();
const upload   = require("../multer/upload");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const {
  createRecord,
  getRecordsByPatient,
  getRecordsByDoctor,
  getRecordById,
  updateRecord,
  deleteRecord,
} = require("../controllers/medicalRecordController");

// POST   /api/medical-records         — patient OR doctor can create
router.post(   "/",                      protect, upload.single("attachment"), createRecord);

// GET    /api/medical-records/patient/:patientId
router.get(    "/patient/:patientId",    protect, getRecordsByPatient);

// GET    /api/medical-records/doctor/:doctorId
router.get(    "/doctor/:doctorId",      protect, authorizeRoles("doctor","admin"), getRecordsByDoctor);

// GET    /api/medical-records/:id
router.get(    "/:id",                   protect, getRecordById);

// PUT    /api/medical-records/:id
router.put(    "/:id",                   protect, upload.single("attachment"), updateRecord);

// DELETE /api/medical-records/:id
router.delete( "/:id",                   protect, deleteRecord);

module.exports = router;
