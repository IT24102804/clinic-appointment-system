import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
const getJsonHeaders = async () => {
  const token = await AsyncStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const getFormHeaders = async () => {
  const token = await AsyncStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getPatientRecords = async (patientId, page = 1, limit = 10) => {
  const headers = await getJsonHeaders();
  const res = await fetch(
    `${API_URL}/api/medical-records/patient/${patientId}?page=${page}&limit=${limit}`,
    { headers }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch patient records");
  return data;
};

export const getDoctorRecords = async (doctorId, page = 1, limit = 10) => {
  const headers = await getJsonHeaders();
  const res = await fetch(
    `${API_URL}/api/medical-records/doctor/${doctorId}?page=${page}&limit=${limit}`,
    { headers }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch doctor records");
  return data;
};

export const getRecordById = async (recordId) => {
  const headers = await getJsonHeaders();
  const res = await fetch(`${API_URL}/api/medical-records/${recordId}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch record");
  return data;
};

export const createMedicalRecord = async (formData) => {
  const headers = await getFormHeaders();
  const res = await fetch(`${API_URL}/api/medical-records`, {
    method: "POST",
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create record");
  return data;
};

export const updateMedicalRecord = async (recordId, formData) => {
  const headers = await getFormHeaders();
  const res = await fetch(`${API_URL}/api/medical-records/${recordId}`, {
    method: "PUT",
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update record");
  return data;
};

export const deleteMedicalRecord = async (recordId) => {
  const headers = await getJsonHeaders();
  const res = await fetch(`${API_URL}/api/medical-records/${recordId}`, {
    method: "DELETE",
    headers,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete record");
  return data;
};