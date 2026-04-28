const express = require("express");
const router = express.Router();

const { protect, allowRoles } = require("../middleware/authMiddleware");

const {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
} = require("../controllers/patientContoller");

const {
  getAllPatients,
  getPastPatients,
  getPatientById,
  adminUpdatePatient,
  adminDeletePatient,
} = require("../controllers/adminPatientController");

router.post("/profile", protect, createProfile);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.delete("/profile", protect, deleteProfile);

router.get("/admin/all", protect, allowRoles("admin"), getAllPatients);
router.get("/admin/past", protect, allowRoles("admin"), getPastPatients);
router.get("/admin/:id", protect, allowRoles("admin"), getPatientById);
router.put("/admin/:id", protect, allowRoles("admin"), adminUpdatePatient);
router.delete("/admin/:id", protect, allowRoles("admin"), adminDeletePatient);

module.exports = router;
