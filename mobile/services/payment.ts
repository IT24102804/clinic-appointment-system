import api from "./api";

export const uploadPayment = (data: any) => {
    return api.post("/payments/upload", data, {
        headers: { "Content-Type": "multipart/form-data" }
    });
};

export const verifyPayment = (paymentId: string, status: string) => {
    return api.put("/payments/verify", { paymentId, status });
};