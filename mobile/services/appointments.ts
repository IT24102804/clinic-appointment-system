import api from "./api";

export const listAppointments = async () => {
  const response = await api.get("/appointments");
  return response.data;
};

export const getAppointment = async (id: string) => {
  const response = await api.get(`/appointments/${id}`);
  return response.data;
};

export const createAppointment = async (data: any) => {
  const response = await api.post("/appointments", data);
  return response.data;
};
