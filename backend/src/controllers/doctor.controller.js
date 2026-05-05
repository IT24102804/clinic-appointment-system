import Doctor from "../models/doctor.model.js";

export const getDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find().select("name specialization consultationFee doctorFee fee").lean();
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
