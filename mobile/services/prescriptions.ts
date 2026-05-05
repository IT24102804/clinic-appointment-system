import api from "./api";

export const listPrescriptions = async () => {
  const response = await api.get("/prescriptions");
  return response.data;
};

export const getPrescription = async (id: string) => {
  const response = await api.get(`/prescriptions/${id}`);
  return response.data;
};

export const createPrescription = async (data: any) => {
  const response = await api.post("/prescriptions", data);
  return response.data;
};

export const updatePrescription = async (id: string, data: any) => {
  const response = await api.put(`/prescriptions/${id}`, data);
  return response.data;
};

export const deletePrescription = async (id: string) => {
  const response = await api.delete(`/prescriptions/${id}`);
  return response.data;
};
