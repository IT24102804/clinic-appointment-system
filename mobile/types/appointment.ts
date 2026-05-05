export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no-show" | "rejected";

export interface DoctorRef {
  _id: string;
  name: string;
  specialization?: string;
}

export interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string | DoctorRef;
  appointmentDate: string;
  reason: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}
