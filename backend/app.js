import express from "express";
import cors from "cors";

const app = express();

// =======================
// Middleware
// =======================
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use("/uploads", express.static("uploads"));

// =======================
// Routes
// =======================
import billingRoutes from "./src/routes/billing.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import doctorRoutes from "./src/routes/doctor.routes.js";
import patientRoutes from "./src/routes/patient.routes.js";
import authRoutes from "./src/routes/auth.routes.js";

app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);

// =======================
// Health Check Route
// =======================
app.get("/", (req, res) => {
    res.send("Clinic Billing API is running...");
});

// =======================
// Global Error Handler
// =======================
app.use((err, req, res, next) => {
    console.error("Error:", err);

    res.status(500).json({
        message: err.message || "Server Error",
    });
});

export default app;
