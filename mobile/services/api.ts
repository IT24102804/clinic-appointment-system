import axios from "axios";

export const API_BASE_URL = "http://192.168.1.9:5000/api";
export const SERVER_BASE_URL = API_BASE_URL.replace("/api", "");

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const setAuthToken = (token?: string | null) => {
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common.Authorization;
    }
};

export default api;
