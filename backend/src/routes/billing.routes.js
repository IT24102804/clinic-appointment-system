import express from "express";
import { upload } from "../middleware/upload.middleware.js";
import { generateBilling, submitPatientBill, getAllBills, getBillById, getBillsByPatient, deletePatientBill } from "../controllers/billing.controller.js";

const router = express.Router();

router.post("/generate", generateBilling);
router.post("/submit", upload.single("proof"), submitPatientBill);
router.get("/", getAllBills);
router.get("/patient/:patientId", getBillsByPatient);
router.delete("/patient/:patientId/:id", deletePatientBill);
router.get("/:id", getBillById);

export default router;
