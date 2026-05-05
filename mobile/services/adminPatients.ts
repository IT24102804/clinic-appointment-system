import api from "./api";

export interface AdminPatientDetail {
  _id: string;
  NIC: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  additionalAddresses?: Array<{
    _id: string;
    label: string;
    line: string;
  }>;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  };
}

export const getPatient = async (id: string): Promise<AdminPatientDetail> => {
  const response = await api.get(`/patients/${id}`);
  return response.data;
};
