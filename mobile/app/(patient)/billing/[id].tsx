import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getBill } from "../../../services/billing";
import { SERVER_BASE_URL } from "../../../services/api";

const statusLabel = (bill: any) => {
    if (bill.paymentStatus === "verified" || bill.status === "accepted") return "accepted";
    if (bill.paymentStatus === "rejected" || bill.status === "rejected") return "rejected";
    return "pending";
};

const proofImageUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;

    const normalizedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
    return `${SERVER_BASE_URL}/${normalizedPath}`;
};

const patientIdText = (patientId: any) => typeof patientId === "object" ? patientId?._id : patientId;

export default function BillingDetail() {
    const { id } = useLocalSearchParams();
    const [bill, setBill] = useState<any>(null);
    const [loading, setLoading] = useState(true);
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

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f6f7fb" }}>
                <ActivityIndicator size="large" color="#2e86de" />
            </View>
        );
    }

    const proofUri = proofImageUrl(bill?.proofImage);

    return (
        <View style={{ flex: 1, backgroundColor: "#f6f7fb", padding: 18 }}>
            <View style={{ backgroundColor: "#fff", padding: 18, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb" }}>
                <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 12 }}>Bill Details</Text>
                <Text>Status: {bill ? statusLabel(bill) : "pending"}</Text>
                <Text>Appointment ID: {bill?.appointmentId}</Text>
                <Text>Patient ID: {patientIdText(bill?.patientId)}</Text>
                <Text>Patient Name: {bill?.patientDisplayName || bill?.patientName}</Text>
                <Text>Doctor ID: {bill?.doctorId?._id || bill?.doctorId}</Text>
                <Text>Doctor: Dr. {bill?.doctorId?.name || "Unknown"}</Text>
                <Text>Doctor Fee: Rs. {bill?.doctorFee}</Text>

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
                            style={{ height: 220, resizeMode: "contain", backgroundColor: "#f9fafb", borderRadius: 6 }}
                        />
                    )
                ) : (
                    <Text>No uploaded image found.</Text>
                )}
            </View>
        </View>
    );
}
