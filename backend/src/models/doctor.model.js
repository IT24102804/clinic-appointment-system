import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: String,
    specialization: String,
    email: String,
    phone: String,
    consultationFee: Number,
    doctorFee: Number,
    fee: Number
});

export default mongoose.model("Doctor", doctorSchema);
