import express from "express";
import {
  deleteMyProfile,
  deletePatientById,
  getMyProfile,
  getPatientById,
  getPatients,
  updateMyProfile,
  updatePatientById
} from "../controllers/patient.controller.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", protect, authorize("patient"), getMyProfile);
router.patch("/me", protect, authorize("patient"), updateMyProfile);
router.delete("/me", protect, authorize("patient"), deleteMyProfile);
router.get("/", protect, authorize("admin"), getPatients);
router.get("/:id", protect, authorize("admin"), getPatientById);
router.patch("/:id", protect, authorize("admin"), updatePatientById);
router.delete("/:id", protect, authorize("admin"), deletePatientById);

export default router;
