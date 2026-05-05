import api from "./api";

export const getBills = () => api.get("/billing");
export const getBillsByPatient = (patientId: string) => api.get(`/billing/patient/${patientId}`);
export const getBill = (id: string) => api.get(`/billing/${id}`);
export const createBill = (data: any) => api.post("/billing/generate", data);
export const submitBill = (data: any) => api.post("/billing/submit", data);
export const deletePatientBill = (patientId: string, id: string) => api.delete(`/billing/patient/${patientId}/${id}`);
export const getDoctors = () => api.get("/doctors");
export const getPatients = () => api.get("/patients");
export const getMyPatientProfile = () => api.get("/patients/me");
export const updateMyPatientProfile = (data: any) => api.patch("/patients/me", data);
export const deleteMyPatientProfile = () => api.delete("/patients/me");
export const getPatient = (id: string) => api.get(`/patients/${id}`);
export const updatePatient = (id: string, data: any) => api.patch(`/patients/${id}`, data);
export const deletePatient = (id: string) => api.delete(`/patients/${id}`);
