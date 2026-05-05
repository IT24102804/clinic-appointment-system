import express from "express";
import multer from "multer";
import { uploadPayment, verifyPayment } from "../controllers/payment.controller.js";

const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.post("/upload", upload.single("proof"), uploadPayment);
router.put("/verify", verifyPayment);

export default router;