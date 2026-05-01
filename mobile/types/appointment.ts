export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected"
  | "no-show";

export type AppointmentPayload = {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  reason: string;
  notes?: string;
  status?: AppointmentStatus;
};

export type DoctorRef = {
  _id: string;
  name: string;
  specialization: string;
  fee: number;
  experience: number;
  photo: string | null;
};

export type Appointment = {
  _id: string;
  patientId: string;
  doctorId: string | DoctorRef;
  appointmentDate: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AvailableSlotsResponse = {
  doctorId: string;
  date: string;
  dayName: string;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: string[];
};
