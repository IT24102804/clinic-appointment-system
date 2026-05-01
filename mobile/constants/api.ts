import { Platform } from "react-native";

// On web browser use localhost, on phone use your WiFi IP
export const API_BASE_URL = Platform.OS === "web"
  ? "http://localhost:5000"
  : "http://192.168.1.6:5000"; // ← change this to your WiFi IP for phone

export function toApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
