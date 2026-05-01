const express = require("express");
const cors = require("cors");
const path = require("path");

const doctorRoutes = require("./routes/doctorRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/doctors", doctorRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

module.exports = app;