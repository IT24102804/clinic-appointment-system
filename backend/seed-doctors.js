const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./src/config/db");
require("./src/models/Doctor");

const doctors = [
  {
    name: "Dr. Kamal Perera",
    specialization: "Cardiologist",
    phone: "0771234566",
    email: "kamal.perera@clinic.com",
    experience: 12,
    fee: 3500,
    status: "active",
    availability: [
      { day: "Mon", startTime: "08:00", endTime: "14:00" },
      { day: "Wed", startTime: "08:00", endTime: "14:00" },
      { day: "Fri", startTime: "08:00", endTime: "14:00" },
    ],
  },
  {
    name: "Dr. Nimal Silva",
    specialization: "Dermatologist",
    phone: "0779876543",
    email: "nimal.silva@clinic.com",
    experience: 8,
    fee: 2500,
    status: "active",
    availability: [
      { day: "Tue", startTime: "09:00", endTime: "15:00" },
      { day: "Thu", startTime: "09:00", endTime: "15:00" },
      { day: "Sat", startTime: "10:00", endTime: "13:00" },
    ],
  },
  {
    name: "Dr. Amaya Fernando",
    specialization: "Pediatrician",
    phone: "0765554321",
    email: "amaya.fernando@clinic.com",
    experience: 15,
    fee: 3000,
    status: "active",
    availability: [
      { day: "Mon", startTime: "10:00", endTime: "16:00" },
      { day: "Tue", startTime: "10:00", endTime: "16:00" },
      { day: "Wed", startTime: "10:00", endTime: "16:00" },
      { day: "Thu", startTime: "10:00", endTime: "16:00" },
      { day: "Fri", startTime: "10:00", endTime: "16:00" },
    ],
  },
];

async function seed() {
  await connectDB();
  const Doctor = mongoose.model("Doctor");

  const existing = await Doctor.countDocuments();
  if (existing > 0) {
    console.log(`Already ${existing} doctors in the database. Skipping seed.`);
    process.exit(0);
  }

  const result = await Doctor.insertMany(doctors);
  console.log(`Seeded ${result.length} test doctors:`);
  result.forEach((doc) => {
    console.log(`  - ${doc.name} (${doc.specialization}) — ID: ${doc._id}`);
  });

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
