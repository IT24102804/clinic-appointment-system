import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { verifyPayment } from "../../../services/payment";
import { getBill } from "../../../services/billing";
import { SERVER_BASE_URL } from "../../../services/api";

const proofImageUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;

    const normalizedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
    return `${SERVER_BASE_URL}/${normalizedPath}`;
};

const patientIdText = (patientId: any) => typeof patientId === "object" ? patientId?._id : patientId;

export default function VerifyScreen() {
    const { id, paymentId } = useLocalSearchParams();
    const router = useRouter();
    const [bill, setBill] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        const fetchBill = async () => {
            try {
                const { data } = await getBill(id as string);
                setBill(data);
            } catch (error) {
                console.error("Failed to load bill:", error);
                Alert.alert("Error", "Could not load bill details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchBill();
    }, [id]);

    const handleVerify = async (status: "verified" | "rejected") => {
        setSubmitting(true);
        try {
            await verifyPayment(paymentId as string, status);
            Alert.alert("Success", status === "verified" ? "Bill accepted." : "Bill rejected.");
            router.back();
        } catch (error: any) {
            console.error("Verification failed:", error);
            Alert.alert("Error", error?.response?.data?.message || "Could not update bill.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f6f7fb" }}>
                <ActivityIndicator size="large" color="#111827" />
            </View>
        );
    }

    const proofUri = proofImageUrl(bill?.proofImage);

    return (
        <View style={{ flex: 1, backgroundColor: "#f6f7fb", padding: 18 }}>
            <View style={{ backgroundColor: "#fff", padding: 18, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb" }}>
                <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827" }}>Review Submitted Bill</Text>

                <View style={{ marginTop: 14, gap: 6 }}>
                    <Text>Appointment ID: {bill?.appointmentId}</Text>
                    <Text>Patient ID: {patientIdText(bill?.patientId)}</Text>
                    <Text>Patient Name: {bill?.patientDisplayName || bill?.patientName}</Text>
                    <Text>Doctor ID: {bill?.doctorId?._id || bill?.doctorId}</Text>
                    <Text>Doctor: Dr. {bill?.doctorId?.name || "Unknown"}</Text>
                    <Text>Doctor Fee: Rs. {bill?.doctorFee}</Text>
                </View>

                <View style={{ backgroundColor: "#f4f6f8", padding: 12, borderRadius: 8, marginTop: 14, marginBottom: 14 }}>
                    <Text style={{ fontWeight: "700", marginBottom: 4 }}>Bank Details</Text>
                    <Text>Bank: {bill?.bankDetails?.bankName}</Text>
                    <Text>Account Name: {bill?.bankDetails?.accountName}</Text>
                    <Text>Account No: {bill?.bankDetails?.accountNumber}</Text>
                    <Text>Branch: {bill?.bankDetails?.branch}</Text>
                </View>

                {proofUri ? (
                    imageFailed ? (
                        <View style={{ backgroundColor: "#fef2f2", padding: 12, borderRadius: 6 }}>
                            <Text style={{ color: "#991b1b" }}>Payment slip could not be loaded.</Text>
                            <Text style={{ color: "#991b1b", marginTop: 4 }}>{proofUri}</Text>
                        </View>
                    ) : (
                        <Image
                            source={{ uri: proofUri }}
                            onError={() => setImageFailed(true)}
                            style={{ height: 260, resizeMode: "contain", backgroundColor: "#f9fafb", borderRadius: 6 }}
                        />
                    )
                ) : (
                    <View style={{ height: 120, alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6", borderRadius: 6 }}>
                        <Text style={{ color: "#6b7280" }}>No proof image found.</Text>
                    </View>
                )}

                <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                    <TouchableOpacity
                        disabled={submitting}
                        onPress={() => handleVerify("verified")}
                        style={{ flex: 1, backgroundColor: submitting ? "#86efac" : "#16a34a", paddingVertical: 13, borderRadius: 6, alignItems: "center" }}
                    >
                        <Text style={{ color: "#fff", fontWeight: "800" }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        disabled={submitting}
                        onPress={() => handleVerify("rejected")}
                        style={{ flex: 1, backgroundColor: submitting ? "#fecaca" : "#dc2626", paddingVertical: 13, borderRadius: 6, alignItems: "center" }}
                    >
                        <Text style={{ color: "#fff", fontWeight: "800" }}>Reject</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
