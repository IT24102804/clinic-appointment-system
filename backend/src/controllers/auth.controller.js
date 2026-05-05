import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/user.model.js";
import Patient from "../models/patient.model.js";
import { signToken } from "../middleware/auth.js";

const userResponse = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role
});

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, NIC, dateOfBirth, gender, address } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedNIC = String(NIC || "").trim().toUpperCase();
    const normalizedPhone = String(phone || "").trim();

    if (!firstName || !lastName || !normalizedEmail || !password || !normalizedPhone || !normalizedNIC || !dateOfBirth || !gender || !address) {
      return res.status(400).json({ success: false, message: "All registration fields are required." });
    }

    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    if (await Patient.findOne({ NIC: normalizedNIC })) {
      return res.status(409).json({ success: false, message: "NIC already registered" });
    }
    if (await Patient.findOne({ phone: normalizedPhone })) {
      return res.status(409).json({ success: false, message: "Phone already registered" });
    }

    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: "patient",
      status: "active"
    });

    const patient = await Patient.create({
      userId: user._id,
      NIC: normalizedNIC,
      phone: normalizedPhone,
      dateOfBirth,
      gender,
      address,
      additionalAddresses: [],
      emergencyContact: null
    });

    user.profileId = patient._id;
    user.refreshToken = crypto.randomBytes(40).toString("hex");
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    const accessToken = signToken({ id: user._id, role: user.role });
    res.status(201).json({ success: true, accessToken, refreshToken: user.refreshToken, user: userResponse(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const { password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password || "", user.password || ""))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.status !== "active") {
      return res.status(401).json({ success: false, message: "Account deactivated" });
    }

    user.refreshToken = crypto.randomBytes(40).toString("hex");
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    const accessToken = signToken({ id: user._id, role: user.role });
    res.json({ success: true, accessToken, refreshToken: user.refreshToken, user: userResponse(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null, refreshTokenExpiry: null });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
